export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildVnpayPaymentUrl, isVnpayConfigured } from '@/lib/vnpay';

export async function POST(request: NextRequest) {
  try {
    if (!isVnpayConfigured()) {
      return NextResponse.json(
        { error: 'Cổng thanh toán VNPay chưa được cấu hình. Vui lòng liên hệ quản trị viên.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { orderNumber } = body ?? {};

    if (!orderNumber) {
      return NextResponse.json({ error: 'Missing orderNumber' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({ where: { orderNumber } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Đơn hàng đã được thanh toán' }, { status: 400 });
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddr = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Build return URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/api/vnpay/return`;

    const paymentUrl = buildVnpayPaymentUrl({
      amount: order.total,
      orderNumber: order.orderNumber,
      orderInfo: `Thanh toan don hang ${order.orderNumber}`,
      ipAddr,
      returnUrl,
    });

    return NextResponse.json({ paymentUrl });
  } catch (error: any) {
    console.error('VNPay create payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
