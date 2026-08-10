export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['admin', 'web_designer'];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 80);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const pages = await prisma.page.findMany({
      orderBy: [{ menuOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ pages });
  } catch (error: any) {
    console.error('Admin pages GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, titleEn, blocks, blocksEn, published, showInMenu, menuOrder, metaTitle, metaDescription, isHomepage, visibility, viewRoles } = body;
    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    let slug = body.slug ? slugify(body.slug) : slugify(title);
    if (!slug) slug = 'trang-' + Date.now().toString(36);
    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) {
      slug = slug + '-' + Date.now().toString(36);
    }

    // If this new page is marked homepage, unset others
    if (isHomepage === true) {
      await prisma.page.updateMany({ where: { isHomepage: true }, data: { isHomepage: false } });
    }

    const page = await prisma.page.create({
      data: {
        title,
        titleEn: titleEn || null,
        slug,
        blocks: typeof blocks === 'string' ? blocks : JSON.stringify(blocks || []),
        blocksEn: blocksEn ? (typeof blocksEn === 'string' ? blocksEn : JSON.stringify(blocksEn)) : null,
        isHomepage: isHomepage ?? false,
        published: published ?? true,
        showInMenu: showInMenu ?? false,
        menuOrder: menuOrder ?? 0,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        visibility: visibility === 'roles' ? 'roles' : 'public',
        viewRoles: viewRoles || null,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    console.error('Admin pages POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
