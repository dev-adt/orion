export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { roleAllowed } from '@/lib/roles';

// List chat sessions for the customer-care dashboard. Visible to admin & sales.
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !roleAllowed(role, ['admin', 'sales'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: { _count: { select: { messages: true } } },
    });
    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        customerName: s.customerName,
        gender: s.gender,
        note: s.note,
        email: s.email,
        phone: s.phone,
        status: s.status,
        messageCount: s._count.messages,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (e: any) {
    console.error('[admin/chat-sessions] list failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
