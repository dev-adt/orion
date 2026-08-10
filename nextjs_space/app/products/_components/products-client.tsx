'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-context';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Search, Filter, Grid, List, Star, ShoppingCart, ChevronLeft, ChevronRight, SlidersHorizontal, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function ProductsClient() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s?.addItem);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams?.get('search') ?? '');
  const [category, setCategory] = useState(searchParams?.get('category') ?? '');
  const [sort, setSort] = useState(searchParams?.get('sort') ?? 'newest');
  const [page, setPage] = useState(parseInt(searchParams?.get('page') ?? '1'));
  const [minRating, setMinRating] = useState(searchParams?.get('minRating') ?? '');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (sort) params.set('sort', sort);
      if (minRating) params.set('minRating', minRating);
      params.set('page', page.toString());

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data?.products ?? []);
      setTotal(data?.total ?? 0);
      setPages(data?.pages ?? 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, page, minRating]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d?.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddCart = (product: any) => {
    addItem?.({
      productId: product?.id ?? '',
      name: product?.name ?? '',
      nameEn: product?.nameEn ?? '',
      price: product?.price ?? 0,
      image: product?.image ?? '',
      quantity: 1,
    });
    toast.success(t('cart.added'));
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-2">{t('prod.all')}</h1>
      <p className="text-muted-foreground mb-6">{total} {t('prod.items')}</p>

      {/* Search & Sort Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('prod.search')}
            value={search}
            onChange={(e: any) => { setSearch(e?.target?.value ?? ''); setPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e: any) => { setSort(e?.target?.value ?? 'newest'); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-background"
          >
            <option value="newest">{t('prod.sort_newest')}</option>
            <option value="price_asc">{t('prod.sort_price_asc')}</option>
            <option value="price_desc">{t('prod.sort_price_desc')}</option>
            <option value="rating">{t('prod.sort_rating')}</option>
          </select>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'fixed inset-0 z-40 bg-background p-4' : 'hidden'} md:block md:relative md:w-56 flex-shrink-0`}>
          <div className="flex items-center justify-between md:hidden mb-4">
            <h3 className="font-semibold">{t('prod.filter')}</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></Button>
          </div>
          <div className="space-y-6">
            {/* Category Filter */}
            <div>
              <h4 className="font-semibold text-sm mb-2">{t('prod.category')}</h4>
              <div className="space-y-1">
                <button
                  onClick={() => { setCategory(''); setPage(1); }}
                  className={`block w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${!category ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                >
                  {t('cat.view_all')}
                </button>
                {(categories ?? []).map((cat: any) => (
                  <button
                    key={cat?.id}
                    onClick={() => { setCategory(cat?.slug ?? ''); setPage(1); setShowFilters(false); }}
                    className={`block w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${category === cat?.slug ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                  >
                    {locale === 'en' ? (cat?.nameEn ?? cat?.name) : cat?.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h4 className="font-semibold text-sm mb-2">{t('prod.rating')}</h4>
              <div className="space-y-1">
                {[4, 3, 2, 1].map((r: number) => (
                  <button
                    key={r}
                    onClick={() => { setMinRating(minRating === r.toString() ? '' : r.toString()); setPage(1); }}
                    className={`flex items-center gap-1 w-full px-2 py-1.5 rounded text-sm transition-colors ${minRating === r.toString() ? 'bg-primary/10' : 'hover:bg-muted'}`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-1">& up</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-4`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-xl h-72" />
              ))}
            </div>
          ) : (products?.length ?? 0) === 0 ? (
            <div className="text-center py-20">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('prod.no_results')}</p>
            </div>
          ) : (
            <>
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {(products ?? []).map((product: any, i: number) => (
                  <motion.div
                    key={product?.id ?? i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className={`bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-300 group ${viewMode === 'list' ? 'flex' : ''}`}>
                      <Link href={`/products/${product?.slug ?? product?.id}`} className={viewMode === 'list' ? 'w-40 flex-shrink-0' : ''}>
                        <div className={`relative ${viewMode === 'list' ? 'h-full' : 'aspect-square'} bg-muted overflow-hidden`}>
                          <Image
                            src={product?.image ?? '/placeholder.png'}
                            alt={locale === 'en' ? (product?.nameEn ?? 'Product') : (product?.name ?? 'Sản phẩm')}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      </Link>
                      <div className="p-3 flex-1">
                        <Link href={`/products/${product?.slug ?? product?.id}`}>
                          <h3 className="font-medium text-sm line-clamp-2 mb-1 text-foreground hover:text-primary transition-colors">
                            {locale === 'en' ? (product?.nameEn ?? product?.name) : product?.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={`h-3 w-3 ${idx < Math.round(product?.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">{formatPrice(product?.price ?? 0)}</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleAddCart(product)}>
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(pages, 5) }).map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i + 1 ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
