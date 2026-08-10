'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/i18n';
import { buildVietQrUrl, paymentDescription, defaultPaymentConfig, parsePaymentConfig, bankByBin, type PaymentConfig } from '@/lib/payment-config';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Loader2, Copy, Check, ShieldCheck, QrCode, Building2, Clock, CheckCircle2, Home,
} from 'lucide-react';

interface OrderInfo {
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    toast.success('Đã sao chép');
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm break-words">{value}</p>
      </div>
      <button onClick={copy} className="flex-shrink-0 text-muted-foreground hover:text-primary p-1.5 rounded-md hover:bg-muted transition" title="Sao chép">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const orderNumber = String(params?.orderNumber || '');
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [payCfg, setPayCfg] = useState<PaymentConfig>(() => defaultPaymentConfig());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/by-number/${orderNumber}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [orderNumber]);

  useEffect(() => { load(); }, [load]);

  // Tải cấu hình cổng thanh toán (tài khoản nhận tiền) do quản trị khai báo.
  useEffect(() => {
    fetch('/api/payment-config')
      .then((r) => r.json())
      .then((d) => { if (d?.config) setPayCfg(parsePaymentConfig(JSON.stringify(d.config))); })
      .catch(() => {});
  }, []);

  // Tự động kiểm tra trạng thái thanh toán mỗi 12s để cập nhật khi admin xác nhận.
  useEffect(() => {
    if (!order || order.paymentStatus === 'paid') return;
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [order, load]);

  const markPaid = async () => {
    setMarking(true);
    try {
      const res = await fetch(`/api/orders/by-number/${orderNumber}`, { method: 'PATCH' });
      if (res.ok) {
        toast.success('Đã ghi nhận. Chúng tôi sẽ xác nhận sớm nhất!');
        load();
      } else toast.error('Có lỗi xảy ra');
    } catch { toast.error('Lỗi kết nối'); }
    setMarking(false);
  };

  if (loading) {
    return <div className="max-w-[900px] mx-auto px-4 py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (notFound || !order) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
        <p className="text-lg mb-4">Không tìm thấy đơn hàng.</p>
        <Link href="/"><Button>Về trang chủ</Button></Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';
  const qrUrl = buildVietQrUrl(payCfg, order.total, order.orderNumber);
  const transferContent = paymentDescription(payCfg.prefix, order.orderNumber);
  const bank = bankByBin(payCfg.bankBin);

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Cổng thanh toán</h1>
        <p className="text-muted-foreground mt-1">Đơn hàng <span className="font-mono font-semibold text-primary">{order.orderNumber}</span></p>
      </div>

      {isPaid ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-800 mb-2">Thanh toán thành công</h2>
          <p className="text-green-700 mb-6">Cảm ơn bạn! Đơn hàng đã được xác nhận thanh toán.</p>
          <Link href="/"><Button size="lg"><Home className="h-4 w-4 mr-2" /> Về trang chủ</Button></Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR */}
          <div className="bg-card rounded-2xl border p-6 text-center">
            <h2 className="font-semibold text-lg mb-1 flex items-center justify-center gap-2"><QrCode className="h-5 w-5 text-primary" /> Quét mã VietQR</h2>
            <p className="text-xs text-muted-foreground mb-4">Dùng app ngân hàng hoặc ví Napas bất kỳ để quét</p>
            <div className="relative w-full max-w-[280px] mx-auto aspect-square bg-white rounded-xl overflow-hidden border">
              <Image src={qrUrl} alt={`Mã VietQR thanh toán đơn ${order.orderNumber}`} fill className="object-contain p-2" unoptimized />
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 opacity-80">
              <span className="text-xs font-semibold text-muted-foreground">napas 24/7</span>
              <span className="text-xs font-semibold text-muted-foreground">VietQR</span>
            </div>
            <p className="text-2xl font-bold text-primary mt-3">{formatPrice(order.total)}</p>
          </div>

          {/* Bank details */}
          <div className="bg-card rounded-2xl border p-6">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Chuyển khoản thủ công</h2>
            <div className="space-y-0">
              <CopyRow label="Ngân hàng" value={bank?.short || ''} />
              <CopyRow label="Số tài khoản" value={payCfg.accountNumber} />
              <CopyRow label="Chủ tài khoản" value={payCfg.accountName} />
              <CopyRow label="Số tiền" value={String(Math.round(order.total))} />
              <CopyRow label="Nội dung chuyển khoản" value={transferContent} />
            </div>
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
              <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Vui lòng ghi đúng <b>nội dung chuyển khoản</b> để chúng tôi đối soát nhanh. Đơn sẽ được xác nhận sau khi nhận được thanh toán.</span>
            </div>
          </div>
        </div>
      )}

      {!isPaid && (
        <div className="mt-6 text-center">
          {order.paymentStatus === 'awaiting' ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm">
              <Clock className="h-4 w-4" /> Đang chờ xác nhận thanh toán từ chúng tôi
            </div>
          ) : (
            <Button size="lg" onClick={markPaid} disabled={marking}>
              {marking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Tôi đã chuyển khoản
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-3">Trang này tự cập nhật khi đơn được xác nhận. Bạn có thể lưu lại mã đơn để quay lại sau.</p>
        </div>
      )}
    </div>
  );
}
