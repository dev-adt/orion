export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','web_designer','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const allowed = ['title', 'titleEn', 'excerpt', 'excerptEn', 'content', 'contentEn', 'customCss', 'headerHtml', 'footerHtml', 'blocks', 'image', 'metaTitle', 'metaDescription', 'published', 'postCategoryId'];
    const data: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (body.visibility !== undefined) data.visibility = body.visibility === 'roles' ? 'roles' : 'public';
    if (body.viewRoles !== undefined) data.viewRoles = body.viewRoles || null;
    if (body.postCategoryId !== undefined) data.postCategoryId = body.postCategoryId || null;
    if (body.publishedAt !== undefined) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    // If publishing for the first time and no publishedAt provided, set to now
    if (body.published === true && body.publishedAt === undefined) {
      const existing = await prisma.post.findUnique({ where: { id: params.id }, select: { publishedAt: true } });
      if (existing && !existing.publishedAt) data.publishedAt = new Date();
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Admin post PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','web_designer','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin post DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
