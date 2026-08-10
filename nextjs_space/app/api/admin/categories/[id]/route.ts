export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['admin', 'web_designer'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.nameEn !== undefined) data.nameEn = body.nameEn || body.name || undefined;
    if (body.icon !== undefined) data.icon = body.icon || null;
    if (body.image !== undefined) data.image = body.image || null;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.descriptionEn !== undefined) data.descriptionEn = body.descriptionEn || null;
    if (body.slug !== undefined && body.slug) data.slug = body.slug;

    const cat = await prisma.category.update({ where: { id: params.id }, data });
    return NextResponse.json({ category: cat });
  } catch (error: any) {
    console.error('Category PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const count = await prisma.product.count({ where: { categoryId: params.id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Không thể xóa: danh mục đang có ${count} sản phẩm. Vui lòng chuyển hoặc xóa các sản phẩm này trước.` },
        { status: 400 }
      );
    }
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Category DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
