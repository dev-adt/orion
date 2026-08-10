export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyVnpayReturn } from '@/lib/vnpay';

export async function GET(request: NextRequest) {
  try {
    const query: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const result = verifyVnpayReturn(query);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    if (!result.isValid) {
      console.error('VNPay return: invalid hash', query);
      return NextResponse.redirect(
        `${baseUrl}/vnpay-ket-qua?status=error&code=INVALID_HASH&order=${result.orderNumber}`
      );
    }

    // Update order if payment successful (responseCode '00')
    if (result.responseCode === '00') {
      const order = await prisma.order.findFirst({ where: { orderNumber: result.orderNumber } });
      if (order && order.paymentStatus !== 'paid') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            paidAt: new Date(),
            paymentMethod: 'vnpay',
          },
        });
      }
      return NextResponse.redirect(
        `${baseUrl}/vnpay-ket-qua?status=success&order=${result.orderNumber}&txn=${result.transactionNo}`
      );
    }

    // Payment failed or cancelled
    return NextResponse.redirect(
      `${baseUrl}/vnpay-ket-qua?status=failed&code=${result.responseCode}&order=${result.orderNumber}`
    );
  } catch (error: any) {
    console.error('VNPay return error:', error);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/vnpay-ket-qua?status=error&code=SYSTEM_ERROR`);
  }
}
