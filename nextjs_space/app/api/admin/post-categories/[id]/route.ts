export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['admin', 'web_designer', 'marketing'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.nameEn !== undefined) data.nameEn = body.nameEn || null;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.descriptionEn !== undefined) data.descriptionEn = body.descriptionEn || null;
    if (body.order !== undefined) data.order = body.order;
    if (body.slug !== undefined && body.slug) data.slug = body.slug;

    const cat = await prisma.postCategory.update({ where: { id: params.id }, data });
    return NextResponse.json({ category: cat });
  } catch (error: any) {
    console.error('Post category PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Detach posts from this category first (set null) to avoid FK issues
    await prisma.post.updateMany({ where: { postCategoryId: params.id }, data: { postCategoryId: null } });
    await prisma.postCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Post category DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
