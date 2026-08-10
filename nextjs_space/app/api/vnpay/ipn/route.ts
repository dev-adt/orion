export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyVnpayReturn } from '@/lib/vnpay';

// VNPay IPN (Instant Payment Notification) - server-to-server
export async function GET(request: NextRequest) {
  try {
    const query: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const result = verifyVnpayReturn(query);

    if (!result.isValid) {
      return NextResponse.json({ RspCode: '97', Message: 'Invalid Checksum' });
    }

    const order = await prisma.order.findFirst({ where: { orderNumber: result.orderNumber } });
    if (!order) {
      return NextResponse.json({ RspCode: '01', Message: 'Order Not Found' });
    }

    // Check amount matches
    if (order.total !== result.amount) {
      return NextResponse.json({ RspCode: '04', Message: 'Invalid Amount' });
    }

    // Already processed
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (result.responseCode === '00') {
      // Payment successful
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          paidAt: new Date(),
          paymentMethod: 'vnpay',
        },
      });
      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    }

    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error: any) {
    console.error('VNPay IPN error:', error);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown Error' });
  }
}
