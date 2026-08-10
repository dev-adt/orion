export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    const { customerName, customerEmail, customerPhone, shippingAddress, paymentMethod, note, items } = body ?? {};

    if (!customerName || !customerPhone || !shippingAddress || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subtotal = (items ?? []).reduce((sum: number, item: any) => sum + (item?.price ?? 0) * (item?.quantity ?? 0), 0);
    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    const total = subtotal + shippingFee;

    const orderNumber = 'ORD' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user ? (session.user as any).id : null,
        customerName,
        customerEmail: customerEmail ?? '',
        customerPhone,
        shippingAddress,
        paymentMethod: paymentMethod ?? 'cod',
        note: note ?? null,
        subtotal,
        shippingFee,
        total,
        items: {
          create: (items ?? []).map((item: any) => ({
            productId: item?.productId ?? '',
            name: item?.name ?? '',
            price: item?.price ?? 0,
            quantity: item?.quantity ?? 1,
            image: item?.image ?? null,
          })),
        },
      },
    });

    return NextResponse.json({ order, orderNumber });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !['admin', 'sales', 'accountant'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
