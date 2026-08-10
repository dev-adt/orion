import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PostDetailClient } from './_components/post-detail-client';
import { EditContentButton } from '@/app/_components/edit-content-button';
import { RestrictedNotice } from '@/app/_components/restricted-notice';
import { parseBlocks } from '@/lib/page-blocks';
import { resolvePageProducts, resolvePagePosts, needsCategories } from '@/lib/page-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { canViewContent } from '@/lib/roles';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } });
  if (!post || !post.published) return {};
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
  };
}

export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: { author: { select: { name: true } }, postCategory: { select: { id: true, name: true, nameEn: true, slug: true } } },
  });

  const now = new Date();
  const notReady = post?.publishedAt ? new Date(post.publishedAt) > now : false;
  const expired = post?.expiresAt ? new Date(post.expiresAt) <= now : false;
  if (!post || !post.published || notReady || expired) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!canViewContent(post.visibility, post.viewRoles, role)) {
    return <RestrictedNotice loggedIn={!!session?.user} />;
  }

  const blocks = parseBlocks(post.blocks);
  const [productsByBlock, postsByBlock, categories] = await Promise.all([
    resolvePageProducts(blocks),
    resolvePagePosts(blocks),
    needsCategories(blocks),
  ]);

  return (
    <>
      <EditContentButton href={'/admin?tab=posts&editPost=' + post.id} />
      <PostDetailClient
        post={JSON.parse(JSON.stringify(post))}
        blocks={blocks}
        productsByBlock={productsByBlock}
        postsByBlock={postsByBlock}
        categories={categories}
      />
    </>
  );
}
