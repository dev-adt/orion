/**
 * AI Router - Model configuration (adapted for this app).
 * Central place to declare every model the router can pick, its provider,
 * estimated cost, and which complexity tier it serves.
 */

export type Provider = 'openai' | 'gemini' | 'anthropic';
export type Complexity = 'SIMPLE' | 'MEDIUM' | 'COMPLEX';

export interface ModelDefinition {
  id: string;
  label: string;
  provider: Provider;
  apiModelName: string;
  endpoint: string;
  inputCostPer1K: number;
  outputCostPer1K: number;
  maxTokens: number;
  defaultTemperature: number;
  suitableFor: Complexity[];
}

export const MODELS: Record<string, ModelDefinition> = {
  // SIMPLE: cheapest — everyday Q&A, product suggestions
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    provider: 'gemini',
    apiModelName: 'gemini-2.0-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    inputCostPer1K: 0.0001,
    outputCostPer1K: 0.0004,
    maxTokens: 4096,
    defaultTemperature: 0.7,
    suitableFor: ['SIMPLE'],
  },
  // MEDIUM: analysis, summaries, order/ERP style queries
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'openai',
    apiModelName: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    inputCostPer1K: 0.00015,
    outputCostPer1K: 0.0006,
    maxTokens: 4096,
    defaultTemperature: 0.5,
    suitableFor: ['MEDIUM'],
  },
  // COMPLEX: reasoning, code, multi-step comparison
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    label: 'Claude Sonnet 3.5',
    provider: 'anthropic',
    apiModelName: 'claude-3-5-sonnet-latest',
    endpoint: 'https://api.anthropic.com/v1/messages',
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    maxTokens: 4096,
    defaultTemperature: 0.4,
    suitableFor: ['COMPLEX'],
  },
  'gpt-4o': {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    apiModelName: 'gpt-4o',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    inputCostPer1K: 0.0025,
    outputCostPer1K: 0.01,
    maxTokens: 4096,
    defaultTemperature: 0.4,
    suitableFor: ['COMPLEX'],
  },
};

/** Baseline model used to estimate "what it would have cost without routing". */
export const BASELINE_MODEL_ID = 'gpt-4o';

/** Priority chain per complexity: first is primary, rest are fallbacks. */
export const ROUTING_MAP: Record<Complexity, string[]> = {
  SIMPLE: ['gemini-2.0-flash', 'gpt-4o-mini', 'gpt-4o'],
  MEDIUM: ['gpt-4o-mini', 'gemini-2.0-flash', 'gpt-4o'],
  COMPLEX: ['claude-3-5-sonnet', 'gpt-4o', 'gpt-4o-mini'],
};

export const DEFAULT_MODEL_ID = 'gpt-4o-mini';

export function getModel(id: string): ModelDefinition {
  const model = MODELS[id];
  if (!model) throw new Error(`[model-config] Unknown model id="${id}"`);
  return model;
}

/**
 * Ordered model chain for a complexity, filtered to providers that actually
 * have an API key available. If nothing in the tier is available, falls back
 * to ANY model whose provider is available (cheapest first).
 */
export function getAvailableModelChain(
  complexity: Complexity,
  availableProviders: Set<Provider>,
): ModelDefinition[] {
  const ids = ROUTING_MAP[complexity] || [DEFAULT_MODEL_ID];
  let chain = ids.map((id) => getModel(id)).filter((m) => availableProviders.has(m.provider));
  if (chain.length === 0) {
    chain = Object.values(MODELS)
      .filter((m) => availableProviders.has(m.provider))
      .sort((a, b) => a.inputCostPer1K - b.inputCostPer1K);
  }
  return chain;
}

export function estimateCost(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
): number {
  return (inputTokens / 1000) * model.inputCostPer1K + (outputTokens / 1000) * model.outputCostPer1K;
}
