'use client';

import { useTranslation } from '@/lib/i18n-context';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/i18n';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  ArrowRight,
  Star,
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  categories: any[];
  featuredProducts: any[];
  latestPosts?: any[];
  siteSettings?: Record<string, string>;
}

export function HomeClient({ categories, featuredProducts, latestPosts, siteSettings }: Props) {
  const { t, locale } = useTranslation();
  const addItem = useCartStore((s) => s?.addItem);
  const ss = siteSettings ?? {};

  const heroTitle = (locale === 'vi' ? ss.hero_title : ss.hero_title_en) || (locale === 'vi' ? 'Khám phá công nghệ' : 'Discover Technology');
  const heroHighlight = (locale === 'vi' ? ss.hero_title_highlight : ss.hero_title_highlight_en) || (locale === 'vi' ? 'trong cuộc sống' : 'in your life');
  const heroSubtitle = (locale === 'vi' ? ss.hero_subtitle : ss.hero_subtitle_en) || (locale === 'vi' ? 'Trải nghiệm mua sắm tinh tế với sản phẩm công nghệ được tuyển chọn kỹ lưỡng, phục vụ phong cách sống hiện đại của bạn.' : 'An elevated shopping experience with carefully curated tech products for your modern lifestyle.');

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

  // Split featured products: first 2 large, rest in grid
  const heroProducts = (featuredProducts ?? []).slice(0, 2);
  const gridProducts = (featuredProducts ?? []).slice(2);

  return (
    <div className="bg-[#FAF8F5] dark:bg-background">
      {/* ─── Editorial Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] dark:text-amber-500/80 font-medium mb-4">
                {locale === 'vi' ? '— Bộ sưu tập mới' : '— New Collection'}
              </p>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] text-[#2C2C2C] dark:text-foreground mb-4">
                {heroTitle}{' '}
                <span className="italic text-[#8B7355] dark:text-amber-500">{heroHighlight}</span>
              </h1>
              <p className="text-base md:text-lg text-[#6B6B6B] dark:text-muted-foreground leading-relaxed mb-8 max-w-md">
                {heroSubtitle}
              </p>
              <div className="flex items-center gap-4">
                <Link href="/products">
                  <Button className="bg-[#2C2C2C] hover:bg-[#1a1a1a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90 text-white rounded-none px-8 py-3 h-auto text-sm tracking-wider uppercase font-medium">
                    {locale === 'vi' ? 'Xem sản phẩm' : 'Shop Now'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Featured image collage */}
            {heroProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div className="relative aspect-[4/5] rounded-sm overflow-hidden bg-[#EFEBE5] dark:bg-muted">
                  <Image
                    src={heroProducts[0]?.image ?? '/placeholder.png'}
                    alt={locale === 'en' ? (heroProducts[0]?.nameEn ?? heroProducts[0]?.name ?? 'Product') : (heroProducts[0]?.name ?? 'Sản phẩm')}
                    fill
                    className="object-contain p-8"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
                {heroProducts[1] && (
                  <div className="absolute -bottom-6 -left-6 w-40 h-40 md:w-52 md:h-52 rounded-sm overflow-hidden border-4 border-[#FAF8F5] dark:border-background bg-[#EFEBE5] dark:bg-muted shadow-lg">
                    <Image
                      src={heroProducts[1]?.image ?? '/placeholder.png'}
                      alt={locale === 'en' ? (heroProducts[1]?.nameEn ?? heroProducts[1]?.name ?? 'Product') : (heroProducts[1]?.name ?? 'Sản phẩm')}
                      fill
                      className="object-contain p-4"
                      sizes="200px"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Elegant Divider ─── */}
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="border-t border-[#D4C5B0] dark:border-border" />
      </div>

      {/* ─── Categories as editorial tags ─── */}
      <section className="max-w-[1200px] mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] dark:text-amber-500/80 font-medium mb-3">
            {locale === 'vi' ? 'Danh mục' : 'Categories'}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#2C2C2C] dark:text-foreground">
            {locale === 'vi' ? 'Khám phá theo phong cách' : 'Explore by Style'}
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {(categories ?? []).map((cat: any, i: number) => (
            <motion.div
              key={cat?.id ?? i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link href={`/products?category=${cat?.slug ?? ''}`}>
                <div className="group px-6 py-3 border border-[#D4C5B0] dark:border-border rounded-none hover:bg-[#2C2C2C] dark:hover:bg-foreground hover:border-[#2C2C2C] dark:hover:border-foreground transition-all duration-300">
                  <span className="text-sm tracking-wider uppercase font-medium text-[#2C2C2C] dark:text-foreground group-hover:text-white dark:group-hover:text-background transition-colors">
                    {locale === 'en' ? (cat?.nameEn ?? cat?.name) : cat?.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Elegant Divider ─── */}
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="border-t border-[#D4C5B0] dark:border-border" />
      </div>

      {/* ─── Featured Products — Editorial Grid ─── */}
      <section className="max-w-[1200px] mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] dark:text-amber-500/80 font-medium mb-3">
              {locale === 'vi' ? 'Được tuyển chọn' : 'Curated'}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#2C2C2C] dark:text-foreground">
              {locale === 'vi' ? 'Sản phẩm nổi bật' : 'Featured Products'}
            </h2>
          </div>
          <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-[#8B7355] dark:text-amber-500 hover:text-[#2C2C2C] dark:hover:text-foreground font-medium tracking-wider uppercase transition-colors">
            {locale === 'vi' ? 'Xem tất cả' : 'View All'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Magazine-style product grid: first product large, rest in smaller grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {heroProducts.map((product: any, i: number) => (
            <motion.div
              key={product?.id ?? i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="group bg-white dark:bg-card border border-[#E8E0D4] dark:border-border overflow-hidden">
                <Link href={`/products/${product?.slug ?? product?.id}`}>
                  <div className="relative aspect-[4/3] bg-[#F5F0EB] dark:bg-muted overflow-hidden">
                    <Image
                      src={product?.image ?? '/placeholder.png'}
                      alt={locale === 'en' ? (product?.nameEn ?? product?.name ?? 'Product') : (product?.name ?? 'Sản phẩm')}
                      fill
                      className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {product?.originalPrice && product?.originalPrice > product?.price && (
                      <span className="absolute top-4 left-4 bg-[#8B7355] text-white text-xs px-3 py-1 tracking-wider uppercase font-medium">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-5">
                  <Link href={`/products/${product?.slug ?? product?.id}`}>
                    <h3 className="font-serif text-lg md:text-xl font-medium text-[#2C2C2C] dark:text-foreground mb-1 group-hover:text-[#8B7355] dark:group-hover:text-amber-500 transition-colors">
                      {locale === 'en' ? (product?.nameEn ?? product?.name) : product?.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-[#8B7355] dark:text-amber-500/70 uppercase tracking-wider mb-3">
                    {locale === 'en' ? (product?.category?.nameEn ?? product?.category?.name ?? '') : (product?.category?.name ?? '')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-xl font-semibold text-[#2C2C2C] dark:text-foreground">
                        {formatPrice(product?.price ?? 0)}
                      </span>
                      {product?.originalPrice && product?.originalPrice > product?.price && (
                        <span className="text-sm text-[#A0A0A0] line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none border border-[#D4C5B0] dark:border-border hover:bg-[#2C2C2C] dark:hover:bg-foreground hover:text-white dark:hover:text-background hover:border-[#2C2C2C]"
                      onClick={() => handleAddCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Smaller product grid */}
        {gridProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {gridProducts.map((product: any, i: number) => (
              <motion.div
                key={product?.id ?? i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="group bg-white dark:bg-card border border-[#E8E0D4] dark:border-border overflow-hidden">
                  <Link href={`/products/${product?.slug ?? product?.id}`}>
                    <div className="relative aspect-square bg-[#F5F0EB] dark:bg-muted overflow-hidden">
                      <Image
                        src={product?.image ?? '/placeholder.png'}
                        alt={locale === 'en' ? (product?.nameEn ?? product?.name ?? 'Product') : (product?.name ?? 'Sản phẩm')}
                        fill
                        className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {product?.originalPrice && product?.originalPrice > product?.price && (
                        <span className="absolute top-3 left-3 bg-[#8B7355] text-white text-[10px] px-2 py-0.5 tracking-wider uppercase font-medium">
                          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-3 md:p-4">
                    <Link href={`/products/${product?.slug ?? product?.id}`}>
                      <h3 className="font-medium text-sm text-[#2C2C2C] dark:text-foreground line-clamp-2 mb-1 group-hover:text-[#8B7355] dark:group-hover:text-amber-500 transition-colors">
                        {locale === 'en' ? (product?.nameEn ?? product?.name) : product?.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3 w-3 ${idx < Math.round(product?.rating ?? 0) ? 'text-[#8B7355] fill-[#8B7355]' : 'text-[#D4C5B0]'}`}
                        />
                      ))}
                      <span className="text-xs text-[#A0A0A0]">({product?.reviewCount ?? 0})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-semibold text-[#2C2C2C] dark:text-foreground">
                        {formatPrice(product?.price ?? 0)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-none hover:bg-[#2C2C2C] dark:hover:bg-foreground hover:text-white dark:hover:text-background"
                        onClick={() => handleAddCart(product)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Mobile view-all */}
        <div className="mt-8 text-center md:hidden">
          <Link href="/products">
            <Button variant="outline" className="rounded-none border-[#2C2C2C] dark:border-foreground text-[#2C2C2C] dark:text-foreground px-8 tracking-wider uppercase text-sm">
              {locale === 'vi' ? 'Xem tất cả sản phẩm' : 'View All Products'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Editorial Quote / Brand Statement ─── */}
      <section className="bg-[#2C2C2C] dark:bg-card">
        <div className="max-w-[1200px] mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] font-medium mb-6">
              {locale === 'vi' ? '— Triết lý của chúng tôi' : '— Our Philosophy'}
            </p>
            <blockquote className="font-serif text-2xl md:text-4xl font-normal text-white dark:text-foreground leading-relaxed max-w-3xl mx-auto italic">
              {locale === 'vi'
                ? '"Công nghệ không chỉ là công cụ — mà là cách bạn thể hiện phong cách sống và kết nối với thế giới."'
                : '"Technology is not just a tool — it\'s how you express your lifestyle and connect with the world."'}
            </blockquote>
          </motion.div>
        </div>
      </section>

      {/* ─── Latest Posts — Editorial style ─── */}
      {(latestPosts?.length ?? 0) > 0 && (
        <section className="bg-[#FAF8F5] dark:bg-background">
          <div className="max-w-[1200px] mx-auto px-4 py-14">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] dark:text-amber-500/80 font-medium mb-3">
                  {locale === 'vi' ? 'Câu chuyện' : 'Stories'}
                </p>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#2C2C2C] dark:text-foreground">
                  {locale === 'vi' ? 'Tin tức & Bài viết' : 'News & Stories'}
                </h2>
              </div>
              <Link href="/tin-tuc" className="hidden md:flex items-center gap-1 text-sm text-[#8B7355] dark:text-amber-500 hover:text-[#2C2C2C] dark:hover:text-foreground font-medium tracking-wider uppercase transition-colors">
                {locale === 'vi' ? 'Xem tất cả' : 'Read All'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(latestPosts ?? []).map((post: any, i: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/tin-tuc/${post.slug}`}>
                    <article className="group h-full flex flex-col">
                      <div className="relative aspect-[3/2] bg-[#EFEBE5] dark:bg-muted overflow-hidden mb-4">
                        {post.image ? (
                          <Image
                            src={post.image}
                            alt={locale === 'en' ? (post.titleEn ?? post.title) : post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-10 w-10 text-[#D4C5B0]" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8B7355] dark:text-amber-500/70 tracking-wider uppercase mb-2">
                        <Calendar className="h-3 w-3" />
                        <span suppressHydrationWarning>{new Date(post.createdAt).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}</span>
                        {post.author?.name && (
                          <>
                            <span>·</span>
                            <span>{post.author.name}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-medium text-[#2C2C2C] dark:text-foreground mb-2 line-clamp-2 group-hover:text-[#8B7355] dark:group-hover:text-amber-500 transition-colors">
                        {locale === 'en' ? (post.titleEn ?? post.title) : post.title}
                      </h3>
                      <p className="text-sm text-[#6B6B6B] dark:text-muted-foreground line-clamp-2 flex-1">
                        {locale === 'en' ? (post.excerptEn ?? post.excerpt) : post.excerpt}
                      </p>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
