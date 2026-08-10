export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  PAYMENT_SETTING_KEY,
  parsePaymentConfig,
  bankByBin,
} from '@/lib/payment-config';

// Công khai: trả về cấu hình tài khoản nhận tiền để trang thanh toán hiển thị QR.
// Thông tin này vốn hiển thị cho khách hàng nên không phải bí mật.
export async function GET() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: PAYMENT_SETTING_KEY } });
    const cfg = parsePaymentConfig(row?.value);
    const bank = bankByBin(cfg.bankBin);
    return NextResponse.json({
      config: {
        ...cfg,
        bankShort: bank?.short || '',
        bankName: bank?.name || '',
      },
    });
  } catch (error) {
    console.error('Payment config GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
