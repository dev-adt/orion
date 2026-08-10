export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { routeChat, type RouteChatResult } from '@/lib/ai-router/router';
import { estimateCost, getModel, BASELINE_MODEL_ID, type Provider } from '@/lib/ai-router/model-config';

// Decode the base64-encoded per-provider key map sent by the client when the
// active provider is the AI Router. Remaps this app's provider id `google`
// to the router's `gemini`, and drops providers the router does not support.
function parseRouterKeys(header: string | null): Partial<Record<Provider, string>> {
  if (!header) return {};
  try {
    const json = JSON.parse(Buffer.from(header, 'base64').toString('utf-8')) as Record<string, string>;
    const out: Partial<Record<Provider, string>> = {};
    for (const [rawKey, value] of Object.entries(json)) {
      if (!value) continue;
      const provider = (rawKey === 'google' ? 'gemini' : rawKey) as Provider;
      if (provider === 'openai' || provider === 'gemini' || provider === 'anthropic') {
        out[provider] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

// Multi-provider AI Chat proxy.
// Forwards the user's API key to the selected provider. Never logs or stores the key.
// All supported providers expose an OpenAI-compatible /chat/completions endpoint
// that streams responses in the same SSE format, so the client parsing stays identical.
const PROVIDERS: Record<string, { url: string; defaultModel: string; format?: 'openai' | 'anthropic'; extraHeaders?: Record<string, string> }> = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-latest',
    format: 'anthropic',
  },
  google: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-1.5-flash',
  },
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o-mini',
  },
  abacus: {
    url: 'https://routellm.abacus.ai/v1/chat/completions',
    defaultModel: 'route-llm',
  },
  nvidia: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
  },
  kimi: {
    url: 'https://api.moonshot.ai/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
  },
};

const KNOWLEDGE_BUDGET = 14000; // max chars of knowledge base injected into context

function getBaseUrl() {
  return (process.env.NEXTAUTH_URL || 'https://shop.edunow.today').replace(/\/$/, '');
}

