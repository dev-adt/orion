export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const agent = await prisma.aiAgent.findUnique({
      where: { id: params.id },
      include: {
        docs: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, fileName: true, createdAt: true, content: true },
        },
      },
    });
    if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const docs = agent.docs.map((d) => ({
      id: d.id, title: d.title, fileName: d.fileName, createdAt: d.createdAt, size: d.content?.length ?? 0,
    }));
    return NextResponse.json({ agent: { ...agent, docs } });
  } catch (error: any) {
    console.error('AI agent GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const data: any = {};
    if (body?.name !== undefined) data.name = String(body.name);
    if (body?.nameEn !== undefined) data.nameEn = body.nameEn ? String(body.nameEn) : null;
    if (body?.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body?.descriptionEn !== undefined) data.descriptionEn = body.descriptionEn ? String(body.descriptionEn) : null;
    if (body?.icon !== undefined) data.icon = String(body.icon);
    if (body?.model !== undefined) data.model = String(body.model);
    if (body?.systemPrompt !== undefined) data.systemPrompt = String(body.systemPrompt);
    if (body?.roles !== undefined) data.roles = Array.isArray(body.roles) ? body.roles.join(',') : String(body.roles);
    if (body?.temperature !== undefined) data.temperature = Math.max(0, Math.min(1, Number(body.temperature)));
    if (body?.maxTokens !== undefined) data.maxTokens = Math.max(100, Math.min(8000, parseInt(String(body.maxTokens)) || 1200));
    if (body?.suggestedPrompts !== undefined) data.suggestedPrompts = body.suggestedPrompts ? String(body.suggestedPrompts) : null;
    if (body?.useWebsiteData !== undefined) data.useWebsiteData = body.useWebsiteData === true;
    if (body?.embeddable !== undefined) data.embeddable = body.embeddable === true;
    if (body?.active !== undefined) data.active = body.active !== false;
    if (body?.order !== undefined) data.order = Number(body.order);

    const agent = await prisma.aiAgent.update({ where: { id: params.id }, data });
    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error('AI agent PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.aiAgent.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('AI agent DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
