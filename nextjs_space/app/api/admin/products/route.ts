export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Admin-only: create a new product.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','web_designer'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      nameEn,
      description,
      descriptionEn,
      price,
      originalPrice,
      image,
      images,
      categoryId,
      stock,
      featured,
      specs,
    } = body ?? {};

    if (!name || !categoryId || price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Missing required fields: name, categoryId, price' },
        { status: 400 },
      );
    }

    // Build a unique slug.
    const base = slugify(nameEn || name) || `product-${Date.now()}`;
    let slug = base;
    let n = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        nameEn: nameEn || name,
        slug,
        description: description ?? '',
        descriptionEn: descriptionEn ?? '',
        price: Number(price),
        originalPrice:
          originalPrice !== undefined && originalPrice !== null && originalPrice !== ''
            ? Number(originalPrice)
            : null,
        image: image || 'https://placehold.co/600x600?text=No+Image',
        images: Array.isArray(images) ? images : [],
        categoryId,
        stock: stock !== undefined ? Number(stock) : 100,
        featured: !!featured,
        specs: specs ?? {},
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 },
    );
  }
}
