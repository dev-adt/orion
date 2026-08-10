export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ALLOWED = ['admin', 'marketing'];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !ALLOWED.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Coupons GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !ALLOWED.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, description, discountType, discountValue, usageLimit, expiresAt, active } = body;
    if (!code?.trim()) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const normalized = code.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code: normalized } });
    if (existing) {
      return NextResponse.json({ error: 'Mã đã tồn tại' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalized,
        description: description?.trim() || null,
        discountType: discountType === 'fixed' ? 'fixed' : 'percent',
        discountValue: typeof discountValue === 'number' ? discountValue : parseFloat(discountValue) || 0,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== false,
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Coupon create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
