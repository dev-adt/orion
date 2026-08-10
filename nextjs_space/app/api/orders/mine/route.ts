export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// A logged-in customer fetches their own orders.
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ orders });
  } catch (e: any) {
    console.error('[orders/mine] failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}