export async function POST(request: NextRequest) {
  try {
    // Backwards compatible: accept the old x-openai-key header too
    const apiKey = request.headers.get('x-ai-key') || request.headers.get('x-openai-key');

    // Load the server-side trained assistant config (source of truth for prompt/model/provider)
    let dbConfig: any = null;
    try {
      dbConfig = await prisma.aiConfig.findUnique({ where: { key: 'default' } });
    } catch {}

    const providerId = (request.headers.get('x-ai-provider') || dbConfig?.provider || 'openai').toLowerCase();
    const provider = PROVIDERS[providerId] ?? PROVIDERS.openai;
    const model = request.headers.get('x-ai-model') || dbConfig?.model || provider.defaultModel;

    if (!apiKey && providerId !== 'router') {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, systemPrompt: clientPrompt } = body ?? {};

    const basePrompt =
      dbConfig?.systemPrompt?.trim() ||
      clientPrompt ||
      'Bạn là trợ lý mua sắm thân thiện.';
    const useWebsiteData = dbConfig ? dbConfig.useWebsiteData !== false : true;

    const baseUrl = getBaseUrl();
    const sections: string[] = [basePrompt];

    // --- Website data (products + posts) with concrete links ---
    if (useWebsiteData) {
      try {
        const products = await prisma.product.findMany({
          where: { active: true },
          select: {
            name: true, slug: true, price: true, description: true,
            category: { select: { name: true } },
          },
          orderBy: { featured: 'desc' },
          take: 40,
        });
        if (products.length) {
          const lines = products.map((p: any) => {
            const url = `${baseUrl}/products/${p?.slug}`;
            const price = new Intl.NumberFormat('vi-VN').format(p?.price ?? 0);
            const desc = (p?.description ?? '').replace(/\s+/g, ' ').slice(0, 120);
            return `- ${p?.name} | ${p?.category?.name ?? ''} | ${price}đ | ${url}${desc ? ` | ${desc}` : ''}`;
          });
          sections.push(`SAN PHAM HIEN CO (tên | danh mục | giá | link | mô tả):\n${lines.join('\n')}`);
        }
      } catch {}

      try {
        const posts = await prisma.post.findMany({
          where: { published: true },
          select: { title: true, slug: true, excerpt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        if (posts.length) {
          const lines = posts.map((p: any) => {
            const url = `${baseUrl}/tin-tuc/${p?.slug}`;
            const ex = (p?.excerpt ?? '').replace(/\s+/g, ' ').slice(0, 120);
            return `- ${p?.title} | ${url}${ex ? ` | ${ex}` : ''}`;
          });
          sections.push(`BÀI VIẾT / TIN TỨC (tiêu đề | link | tóm tắt):\n${lines.join('\n')}`);
        }
      } catch {}
    }

    // --- Knowledge base (admin-uploaded .md files) ---
    try {
      const docs = await prisma.knowledgeDoc.findMany({
        orderBy: { createdAt: 'desc' },
        select: { title: true, content: true },
      });
      if (docs.length) {
        let budget = KNOWLEDGE_BUDGET;
        const parts: string[] = [];
        for (const d of docs) {
          if (budget <= 0) break;
          const chunk = (d.content ?? '').slice(0, budget);
          budget -= chunk.length;
          parts.push(`### ${d.title}\n${chunk}`);
        }
        if (parts.length) {
          sections.push(`KIẾN THỨC BỐ SUNG (do quản trị viên cung cấp):\n${parts.join('\n\n')}`);
        }
      }
    } catch {}

    sections.push(
      `HƯỚNG DẪN TRẢ LờI:\n- Trả lời dựa trên dữ liệu trang web và kiến thức bổ sung ở trên.\n- Khi nhắc đến sản phẩm hoặc bài viết, LUÔN kèm đường link cụ thể (định dạng markdown [tên](link)).\n- Trả lời ngắn gọn, thân thiện, đúng trọng tâm. Nếu không có thông tin, hãy nói thật và gợi ý liên hệ.`,
    );

    const systemMessage = sections.join('\n\n');
    const chatMessages = (messages ?? []).map((m: any) => ({ role: m?.role, content: m?.content }));

    // --- AI Router branch: auto-pick the cheapest suitable model per query ---
    // The client sends the full per-provider key map (base64 JSON) in x-ai-keys.
    // The router classifies the question, routes to the cheapest capable model,
    // falls back automatically, and we persist usage for the savings dashboard.
    if (providerId === 'router') {
      const keys = parseRouterKeys(request.headers.get('x-ai-keys'));
      if (Object.keys(keys).length === 0) {
        return NextResponse.json(
          { error: 'AI Router cần ít nhất một khóa API (OpenAI, Google/Gemini hoặc Anthropic) đã được lưu.' },
          { status: 401 },
        );
      }
      const history = chatMessages.slice(0, -1).filter((m: any) => m?.content);
      const last = chatMessages[chatMessages.length - 1];
      const question = (last?.content ?? '').toString();
      if (!question.trim()) {
        return NextResponse.json({ error: 'Empty question' }, { status: 400 });
      }

      let result: RouteChatResult;
      try {
        result = await routeChat({ question, history, systemPrompt: systemMessage, keys });
      } catch (err: any) {
        console.error('[ai-router] routeChat failed:', err?.message ?? err);
        return NextResponse.json({ error: err?.message ?? 'AI Router error' }, { status: 500 });
      }

      // Persist usage (fire-and-forget) for the cost-savings dashboard.
      try {
        const baselineCost = estimateCost(getModel(BASELINE_MODEL_ID), result.inputTokens, result.outputTokens);
        await prisma.aiUsageLog.create({
          data: {
            modelId: result.modelUsed,
            provider: result.provider,
            complexity: result.complexity,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            estimatedCost: result.estimatedCost,
            baselineCost,
            fallbackUsed: result.fallbackUsed,
          },
        });
      } catch (e) {
        console.error('[ai-router] usage log failed:', e);
      }

      // Return the answer as a single OpenAI-style SSE chunk so the existing
      // client stream parser works unchanged. A leading meta chunk carries the
      // routing info (ignored by clients that only read delta.content).
      const encoder = new TextEncoder();
      const routerStream = new ReadableStream({
        start(controller) {
          const meta = {
            router: {
              modelUsed: result.modelUsed,
              provider: result.provider,
              complexity: result.complexity,
              fallbackUsed: result.fallbackUsed,
            },
            choices: [{ delta: {} }],
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(meta)}\n\n`));
          const payload = { choices: [{ delta: { content: result.answer } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(routerStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const isAnthropic = provider.format === 'anthropic';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(provider.extraHeaders ?? {}),
    };
    let requestBody: any;

    if (isAnthropic) {
      // Anthropic uses x-api-key + anthropic-version, a top-level `system` field,
      // and a messages array WITHOUT any system role.
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      requestBody = {
        model,
        max_tokens: 1200,
        system: systemMessage,
        messages: chatMessages,
        stream: true,
      };
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
      if (providerId === 'openrouter') {
        headers['HTTP-Referer'] = baseUrl;
        headers['X-Title'] = 'Orion';
      }
      requestBody = {
        model,
        messages: [{ role: 'system', content: systemMessage }, ...chatMessages],
        stream: true,
        max_tokens: 1200,
      };
    }

    // Guard against a provider that never responds (e.g. model cold-start
    // hangs) so the request can't spin forever on the client.
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 45000);
    let response: Response;
    try {
      response = await fetch(provider.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: ac.signal,
      });
    } catch (e: any) {
      clearTimeout(timeoutId);
      const msg = e?.name === 'AbortError'
        ? `Nhà cung cấp "${providerId}" không phản hồi sau 45 giây (model có thể đang khởi động hoặc hết credit).`
        : `Không kết nối được tới nhà cung cấp "${providerId}": ${e?.message ?? 'lỗi mạng'}.`;
      console.error(`AI provider (${providerId}) fetch failed:`, e?.name, e?.message);
      return NextResponse.json({ error: msg }, { status: 504 });
    }
    clearTimeout(timeoutId);

    if (!response?.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      console.error(`AI provider (${providerId}) error:`, response?.status, errText?.slice(0, 300));
      return NextResponse.json({ error: errText }, { status: response?.status ?? 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await (reader as any).read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (!isAnthropic) {
              // OpenAI-compatible providers: pass the SSE through untouched.
              controller.enqueue(encoder.encode(chunk));
              continue;
            }
            // Anthropic: translate its native SSE events into OpenAI-style
            // `data: {choices:[{delta:{content}}]}` chunks the client already understands.
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const data = trimmed.slice(5).trim();
              if (!data || data === '[DONE]') continue;
              try {
                const evt = JSON.parse(data);
                if (evt?.type === 'content_block_delta' && evt?.delta?.text) {
                  const out = { choices: [{ delta: { content: evt.delta.text } }] };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(out)}\n\n`));
                } else if (evt?.type === 'message_stop') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                }
              } catch {}
            }
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
