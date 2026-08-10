export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const agents = await prisma.aiAgent.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { docs: true } } },
    });
    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error('AI agents GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const roles = Array.isArray(body?.roles) ? body.roles.join(',') : String(body?.roles ?? '');
    const agent = await prisma.aiAgent.create({
      data: {
        name,
        nameEn: body?.nameEn ? String(body.nameEn) : null,
        description: body?.description ? String(body.description) : null,
        descriptionEn: body?.descriptionEn ? String(body.descriptionEn) : null,
        icon: String(body?.icon ?? 'Bot'),
        model: String(body?.model ?? 'gpt-4.1-mini'),
        systemPrompt: String(body?.systemPrompt ?? ''),
        roles,
        temperature: typeof body?.temperature === 'number' ? Math.max(0, Math.min(1, body.temperature)) : 0.3,
        maxTokens: body?.maxTokens != null ? Math.max(100, Math.min(8000, parseInt(String(body.maxTokens)) || 1200)) : 1200,
        suggestedPrompts: body?.suggestedPrompts ? String(body.suggestedPrompts) : null,
        useWebsiteData: body?.useWebsiteData === true,
        embeddable: body?.embeddable === true,
        active: body?.active !== false,
        order: Number(body?.order ?? 0),
      },
    });
    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error('AI agents POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
