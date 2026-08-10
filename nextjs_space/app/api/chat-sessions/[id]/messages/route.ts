export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint: append a message to an existing chat session so staff can
// review the full conversation later. Best-effort; validates minimally.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { role, content } = body ?? {};
    const sessionId = params?.id;
    if (!sessionId || !role || !content || !String(content).trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    // Ensure the session exists (avoid orphan logs / FK errors).
    const exists = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    await prisma.chatLog.create({
      data: { sessionId, role, content: String(content).slice(0, 8000) },
    });
    await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[chat-sessions] append failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Không lưu được tin nhắn' }, { status: 500 });
  }
}
