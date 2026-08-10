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
    const cats = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({ categories: cats });
  } catch (error: any) {
    console.error('Categories GET error:', error);
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
    const { name, nameEn, icon, image, description, descriptionEn } = body;
    if (!name) return NextResponse.json({ error: 'Thiếu tên danh mục' }, { status: 400 });

    let slug = body.slug ? slugify(body.slug) : slugify(name);
    if (!slug) slug = 'danh-muc-' + Date.now().toString(36);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) slug = slug + '-' + Date.now().toString(36);

    const cat = await prisma.category.create({
      data: {
        name,
        nameEn: nameEn || name,
        slug,
        icon: icon || null,
        image: image || null,
        description: description || null,
        descriptionEn: descriptionEn || null,
      },
    });
    return NextResponse.json({ category: cat }, { status: 201 });
  } catch (error: any) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
