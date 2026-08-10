export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ABACUS_URL = 'https://routellm.abacus.ai/v1/chat/completions';
const KNOWLEDGE_BUDGET = 24000; // max chars of agent knowledge injected

function getBaseUrl() {
  return (process.env.NEXTAUTH_URL || 'https://shop.edunow.today').replace(/\/$/, '');
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.aiAgent.findUnique({
      where: { id: params.id },
      include: { docs: { orderBy: { createdAt: 'desc' }, select: { title: true, content: true } } },
    });
    if (!agent || !agent.active) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Authorization: admin OR the user's role must be assigned to this agent.
    const agentRoles = (agent.roles ?? '').split(',').map((r) => r.trim()).filter(Boolean);
    if (role !== 'admin' && !agentRoles.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const sections: string[] = [];
    sections.push(agent.systemPrompt?.trim() || 'Bạn là một trợ lý AI chuyên nghiệp, hỗ trợ nhân viên làm việc.');

    // Inject the agent's private knowledge documents (RAG-lite: full docs up to a budget).
    if (agent.docs.length) {
      let budget = KNOWLEDGE_BUDGET;
      const parts: string[] = [];
      for (const d of agent.docs) {
        if (budget <= 0) break;
        const chunk = (d.content ?? '').slice(0, budget);
        budget -= chunk.length;
        parts.push(`### ${d.title}\n${chunk}`);
      }
      if (parts.length) {
        sections.push(`TÀI LIỆU KIẾN THỨC NỘI BỘ (ưu tiên dùng để trả lời):\n${parts.join('\n\n')}`);
      }
    }

    // Optional website data (products + posts) for agents that need it.
    if (agent.useWebsiteData) {
      const baseUrl = getBaseUrl();
      try {
        const products = await prisma.product.findMany({
          where: { active: true },
          select: { name: true, slug: true, price: true, category: { select: { name: true } } },
          orderBy: { featured: 'desc' },
          take: 40,
        });
        if (products.length) {
          const lines = products.map((p: any) => {
            const price = new Intl.NumberFormat('vi-VN').format(p?.price ?? 0);
            return `- ${p?.name} | ${p?.category?.name ?? ''} | ${price}đ | ${baseUrl}/products/${p?.slug}`;
          });
          sections.push(`SẢN PHẨM HIỆN CÓ:\n${lines.join('\n')}`);
        }
      } catch {}
    }

    sections.push('HƯỚNG DẪN: Trả lời bằng tiếng Việt (trừ khi người dùng yêu cầu ngôn ngữ khác), ngắn gọn, đúng trọng tâm. Ưu tiên dựa trên tài liệu kiến thức nội bộ nếu có.');

    const systemMessage = sections.join('\n\n');
    const chatMessages = [
      { role: 'system', content: systemMessage },
      ...messages.map((m: any) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: String(m?.content ?? '') })),
    ];

    const upstream = await fetch(ABACUS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: agent.model || 'gpt-4.1-mini',
        messages: chatMessages,
        stream: true,
        temperature: typeof agent.temperature === 'number' ? agent.temperature : 0.3,
        max_tokens: typeof agent.maxTokens === 'number' ? agent.maxTokens : 1200,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text().catch(() => '');
      console.error('Agent chat upstream error:', upstream.status, txt.slice(0, 300));
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Agent chat error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
