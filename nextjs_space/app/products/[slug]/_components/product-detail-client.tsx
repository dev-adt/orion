'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-context';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Star, ShoppingCart, Zap, ChevronLeft, Package, Check, Truck, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { EditContentButton } from '@/app/_components/edit-content-button';

interface Props {
  slug: string;
}

export function ProductDetailClient({ slug }: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const addItem = useCartStore((s) => s?.addItem);
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data?.product ?? null);
        setRelated(data?.related ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddCart = () => {
    if (!product) return;
    addItem?.({
      productId: product?.id ?? '',
      name: product?.name ?? '',
      nameEn: product?.nameEn ?? '',
      price: product?.price ?? 0,
      image: product?.image ?? '',
      quantity,
    });
    toast.success(t('cart.added'));
  };

  const handleBuyNow = () => {
    handleAddCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted animate-pulse rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
            <div className="h-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg">{t('prod.no_results')}</p>
        <Link href="/products">
          <Button className="mt-4"><ChevronLeft className="h-4 w-4 mr-1" />{t('common.back')}</Button>
        </Link>
      </div>
    );
  }

  const specs = product?.specs ?? {};

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {product?.id ? <EditContentButton href={'/admin?tab=products&editProduct=' + product.id} /> : null}
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">{t('nav.home')}</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary">{t('nav.products')}</Link>
        <span>/</span>
        <span className="text-foreground">{locale === 'en' ? (product?.nameEn ?? product?.name) : product?.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="relative aspect-square bg-white rounded-xl overflow-hidden border border-border/60">
            <Image
              src={product?.image ?? '/placeholder.png'}
              alt={locale === 'en' ? (product?.nameEn ?? 'Product') : (product?.name ?? '')}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {locale === 'en' ? (product?.nameEn ?? product?.name) : product?.name}
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(product?.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product?.reviewCount ?? 0} {t('prod.reviews')})</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product?.price ?? 0)}</span>
            {product?.originalPrice && product?.originalPrice > product?.price && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {(product?.stock ?? 0) > 0 ? (
              <><Check className="h-4 w-4 text-green-700" /><span className="text-green-700 font-semibold">{t('prod.in_stock')}</span></>
            ) : (
              <span className="text-red-500">{t('prod.out_stock')}</span>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Số lượng:</span>
            <div className="flex items-center border rounded-lg">
              <button className="px-3 py-2 hover:bg-muted" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span className="px-4 py-2 border-x font-medium">{quantity}</span>
              <button className="px-3 py-2 hover:bg-muted" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button size="lg" className="flex-1 gap-2" onClick={handleAddCart}>
              <ShoppingCart className="h-5 w-5" />
              {t('prod.add_cart')}
            </Button>
            <Button size="lg" variant="outline" className="flex-1 gap-2" onClick={handleBuyNow}>
              <Zap className="h-5 w-5" />
              {t('prod.buy_now')}
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="flex flex-col items-center text-center gap-1 p-3 bg-muted/50 rounded-lg">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-xs">Free Ship 500k+</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs">{locale === 'vi' ? 'Chính hãng' : 'Authentic'}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 p-3 bg-muted/50 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-xs">{locale === 'vi' ? 'Đổi trả 7 ngày' : '7-day return'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex border-b gap-0">
          {(['desc', 'specs', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'desc' ? t('prod.description') : tab === 'specs' ? t('prod.specs') : t('prod.reviews')}
            </button>
          ))}
        </div>
        <div className="py-6">
          {activeTab === 'desc' && (
            <div className="prose prose-sm max-w-none">
              <p>{locale === 'en' ? (product?.descriptionEn ?? product?.description) : product?.description}</p>
            </div>
          )}
          {activeTab === 'specs' && (
            <div className="max-w-lg">
              {Object.keys(specs ?? {}).length > 0 ? (
                Object.entries(specs).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex py-2 border-b last:border-0">
                    <span className="w-1/3 text-sm text-muted-foreground">{key}</span>
                    <span className="text-sm font-medium">{String(value ?? '')}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">{locale === 'vi' ? 'Chưa có thông số' : 'No specifications'}</p>
              )}
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {(product?.reviews?.length ?? 0) > 0 ? (
                (product.reviews ?? []).map((review: any) => (
                  <div key={review?.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{review?.user?.name ?? 'User'}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < (review?.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm">{review?.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">{locale === 'vi' ? 'Chưa có đánh giá' : 'No reviews yet'}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {(related?.length ?? 0) > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold mb-6">{t('prod.related')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(related ?? []).map((p: any) => (
              <Link key={p?.id} href={`/products/${p?.slug ?? p?.id}`}>
                <div className="bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all group">
                  <div className="relative aspect-square bg-muted">
                    <Image src={p?.image ?? '/placeholder.png'} alt={p?.name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform" sizes="25vw" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2">{locale === 'en' ? (p?.nameEn ?? p?.name) : p?.name}</h3>
                    <span className="text-sm font-bold text-primary">{formatPrice(p?.price ?? 0)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
