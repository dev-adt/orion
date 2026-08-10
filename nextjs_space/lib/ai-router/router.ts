/**
 * AI Router - main routing logic (adapted for this app).
 *
 * Differs from the original handover code in two important ways so it works
 * in this app's production environment:
 *   1. API keys are INJECTED (from the caller / client-side per-provider keys),
 *      NOT read from process.env — this app stores keys client-side.
 *   2. NO filesystem usage-tracking (ephemeral server). The caller persists
 *      usage to the database instead, using the returned usage fields.
 */

import {
  getAvailableModelChain,
  estimateCost,
  type Complexity,
  type ModelDefinition,
  type Provider,
} from './model-config';
import { classify, type ChatMessage } from './classifier';

export interface RouteChatParams {
  question: string;
  history?: ChatMessage[];
  systemPrompt?: string;
  /** Map of provider -> API key. Only providers present here are eligible. */
  keys: Partial<Record<Provider, string>>;
  maxRetriesPerModel?: number;
  temperature?: number;
}

export interface RouteChatResult {
  answer: string;
  complexity: Complexity;
  modelUsed: string;
  provider: string;
  fallbackUsed: boolean;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  classificationReasons: string[];
  attemptedModels: string[];
}

interface ProviderResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildMessages(question: string, history: ChatMessage[], systemPrompt?: string): ChatMessage[] {
  const msgs: ChatMessage[] = [];
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
  msgs.push(...history);
  msgs.push({ role: 'user', content: question });
  return msgs;
}

async function callOpenAI(
  model: ModelDefinition, apiKey: string, question: string,
  history: ChatMessage[], systemPrompt: string | undefined, temperature: number,
): Promise<ProviderResponse> {
  const messages = buildMessages(question, history, systemPrompt);
  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model.apiModelName, messages, temperature, max_tokens: model.maxTokens }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`[OpenAI] HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  const inputTokens = data?.usage?.prompt_tokens ?? estimateTokens(messages.map((m) => m.content).join(' '));
  const outputTokens = data?.usage?.completion_tokens ?? estimateTokens(text);
  return { text, inputTokens, outputTokens };
}

async function callGemini(
  model: ModelDefinition, apiKey: string, question: string,
  history: ChatMessage[], systemPrompt: string | undefined, temperature: number,
): Promise<ProviderResponse> {
  const url = `${model.endpoint}/${model.apiModelName}:generateContent?key=${apiKey}`;
  const contents = [
    ...history.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];
  const body: any = { contents, generationConfig: { temperature, maxOutputTokens: model.maxTokens } };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`[Gemini] HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  const inputTokens = data?.usageMetadata?.promptTokenCount ??
    estimateTokens(contents.map((c) => c.parts.map((p) => p.text).join(' ')).join(' '));
  const outputTokens = data?.usageMetadata?.candidatesTokenCount ?? estimateTokens(text);
  return { text, inputTokens, outputTokens };
}

async function callAnthropic(
  model: ModelDefinition, apiKey: string, question: string,
  history: ChatMessage[], systemPrompt: string | undefined, temperature: number,
): Promise<ProviderResponse> {
  const messages = [
    ...history.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];
  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: model.apiModelName, system: systemPrompt, messages, temperature, max_tokens: model.maxTokens }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`[Anthropic] HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const text = data?.content?.map((c: any) => c.text).join('') ?? '';
  const inputTokens = data?.usage?.input_tokens ?? estimateTokens(messages.map((m) => m.content).join(' '));
  const outputTokens = data?.usage?.output_tokens ?? estimateTokens(text);
  return { text, inputTokens, outputTokens };
}

async function callProvider(
  model: ModelDefinition, apiKey: string, question: string,
  history: ChatMessage[], systemPrompt: string | undefined, temperature: number,
): Promise<ProviderResponse> {
  switch (model.provider) {
    case 'openai': return callOpenAI(model, apiKey, question, history, systemPrompt, temperature);
    case 'gemini': return callGemini(model, apiKey, question, history, systemPrompt, temperature);
    case 'anthropic': return callAnthropic(model, apiKey, question, history, systemPrompt, temperature);
    default: throw new Error(`[ai-router] Unsupported provider: ${model.provider}`);
  }
}

async function callWithRetry(
  model: ModelDefinition, apiKey: string, params: RouteChatParams,
  temperature: number, maxRetries: number,
): Promise<ProviderResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callProvider(model, apiKey, params.question, params.history ?? [], params.systemPrompt, temperature);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) await sleep(300 * Math.pow(2, attempt));
    }
  }
  throw lastError;
}

export async function routeChat(params: RouteChatParams): Promise<RouteChatResult> {
  const { question, history = [], keys, maxRetriesPerModel = 1 } = params;
  if (!question || !question.trim()) throw new Error('[ai-router] `question` is empty');

  const availableProviders = new Set<Provider>(
    (Object.keys(keys) as Provider[]).filter((p) => !!keys[p]),
  );
  if (availableProviders.size === 0) throw new Error('[ai-router] No provider keys available');

  const { complexity, reasons } = classify(question, history);
  const modelChain = getAvailableModelChain(complexity, availableProviders);
  if (modelChain.length === 0) throw new Error('[ai-router] No eligible model for available keys');

  const attemptedModels: string[] = [];
  let lastError: unknown;

  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    const apiKey = keys[model.provider];
    if (!apiKey) continue;
    attemptedModels.push(model.id);
    const temperature = params.temperature ?? model.defaultTemperature;
    try {
      const resp = await callWithRetry(model, apiKey, params, temperature, maxRetriesPerModel);
      if (!resp.text?.trim()) throw new Error(`[ai-router] ${model.id} returned empty response`);
      const cost = estimateCost(model, resp.inputTokens, resp.outputTokens);
      return {
        answer: resp.text,
        complexity,
        modelUsed: model.id,
        provider: model.provider,
        fallbackUsed: i > 0,
        inputTokens: resp.inputTokens,
        outputTokens: resp.outputTokens,
        estimatedCost: cost,
        classificationReasons: reasons,
        attemptedModels,
      };
    } catch (err) {
      lastError = err;
      console.error(`[ai-router] Model ${model.id} failed, trying next fallback.`,
        err instanceof Error ? err.message : err);
    }
  }

  throw new Error(
    `[ai-router] All models failed for ${complexity}. Tried: ${attemptedModels.join(', ')}. ` +
    `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}
