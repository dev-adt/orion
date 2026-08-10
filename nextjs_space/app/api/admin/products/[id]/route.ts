export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','web_designer'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.product.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','web_designer'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Whitelist editable fields only.
    const data: any = {};
    const strFields = ['name', 'nameEn', 'description', 'descriptionEn', 'image'];
    for (const f of strFields) if (body[f] !== undefined) data[f] = body[f];
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.originalPrice !== undefined)
      data.originalPrice =
        body.originalPrice === null || body.originalPrice === ''
          ? null
          : Number(body.originalPrice);
    if (body.stock !== undefined) data.stock = Number(body.stock);
    if (body.featured !== undefined) data.featured = !!body.featured;
    if (body.active !== undefined) data.active = !!body.active;
    if (Array.isArray(body.images)) data.images = body.images;
    if (body.specs !== undefined) data.specs = body.specs;

    const product = await prisma.product.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
