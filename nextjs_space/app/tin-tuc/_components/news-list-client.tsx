'use client';

import { useTranslation } from '@/lib/i18n-context';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  posts: any[];
  categories?: any[];
  activeCategory?: string;
}

export function NewsListClient({ posts, categories, activeCategory }: Props) {
  const { locale } = useTranslation();
  const cats = categories || [];
  const active = activeCategory || '';

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
          <FileText className="inline h-8 w-8 mr-2 text-primary" />
          {locale === 'vi' ? 'Tin tức & Bài viết' : 'News & Articles'}
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {locale === 'vi'
            ? 'Cập nhật kiến thức, mẹo hay và tin tức mới nhất.'
            : 'Stay updated with the latest tips, tricks and news.'}
        </p>
      </div>

      {cats.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <Link href="/tin-tuc" className={'rounded-full px-4 py-1.5 text-sm border transition-colors ' + (!active ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent')}>
            {locale === 'vi' ? 'Tất cả' : 'All'}
          </Link>
          {cats.map((c: any) => (
            <Link key={c.id} href={'/tin-tuc?category=' + c.slug} className={'rounded-full px-4 py-1.5 text-sm border transition-colors ' + (active === c.slug ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent')}>
              {locale === 'en' ? (c.nameEn || c.name) : c.name}
            </Link>
          ))}
        </div>
      ) : null}

      {posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {locale === 'vi' ? 'Chưa có bài viết nào.' : 'No posts yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any, i: number) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/tin-tuc/${post.slug}`}>
                <article className="bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col">
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={locale === 'en' ? (post.titleEn ?? post.title) : post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      {post.author?.name && (
                        <>
                          <span>•</span>
                          <span>{post.author.name}</span>
                        </>
                      )}
                    </div>
                    <h2 className="font-display font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {locale === 'en' ? (post.titleEn ?? post.title) : post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                      {locale === 'en' ? (post.excerptEn ?? post.excerpt) : post.excerpt}
                    </p>
                    <div className="mt-3 flex items-center text-primary text-sm font-medium gap-1">
                      {locale === 'vi' ? 'Đọc tiếp' : 'Read more'}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
