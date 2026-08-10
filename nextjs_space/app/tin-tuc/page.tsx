import { prisma } from '@/lib/prisma';
import { NewsListClient } from './_components/news-list-client';
import { visiblePostWhere } from '@/lib/post-filter';

export const dynamic = 'force-dynamic';

export default async function NewsPage({ searchParams }: { searchParams: { category?: string } }) {
  const activeCategory = searchParams?.category || '';

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: visiblePostWhere(activeCategory ? { postCategory: { slug: activeCategory } } : {}),
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        titleEn: true,
        slug: true,
        excerpt: true,
        excerptEn: true,
        image: true,
        createdAt: true,
        publishedAt: true,
        author: { select: { name: true } },
        postCategory: { select: { id: true, name: true, nameEn: true, slug: true } },
      },
    }),
    prisma.postCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
  ]);

  return (
    <NewsListClient
      posts={JSON.parse(JSON.stringify(posts ?? []))}
      categories={JSON.parse(JSON.stringify(categories ?? []))}
      activeCategory={activeCategory}
    />
  );
}
