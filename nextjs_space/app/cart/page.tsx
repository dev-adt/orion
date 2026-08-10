'use client';

import { useTranslation } from '@/lib/i18n-context';
import { useCartStore, CartItemType } from '@/lib/cart-store';
import { formatPrice } from '@/lib/i18n';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const { t, locale } = useTranslation();
  const items = useCartStore((s) => s?.items ?? []);
  const removeItem = useCartStore((s) => s?.removeItem);
  const updateQuantity = useCartStore((s) => s?.updateQuantity);
  const getTotal = useCartStore((s) => s?.getTotal);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="max-w-[1200px] mx-auto px-4 py-8"><div className="h-64 bg-muted animate-pulse rounded-xl" /></div>;
  }

  const subtotal = getTotal?.() ?? 0;
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  if ((items?.length ?? 0) === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">{t('cart.empty')}</h1>
        <p className="text-muted-foreground mb-6">{t('cart.empty_desc')}</p>
        <Link href="/products">
          <Button size="lg" className="gap-2">{t('cart.continue')} <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-8">
        <ShoppingCart className="inline h-8 w-8 mr-2 text-primary" />
        {t('cart.title')}
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {(items ?? []).map((item: CartItemType, i: number) => (
            <motion.div
              key={item?.productId ?? i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 p-4 bg-card rounded-xl border"
            >
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image src={item?.image ?? '/placeholder.png'} alt={item?.name ?? ''} fill className="object-cover" sizes="96px" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm md:text-base">
                  {locale === 'en' ? (item?.nameEn ?? item?.name) : item?.name}
                </h3>
                <span className="text-primary font-bold text-sm">{formatPrice(item?.price ?? 0)}</span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border rounded-lg">
                    <button className="px-2 py-1 hover:bg-muted" onClick={() => updateQuantity?.(item?.productId ?? '', (item?.quantity ?? 1) - 1)}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium">{item?.quantity ?? 1}</span>
                    <button className="px-2 py-1 hover:bg-muted" onClick={() => updateQuantity?.(item?.productId ?? '', (item?.quantity ?? 1) + 1)}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem?.(item?.productId ?? '')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold">{formatPrice((item?.price ?? 0) * (item?.quantity ?? 1))}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl border p-6 h-fit sticky top-20">
          <h3 className="font-display font-bold text-lg mb-4">{t('checkout.order_summary')}</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('cart.subtotal')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('cart.shipping')}</span>
              <span>{shippingFee === 0 ? t('cart.free_shipping') : formatPrice(shippingFee)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>{t('cart.total')}</span>
              <span className="text-primary text-lg">{formatPrice(total)}</span>
            </div>
          </div>
          <Link href="/checkout">
            <Button className="w-full gap-2" size="lg">
              {t('cart.checkout')} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="ghost" className="w-full mt-2">{t('cart.continue')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
