export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ALLOWED = ['admin', 'marketing'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !ALLOWED.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data: any = {};
    if ('description' in body) data.description = body.description?.trim() || null;
    if (typeof body.discountType === 'string') data.discountType = body.discountType === 'fixed' ? 'fixed' : 'percent';
    if (body.discountValue !== undefined) data.discountValue = typeof body.discountValue === 'number' ? body.discountValue : parseFloat(body.discountValue) || 0;
    if ('usageLimit' in body) data.usageLimit = body.usageLimit ? parseInt(body.usageLimit) : null;
    if ('expiresAt' in body) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (typeof body.active === 'boolean') data.active = body.active;

    const coupon = await prisma.coupon.update({ where: { id: params.id }, data });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Coupon update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !ALLOWED.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.coupon.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Coupon delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
