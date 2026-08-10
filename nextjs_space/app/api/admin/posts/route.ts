export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 80);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','web_designer','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true, email: true } }, postCategory: { select: { id: true, name: true, nameEn: true, slug: true } } },
    });
    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Admin posts GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','web_designer','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, titleEn, excerpt, excerptEn, content, contentEn, customCss, headerHtml, footerHtml, blocks, image, metaTitle, metaDescription, published, publishedAt, expiresAt, postCategoryId, visibility, viewRoles } = body;
    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    let slug = slugify(title);
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const userId = (session.user as any)?.id;

    const post = await prisma.post.create({
      data: {
        title,
        titleEn: titleEn || null,
        slug,
        excerpt: excerpt || null,
        excerptEn: excerptEn || null,
        content: content || null,
        contentEn: contentEn || null,
        customCss: customCss || null,
        headerHtml: headerHtml || null,
        footerHtml: footerHtml || null,
        blocks: blocks || null,
        image: image || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        published: published ?? false,
        publishedAt: published ? (publishedAt ? new Date(publishedAt) : new Date()) : (publishedAt ? new Date(publishedAt) : null),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        postCategoryId: postCategoryId || null,
        authorId: userId || null,
        visibility: visibility === 'roles' ? 'roles' : 'public',
        viewRoles: viewRoles || null,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    console.error('Admin posts POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
