import { prisma } from '@/lib/prisma';
import { parseBlocks, type PageBlock } from '@/lib/page-blocks';

// Resolve product lists for any 'products' blocks on a page.
// Returns a map of blockId -> products[] so the client renderer can display them.
export async function resolvePageProducts(blocks: PageBlock[]): Promise<Record<string, any[]>> {
  const result: Record<string, any[]> = {};
  const productBlocks = blocks.filter(
    (b) => b.type === 'products' || (b.type === 'categories' && (b as any).displayMode === 'products'),
  );
  await Promise.all(
    productBlocks.map(async (b) => {
      const take = Math.min(Math.max(parseInt(String(b.limit ?? 8)) || 8, 1), 24);
      const where: any = { active: true };
      let orderBy: any = { createdAt: 'desc' };
      if (b.type === 'categories') {
        if (b.categorySlug) where.category = { slug: b.categorySlug };
      } else if (b.source === 'featured') {
        where.featured = true;
      } else if (b.source === 'category' && b.categorySlug) {
        where.category = { slug: b.categorySlug };
      }
      try {
        const products = await prisma.product.findMany({ where, orderBy, take, include: { category: true } });
        result[b.id] = products;
      } catch (e) {
        console.error('resolvePageProducts error for block', b.id, e);
        result[b.id] = [];
      }
    }),
  );
  return result;
}

// Resolve latest posts for 'posts' blocks.
export async function resolvePagePosts(blocks: PageBlock[]): Promise<Record<string, any[]>> {
  const result: Record<string, any[]> = {};
  const postBlocks = blocks.filter((b) => b.type === 'posts');
  if (!postBlocks.length) return result;
  // Import dynamically to avoid circular
  const { visiblePostWhere } = await import('@/lib/post-filter');
  await Promise.all(
    postBlocks.map(async (b) => {
      const take = Math.min(Math.max(parseInt(String(b.limit ?? 3)) || 3, 1), 12);
      try {
        const posts = await prisma.post.findMany({
          where: visiblePostWhere(),
          orderBy: { createdAt: 'desc' },
          take,
          select: {
            id: true, title: true, titleEn: true, slug: true,
            excerpt: true, excerptEn: true, image: true, createdAt: true,
            author: { select: { name: true } },
          },
        });
        result[b.id] = posts;
      } catch {
        result[b.id] = [];
      }
    }),
  );
  return result;
}

export async function needsCategories(blocks: PageBlock[]): Promise<any[]> {
  const hasCat = blocks.some((b) => b.type === 'categories');
  if (!hasCat) return [];
  try {
    return await prisma.category.findMany({ orderBy: { name: 'asc' } });
  } catch {
    return [];
  }
}

export { parseBlocks };
