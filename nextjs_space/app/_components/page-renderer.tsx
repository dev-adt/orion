'use client';

import { useTranslation } from '@/lib/i18n-context';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/i18n';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, ArrowRight, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { PageBlock } from '@/lib/page-blocks';
import { toEmbedUrl, isDirectVideoFile } from '@/lib/embed';
import { ContactForm } from './contact-form';
import { defaultContactFields } from '@/lib/page-blocks';

interface Props {
  blocks: PageBlock[];
  productsByBlock?: Record<string, any[]>;
  postsByBlock?: Record<string, any[]>;
  categories?: any[];
}

export function PageRenderer({ blocks, productsByBlock, postsByBlock, categories }: Props) {
  const { t, locale } = useTranslation();
  const addItem = useCartStore((s) => s?.addItem);
  const isVi = locale === 'vi';

  const pick = (vi: string, en?: string) => (isVi ? vi : (en || vi)) || '';

  const gridColsClass = (cols?: number) => {
    const c = cols === 2 ? 2 : cols === 4 ? 4 : 3;
    if (c === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (c === 4) return 'grid-cols-2 md:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
  };

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

  const renderProductCard = (product: any) => (
    <div key={product?.id} className="group bg-card rounded-xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <Link href={'/products/' + (product?.slug ?? '')} className="block relative aspect-square bg-muted overflow-hidden">
        {product?.image ? (
          <Image src={product.image} alt={pick(product?.name, product?.nameEn) || 'product'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 25vw" />
        ) : null}
      </Link>
      <div className="p-4">
        <Link href={'/products/' + (product?.slug ?? '')}>
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors">{pick(product?.name, product?.nameEn)}</h3>
        </Link>
        <div className="flex items-center gap-1 mt-2 text-amber-500">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="text-xs text-muted-foreground">{(product?.rating ?? 0).toFixed(1)} ({product?.reviewCount ?? 0})</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-primary">{formatPrice(product?.price ?? 0)}</span>
          <Button size="sm" variant="secondary" onClick={() => handleAddCart(product)} className="h-8 w-8 p-0" aria-label="add to cart">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {blocks.map((block) => {
        switch (block.type) {
          case 'hero':
            return (
              <section key={block.id} className="hero-gradient relative overflow-hidden">
                <div className="max-w-[1200px] mx-auto px-4 py-20 md:py-28">
                  <div className={(block.align === 'left' ? 'text-left mr-auto' : 'text-center mx-auto') + ' max-w-2xl'}>
                    <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">{pick(block.title, block.titleEn)}</h1>
                    {pick(block.subtitle, block.subtitleEn) ? (
                      <p className="text-lg text-muted-foreground mb-8">{pick(block.subtitle, block.subtitleEn)}</p>
                    ) : null}
                    {pick(block.buttonText, block.buttonTextEn) ? (
                      <Link href={block.buttonLink || '/products'}>
                        <Button size="lg" className="gap-2">{pick(block.buttonText, block.buttonTextEn)}<ArrowRight className="h-4 w-4" /></Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
                {block.image ? (
                  <div className="absolute inset-0 -z-10 opacity-20">
                    <Image src={block.image} alt="hero background" fill className="object-cover" />
                  </div>
                ) : null}
              </section>
            );
          case 'heading': {
            const Tag = (block.level === 'h3' ? 'h3' : 'h2') as any;
            return (
              <div key={block.id} className="max-w-[1200px] mx-auto px-4 pt-12 pb-2">
                <Tag className={(block.align === 'left' ? 'text-left' : block.align === 'right' ? 'text-right' : 'text-center') + ' font-display font-bold ' + (block.level === 'h3' ? 'text-2xl' : 'text-3xl md:text-4xl')}>{pick(block.text, block.textEn)}</Tag>
              </div>
            );
          }
          case 'richtext':
            return (
              <div key={block.id} className="max-w-[900px] mx-auto px-4 py-6">
                <div className="prose prose-neutral dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: (isVi ? block.html : (block.htmlEn || block.html)) || '' }} />
              </div>
            );
          case 'image':
            return block.url ? (
              <figure key={block.id} className="max-w-[1000px] mx-auto px-4 py-6">
                <div className="relative w-full aspect-[16/9] bg-muted rounded-xl overflow-hidden">
                  <Image src={block.url} alt={block.alt || 'image'} fill className="object-cover" sizes="(max-width:1000px) 100vw, 1000px" />
                </div>
                {pick(block.caption, block.captionEn) ? (
                  <figcaption className="text-center text-sm text-muted-foreground mt-2">{pick(block.caption, block.captionEn)}</figcaption>
                ) : null}
              </figure>
            ) : null;
          case 'products': {
            const items = (productsByBlock && productsByBlock[block.id]) || [];
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-10">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                {items.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{items.map(renderProductCard)}</div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">{isVi ? 'Chưa có sản phẩm.' : 'No products yet.'}</p>
                )}
              </section>
            );
          }
          case 'categories': {
            if (block.displayMode === 'products') {
              const items = (productsByBlock && productsByBlock[block.id]) || [];
              return (
                <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-10">
                  {pick(block.title, block.titleEn) ? (
                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">{pick(block.title, block.titleEn)}</h2>
                  ) : null}
                  {items.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{items.map(renderProductCard)}</div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm">{isVi ? 'Chưa có sản phẩm.' : 'No products yet.'}</p>
                  )}
                </section>
              );
            }
            const cats = categories || [];
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-10">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {cats.map((c: any) => (
                    <Link key={c?.id} href={'/products?category=' + (c?.slug ?? '')} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-card hover:shadow-md transition-shadow text-center">
                      <div className="relative h-14 w-14 rounded-full bg-muted overflow-hidden">
                        {c?.image ? <Image src={c.image} alt={pick(c?.name, c?.nameEn) || 'category'} fill className="object-cover" /> : null}
                      </div>
                      <span className="text-sm font-medium">{pick(c?.name, c?.nameEn)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          }
          case 'cta':
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-10">
                <div className="rounded-2xl bg-primary text-primary-foreground px-6 py-12 text-center">
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{pick(block.title, block.titleEn)}</h2>
                  {pick(block.subtitle, block.subtitleEn) ? (
                    <p className="opacity-90 mb-6 max-w-xl mx-auto">{pick(block.subtitle, block.subtitleEn)}</p>
                  ) : null}
                  {pick(block.buttonText, block.buttonTextEn) ? (
                    <Link href={block.buttonLink || '/products'}>
                      <Button size="lg" variant="secondary" className="gap-2">{pick(block.buttonText, block.buttonTextEn)}<ArrowRight className="h-4 w-4" /></Button>
                    </Link>
                  ) : null}
                </div>
              </section>
            );
          case 'posts': {
            const posts = (postsByBlock && postsByBlock[block.id]) || [];
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-10">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                {posts.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((p: any) => (
                      <Link key={p?.id} href={'/tin-tuc/' + (p?.slug ?? '')} className="group block rounded-xl border border-border/60 bg-card overflow-hidden hover:shadow-md transition-shadow">
                        {p?.image ? (
                          <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                            <Image src={p.image} alt={pick(p?.title, p?.titleEn) || 'post'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 100vw, 33vw" />
                          </div>
                        ) : null}
                        <div className="p-4">
                          <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">{pick(p?.title, p?.titleEn)}</h3>
                          {pick(p?.excerpt, p?.excerptEn) ? <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{pick(p?.excerpt, p?.excerptEn)}</p> : null}
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(p?.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">{isVi ? 'Chưa có bài viết.' : 'No posts yet.'}</p>
                )}
              </section>
            );
          }
          case 'video': {
            const src = toEmbedUrl(block.url);
            if (!src) return null;
            return (
              <figure key={block.id} className="max-w-[900px] mx-auto px-4 py-6">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-sm">
                  {isDirectVideoFile(block.url) ? (
                    <video src={block.url} controls className="absolute inset-0 w-full h-full" />
                  ) : (
                    <iframe
                      src={src}
                      title={pick(block.title, block.titleEn) || 'video'}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>
                {pick(block.caption, block.captionEn) ? (
                  <figcaption className="text-center text-sm text-muted-foreground mt-2">{pick(block.caption, block.captionEn)}</figcaption>
                ) : null}
              </figure>
            );
          }
          case 'embed': {
            if (!block.code) return null;
            return (
              <section key={block.id} className="max-w-[1000px] mx-auto px-4 py-6">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                <div className="page-embed" dangerouslySetInnerHTML={{ __html: block.code }} />
                {pick(block.caption, block.captionEn) ? (
                  <p className="text-center text-sm text-muted-foreground mt-2">{pick(block.caption, block.captionEn)}</p>
                ) : null}
              </section>
            );
          }
          case 'contact': {
            const fields = Array.isArray(block.fields) && block.fields.length > 0 ? block.fields : defaultContactFields();
            return (
              <section key={block.id} className="max-w-[720px] mx-auto px-4 py-10">
                <ContactForm
                  fields={fields}
                  title={block.title}
                  titleEn={block.titleEn}
                  subtitle={block.subtitle}
                  subtitleEn={block.subtitleEn}
                  submitText={block.submitText}
                  submitTextEn={block.submitTextEn}
                  successText={block.successText}
                  successTextEn={block.successTextEn}
                  showRequired={block.showRequired !== false}
                  thankYouUrl={block.thankYouUrl || ''}
                  source={pick(block.title, block.titleEn) || 'Page contact form'}
                />
              </section>
            );
          }
          case 'columns': {
            const items: any[] = Array.isArray(block.items) ? block.items : [];
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-8">
                <div className={'grid gap-6 ' + gridColsClass(block.cols)}>
                  {items.map((it, i) => (
                    <div key={i}>
                      {pick(it.title, it.titleEn) ? (
                        <h3 className="font-display text-lg font-bold mb-2">{pick(it.title, it.titleEn)}</h3>
                      ) : null}
                      <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: (isVi ? it.html : (it.htmlEn || it.html)) || '' }} />
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          case 'features': {
            const items: any[] = Array.isArray(block.items) ? block.items : [];
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-10">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                <div className={'grid gap-6 ' + gridColsClass(block.cols)}>
                  {items.map((it, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-card p-6 text-center shadow-sm">
                      {it.icon ? <div className="text-4xl mb-3">{it.icon}</div> : null}
                      <h3 className="font-semibold text-lg mb-1">{pick(it.title, it.titleEn)}</h3>
                      {pick(it.text, it.textEn) ? <p className="text-sm text-muted-foreground">{pick(it.text, it.textEn)}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          case 'stats': {
            const items: any[] = Array.isArray(block.items) ? block.items : [];
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-10">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                <div className={'grid gap-6 text-center ' + gridColsClass(items.length >= 4 ? 4 : items.length === 2 ? 2 : 3)}>
                  {items.map((it, i) => (
                    <div key={i}>
                      <div className="font-display text-3xl md:text-4xl font-bold text-primary">{it.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{pick(it.label, it.labelEn)}</div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          case 'testimonial': {
            const items: any[] = Array.isArray(block.items) ? block.items : [];
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-10">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                <div className={'grid gap-6 ' + gridColsClass(items.length >= 3 ? 3 : 2)}>
                  {items.map((it, i) => (
                    <figure key={i} className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                      <div className="text-primary text-3xl leading-none mb-2">&ldquo;</div>
                      <blockquote className="text-sm text-foreground/90 mb-4">{pick(it.quote, it.quoteEn)}</blockquote>
                      <figcaption className="text-sm">
                        <span className="font-semibold">{it.author}</span>
                        {it.role ? <span className="text-muted-foreground"> — {it.role}</span> : null}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            );
          }
          case 'accordion': {
            const items: any[] = Array.isArray(block.items) ? block.items : [];
            return (
              <section key={block.id} className="max-w-[820px] mx-auto px-4 py-10">
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                <div className="space-y-3">
                  {items.map((it, i) => (
                    <details key={i} className="group rounded-xl border border-border/60 bg-card px-5 py-4">
                      <summary className="flex items-center justify-between cursor-pointer font-medium list-none">
                        <span>{pick(it.q, it.qEn)}</span>
                        <span className="text-primary text-xl transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <div className="text-sm text-muted-foreground mt-3">{pick(it.a, it.aEn)}</div>
                    </details>
                  ))}
                </div>
              </section>
            );
          }
          case 'button': {
            if (!pick(block.text, block.textEn)) return null;
            const align = block.align === 'left' ? 'justify-start' : block.align === 'right' ? 'justify-end' : 'justify-center';
            const variant = block.variant === 'outline' ? 'outline' : block.variant === 'secondary' ? 'secondary' : 'default';
            return (
              <div key={block.id} className={'max-w-[1200px] mx-auto px-4 py-6 flex ' + align}>
                <Link href={block.link || '/products'}>
                  <Button size="lg" variant={variant as any} className="gap-2">{pick(block.text, block.textEn)}<ArrowRight className="h-4 w-4" /></Button>
                </Link>
              </div>
            );
          }
          case 'gallery': {
            const images: any[] = Array.isArray(block.images) ? block.images.filter((im: any) => im?.url) : [];
            if (images.length === 0) return null;
            return (
              <section key={block.id} className="max-w-[1200px] mx-auto px-4 py-8">
                <div className={'grid gap-3 ' + gridColsClass(block.cols)}>
                  {images.map((im, i) => (
                    <div key={i} className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                      <Image src={im.url} alt={im.alt || 'gallery image'} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 25vw" />
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          case 'mediatext': {
            const layout = block.layout || 'image-left';
            const ratioCls = block.ratio === 'square' ? 'aspect-square'
              : block.ratio === 'portrait' ? 'aspect-[3/4]'
              : block.ratio === 'auto' ? '' : 'aspect-video';
            const variant = block.buttonVariant === 'outline' ? 'outline' : block.buttonVariant === 'secondary' ? 'secondary' : 'default';
            const btnText = pick(block.buttonText, block.buttonTextEn);
            const imageEl = block.image ? (
              block.ratio === 'auto' ? (
                <img src={block.image} alt={block.imageAlt || pick(block.title, block.titleEn) || 'image'} className="w-full h-auto rounded-xl object-cover" />
              ) : (
                <div className={'relative w-full bg-muted rounded-xl overflow-hidden ' + ratioCls}>
                  <Image src={block.image} alt={block.imageAlt || pick(block.title, block.titleEn) || 'image'} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                </div>
              )
            ) : null;
            const textEl = (
              <div>
                {pick(block.title, block.titleEn) ? (
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{pick(block.title, block.titleEn)}</h2>
                ) : null}
                <div className="prose prose-neutral dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: (isVi ? block.html : (block.htmlEn || block.html)) || '' }} />
                {btnText ? (
                  <div className="mt-6">
                    <Link href={block.buttonLink || '#'}>
                      <Button size="lg" variant={variant as any} className="gap-2">{btnText}<ArrowRight className="h-4 w-4" /></Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            );
            const isVertical = layout === 'image-top' || layout === 'image-bottom';
            let content;
            if (isVertical) {
              content = (
                <div className="flex flex-col gap-6">
                  {layout === 'image-top' ? imageEl : null}
                  {textEl}
                  {layout === 'image-bottom' ? imageEl : null}
                </div>
              );
            } else {
              content = (
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  {layout === 'image-left' ? (
                    <>{imageEl}{textEl}</>
                  ) : (
                    <>
                      <div className="md:order-2">{imageEl}</div>
                      <div className="md:order-1">{textEl}</div>
                    </>
                  )}
                </div>
              );
            }
            return (
              <section key={block.id} style={block.background ? { background: block.background } : undefined}>
                <div className="max-w-[1200px] mx-auto px-4 py-12">{content}</div>
              </section>
            );
          }
          case 'html': {
            if (!block.code) return null;
            return (
              <section key={block.id} className="max-w-[1000px] mx-auto px-4 py-6">
                <div dangerouslySetInnerHTML={{ __html: block.code }} />
              </section>
            );
          }
          case 'css': {
            if (!block.css) return null;
            return <style key={block.id} dangerouslySetInnerHTML={{ __html: block.css }} />;
          }
          case 'header': {
            if (!block.code) return null;
            return (
              <header key={block.id} className="w-full" style={block.background ? { background: block.background } : undefined}>
                <div className={block.fullWidth === false ? 'max-w-[1200px] mx-auto px-4' : 'px-4'} dangerouslySetInnerHTML={{ __html: block.code }} />
              </header>
            );
          }
          case 'footer': {
            if (!block.code) return null;
            return (
              <footer key={block.id} className="w-full" style={block.background ? { background: block.background } : undefined}>
                <div className={block.fullWidth === false ? 'max-w-[1200px] mx-auto px-4' : 'px-4'} dangerouslySetInnerHTML={{ __html: block.code }} />
              </footer>
            );
          }
          case 'spacer':
            return <div key={block.id} style={{ height: (block.height ?? 32) + 'px' }} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
