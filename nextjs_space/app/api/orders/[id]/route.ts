export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data: any = {};
    if (typeof body?.status === 'string') data.status = body.status;
    if (typeof body?.paymentStatus === 'string') {
      data.paymentStatus = body.paymentStatus;
      data.paidAt = body.paymentStatus === 'paid' ? new Date() : null;
    }
    if (Object.keys(data).length === 0) data.status = 'pending';

    const order = await prisma.order.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
