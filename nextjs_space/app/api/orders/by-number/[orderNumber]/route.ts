export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lấy thông tin đơn (giới hạn) theo mã đơn để hiển thị trang thanh toán.
// Trang thanh toán có thể truy cập bởi khách chưa đăng nhập, nên chỉ trả về
// các trường không nhạy cảm, và được bảo vệ bằng mã đơn khó đoán.
export async function GET(_req: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: params.orderNumber },
      select: {
        orderNumber: true,
        customerName: true,
        total: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
      },
    });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order by-number GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Khách bấm "Tôi đã chuyển khoản" -> đánh dấu chờ xác nhận (không tự xác nhận đã thu tiền).
export async function PATCH(_req: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const order = await prisma.order.findUnique({ where: { orderNumber: params.orderNumber }, select: { paymentStatus: true } });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Chỉ chuyển từ unpaid -> awaiting; không ghi đè trạng thái đã thanh toán.
    if (order.paymentStatus === 'unpaid') {
      await prisma.order.update({
        where: { orderNumber: params.orderNumber },
        data: { paymentStatus: 'awaiting' },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Order by-number PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
