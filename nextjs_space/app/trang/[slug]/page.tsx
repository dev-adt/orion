export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { parseBlocks } from '@/lib/page-blocks';
import { resolvePageProducts, resolvePagePosts, needsCategories } from '@/lib/page-server';
import { PageRenderer } from '@/app/_components/page-renderer';
import { EditContentButton } from '@/app/_components/edit-content-button';
import { RestrictedNotice } from '@/app/_components/restricted-notice';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { canViewContent } from '@/lib/roles';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page) return { title: 'Không tìm thấy trang' };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  };
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page || !page.published) notFound();

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!canViewContent(page.visibility, page.viewRoles, role)) {
    return <RestrictedNotice loggedIn={!!session?.user} />;
  }

  const blocks = parseBlocks(page.blocks);
  const [productsByBlock, postsByBlock, categories] = await Promise.all([
    resolvePageProducts(blocks),
    resolvePagePosts(blocks),
    needsCategories(blocks),
  ]);

  return (
    <div className="min-h-screen">
      <EditContentButton href={'/admin?tab=pages&editPage=' + page.id} />
      <PageRenderer blocks={blocks} productsByBlock={productsByBlock} postsByBlock={postsByBlock} categories={categories} />
    </div>
  );
}
