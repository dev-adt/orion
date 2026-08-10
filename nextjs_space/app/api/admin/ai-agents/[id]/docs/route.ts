export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const MAX_CHARS = 200000;

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const docs = await prisma.aiAgentDoc.findMany({
      where: { agentId: params.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, fileName: true, createdAt: true, content: true },
    });
    const list = docs.map((d) => ({
      id: d.id, title: d.title, fileName: d.fileName, createdAt: d.createdAt, size: d.content?.length ?? 0,
    }));
    return NextResponse.json({ docs: list });
  } catch (error: any) {
    console.error('Agent docs GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const title = String(body?.title ?? '').trim() || 'Tài liệu';
    const fileName = body?.fileName ? String(body.fileName) : null;
    let content = String(body?.content ?? '');
    if (!content.trim()) return NextResponse.json({ error: 'Empty content' }, { status: 400 });
    if (content.length > MAX_CHARS) content = content.slice(0, MAX_CHARS);

    const doc = await prisma.aiAgentDoc.create({
      data: { agentId: params.id, title, fileName, content },
      select: { id: true, title: true, fileName: true, createdAt: true },
    });
    return NextResponse.json({ doc });
  } catch (error: any) {
    console.error('Agent docs POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
