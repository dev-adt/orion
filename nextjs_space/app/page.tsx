import { prisma } from '@/lib/prisma';
import { HomeClient } from './_components/home-client';
import { PageRenderer } from './_components/page-renderer';
import { parseBlocks } from '@/lib/page-blocks';
import { resolvePageProducts, resolvePagePosts, needsCategories } from '@/lib/page-server';
import { visiblePostWhere } from '@/lib/post-filter';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // If an admin has flagged a Page as the homepage, render that page instead.
  const homepage = await prisma.page.findFirst({ where: { isHomepage: true, published: true } });
  if (homepage) {
    const blocks = parseBlocks(homepage.blocks);
    const [productsByBlock, postsByBlock, cats] = await Promise.all([
      resolvePageProducts(blocks),
      resolvePagePosts(blocks),
      needsCategories(blocks),
    ]);
    return (
      <div className="min-h-screen">
        <PageRenderer blocks={blocks} productsByBlock={productsByBlock} postsByBlock={postsByBlock} categories={JSON.parse(JSON.stringify(cats ?? []))} />
      </div>
    );
  }

  const [categories, featuredProducts, latestPosts, settingsRows] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      where: { featured: true, active: true },
      include: { category: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.findMany({
      where: visiblePostWhere(),
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        titleEn: true,
        slug: true,
        excerpt: true,
        excerptEn: true,
        image: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    }),
    prisma.siteSetting.findMany(),
  ]);

  const siteSettings: Record<string, string> = {};
  for (const s of settingsRows) {
    siteSettings[s.key] = s.value;
  }

  return (
    <HomeClient
      categories={JSON.parse(JSON.stringify(categories ?? []))}
      featuredProducts={JSON.parse(JSON.stringify(featuredProducts ?? []))}
      latestPosts={JSON.parse(JSON.stringify(latestPosts ?? []))}
      siteSettings={siteSettings}
    />
  );
}
