'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function VnpayResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams?.get('status') || 'error';
  const orderNumber = searchParams?.get('order') || '';
  const txn = searchParams?.get('txn') || '';
  const code = searchParams?.get('code') || '';

  if (status === 'success') {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold mb-3">Thanh toán thành công!</h1>
        <p className="text-muted-foreground mb-6">
          Đơn hàng của bạn đã được thanh toán qua VNPay.
        </p>
        <div className="bg-muted rounded-lg p-4 mb-4 space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Mã đơn hàng</span>
            <p className="font-mono text-lg font-bold text-primary">{orderNumber}</p>
          </div>
          {txn && (
            <div>
              <span className="text-sm text-muted-foreground">Mã giao dịch VNPay</span>
              <p className="font-mono text-sm">{txn}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button size="lg">Về trang chủ</Button>
          </Link>
          <Link href="/tai-khoan">
            <Button variant="outline" size="lg">Đơn hàng của tôi</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <XCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold mb-3">Thanh toán không thành công</h1>
        <p className="text-muted-foreground mb-6">
          Giao dịch bị hủy hoặc gặp lỗi. Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.
        </p>
        {orderNumber && (
          <div className="bg-muted rounded-lg p-4 mb-4">
            <span className="text-sm text-muted-foreground">Mã đơn hàng</span>
            <p className="font-mono text-lg font-bold">{orderNumber}</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          {orderNumber && (
            <Link href={`/thanh-toan/${orderNumber}`}>
              <Button size="lg">Chuyển khoản thay thế</Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="outline" size="lg">Về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error
  return (
    <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
        <AlertTriangle className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
      </motion.div>
      <h1 className="font-display text-3xl font-bold mb-3">Lỗi xác thực thanh toán</h1>
      <p className="text-muted-foreground mb-6">
        Không thể xác nhận kết quả thanh toán. Vui lòng kiểm tra tài khoản ngân hàng hoặc liên hệ hỗ trợ.
      </p>
      {code && <p className="text-xs text-muted-foreground mb-4">Mã lỗi: {code}</p>}
      <Link href="/">
        <Button size="lg">Về trang chủ</Button>
      </Link>
    </div>
  );
}

export default function VnpayResultPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    }>
      <VnpayResultContent />
    </Suspense>
  );
}
