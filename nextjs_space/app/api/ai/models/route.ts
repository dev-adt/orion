export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// Fetches the list of models the given API key is actually allowed to use,
// directly from the provider. This removes all guesswork about valid model names.
// The key is only forwarded to the provider, never logged or stored.

type ProviderCfg = {
  url: string;
  format: 'openai' | 'anthropic';
};

const PROVIDERS: Record<string, ProviderCfg> = {
  openai: { url: 'https://api.openai.com/v1/models', format: 'openai' },
  anthropic: { url: 'https://api.anthropic.com/v1/models', format: 'anthropic' },
  google: { url: 'https://generativelanguage.googleapis.com/v1beta/openai/models', format: 'openai' },
  deepseek: { url: 'https://api.deepseek.com/models', format: 'openai' },
  openrouter: { url: 'https://openrouter.ai/api/v1/models', format: 'openai' },
  abacus: { url: 'https://routellm.abacus.ai/v1/models', format: 'openai' },
  nvidia: { url: 'https://integrate.api.nvidia.com/v1/models', format: 'openai' },
  kimi: { url: 'https://api.moonshot.ai/v1/models', format: 'openai' },
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-ai-key') || '';
    const providerId = (request.headers.get('x-ai-provider') || 'openai').toLowerCase();
    const provider = PROVIDERS[providerId] ?? PROVIDERS.openai;

    if (!apiKey.trim()) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const headers: Record<string, string> =
      provider.format === 'anthropic'
        ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
        : { Authorization: `Bearer ${apiKey}` };

    const res = await fetch(provider.url, { method: 'GET', headers });
    const text = await res.text();

    if (!res.ok) {
      console.error(`AI models list (${providerId}) error: ${res.status} ${text}`);
      return NextResponse.json(
        { error: `Provider returned ${res.status}`, detail: text.slice(0, 500) },
        { status: res.status },
      );
    }

    let json: any = {};
    try { json = JSON.parse(text); } catch {}

    // Both Anthropic and OpenAI-compatible endpoints return { data: [{ id, ... }] }
    const raw: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : [];
    const models: string[] = raw
      .map((m: any) => m?.id || m?.name || '')
      .filter(Boolean);

    return NextResponse.json({ models });
  } catch (err: any) {
    console.error('AI models list exception:', err?.message || err);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
