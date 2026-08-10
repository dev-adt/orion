export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { roleAllowed } from '@/lib/roles';

// Full conversation for one session. Visible to admin & sales.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !roleAllowed(role, ['admin', 'sales'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const detail = await prisma.chatSession.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ session: detail });
  } catch (e: any) {
    console.error('[admin/chat-sessions] detail failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

// Update the session status (open / closed).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !roleAllowed(role, ['admin', 'sales'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const status = body?.status;
    if (status !== 'open' && status !== 'closed') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    await prisma.chatSession.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[admin/chat-sessions] patch failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
