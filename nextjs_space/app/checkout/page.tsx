'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Truck, CheckCircle, Loader2, Banknote, Building2, Package, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const items = useCartStore((s) => s?.items ?? []);
  const getTotal = useCartStore((s) => s?.getTotal);
  const clearCart = useCartStore((s) => s?.clearCart);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    paymentMethod: 'cod',
    note: '',
  });

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="max-w-[1200px] mx-auto px-4 py-8"><div className="h-64 bg-muted animate-pulse rounded-xl" /></div>;
  }

  const subtotal = getTotal?.() ?? 0;
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!form.customerName || !form.customerPhone || !form.shippingAddress) {
      toast.error(locale === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: (items ?? []).map((i: any) => ({
            productId: i?.productId,
            name: i?.name,
            price: i?.price,
            quantity: i?.quantity,
            image: i?.image,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const on = data?.orderNumber ?? '';
        clearCart?.();
        // Thanh toán trực tuyến (VietQR/Napas/chuyển khoản) -> chuyển tới cổng thanh toán.
        if (form.paymentMethod === 'vietqr' || form.paymentMethod === 'bank') {
          router.push(`/thanh-toan/${on}`);
          return;
        }
        // VNPay (Visa/Mastercard/ATM) -> tạo link thanh toán VNPay và redirect
        if (form.paymentMethod === 'vnpay') {
          try {
            const vpRes = await fetch('/api/vnpay/create-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderNumber: on }),
            });
            const vpData = await vpRes.json();
            if (vpRes.ok && vpData?.paymentUrl) {
              window.location.href = vpData.paymentUrl;
              return;
            }
            // VNPay chưa cấu hình → fallback chuyển khoản
            toast.error(vpData?.error || 'VNPay chưa sẵn sàng, vui lòng chuyển khoản.');
            router.push(`/thanh-toan/${on}`);
            return;
          } catch {
            toast.error('Lỗi kết nối VNPay, chuyển sang chuyển khoản.');
            router.push(`/thanh-toan/${on}`);
            return;
          }
        }
        setOrderNumber(on);
        setSuccess(true);
      } else {
        toast.error(data?.error ?? 'Error');
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const locale = 'vi'; // Will be overridden by context

  if (success) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold mb-3">{t('thanks.title')}</h1>
        <p className="text-muted-foreground mb-4">{t('thanks.message')}</p>
        <div className="bg-muted rounded-lg p-4 mb-6">
          <span className="text-sm text-muted-foreground">{t('thanks.order_number')}</span>
          <p className="font-mono text-lg font-bold text-primary">{orderNumber}</p>
        </div>
        <Link href="/">
          <Button size="lg">{t('thanks.back_home')}</Button>
        </Link>
      </div>
    );
  }

  if ((items?.length ?? 0) === 0) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg">{t('cart.empty')}</p>
        <Link href="/products"><Button className="mt-4">{t('cart.continue')}</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-8">
        <CreditCard className="inline h-8 w-8 mr-2 text-primary" />
        {t('checkout.title')}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Shipping Info */}
            <div className="bg-card rounded-xl border p-6">
              <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                {t('checkout.shipping_info')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('checkout.name')} *</Label>
                  <Input
                    value={form.customerName}
                    onChange={(e: any) => setForm({ ...form, customerName: e?.target?.value ?? '' })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('checkout.email')}</Label>
                  <Input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e: any) => setForm({ ...form, customerEmail: e?.target?.value ?? '' })}
                  />
                </div>
                <div>
                  <Label>{t('checkout.phone')} *</Label>
                  <Input
                    value={form.customerPhone}
                    onChange={(e: any) => setForm({ ...form, customerPhone: e?.target?.value ?? '' })}
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label>{t('checkout.address')} *</Label>
                <Textarea
                  value={form.shippingAddress}
                  onChange={(e: any) => setForm({ ...form, shippingAddress: e?.target?.value ?? '' })}
                  required
                  rows={2}
                />
              </div>
              <div className="mt-4">
                <Label>{t('checkout.note')}</Label>
                <Textarea
                  value={form.note}
                  onChange={(e: any) => setForm({ ...form, note: e?.target?.value ?? '' })}
                  rows={2}
                />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card rounded-xl border p-6">
              <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                {t('checkout.payment')}
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                  <input type="radio" name="payment" value="cod" checked={form.paymentMethod === 'cod'} onChange={() => setForm({ ...form, paymentMethod: 'cod' })} />
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{t('checkout.cod')}</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.paymentMethod === 'vietqr' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                  <input type="radio" name="payment" value="vietqr" checked={form.paymentMethod === 'vietqr'} onChange={() => setForm({ ...form, paymentMethod: 'vietqr' })} />
                  <QrCode className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">VietQR / Napas / Chuyển khoản 24/7</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.paymentMethod === 'bank' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                  <input type="radio" name="payment" value="bank" checked={form.paymentMethod === 'bank'} onChange={() => setForm({ ...form, paymentMethod: 'bank' })} />
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{t('checkout.bank')}</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                  <input type="radio" name="payment" value="vnpay" checked={form.paymentMethod === 'vnpay'} onChange={() => setForm({ ...form, paymentMethod: 'vnpay' })} />
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium text-sm">Thẻ Visa / Mastercard / ATM nội địa</span>
                    <span className="block text-xs text-muted-foreground">Thanh toán qua cổng VNPay</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl border p-6 h-fit sticky top-20">
            <h3 className="font-display font-bold text-lg mb-4">{t('checkout.order_summary')}</h3>
            <div className="space-y-3 mb-4">
              {(items ?? []).map((item: any) => (
                <div key={item?.productId} className="flex justify-between text-sm">
                  <span className="truncate mr-2">{item?.name} x{item?.quantity}</span>
                  <span className="flex-shrink-0">{formatPrice((item?.price ?? 0) * (item?.quantity ?? 1))}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.shipping')}</span>
                <span>{shippingFee === 0 ? t('cart.free_shipping') : formatPrice(shippingFee)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>{t('cart.total')}</span>
                <span className="text-primary text-lg">{formatPrice(total)}</span>
              </div>
            </div>
            <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('checkout.processing')}</> : t('checkout.place_order')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
