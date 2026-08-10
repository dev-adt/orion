export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['admin', 'web_designer', 'marketing'];

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
    const cats = await prisma.postCategory.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { posts: true } } },
    });
    return NextResponse.json({ categories: cats });
  } catch (error: any) {
    console.error('Post categories GET error:', error);
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
    const { name, nameEn, description, descriptionEn, order } = body;
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

    let slug = body.slug ? slugify(body.slug) : slugify(name);
    if (!slug) slug = 'chuyen-muc-' + Date.now().toString(36);
    const existing = await prisma.postCategory.findUnique({ where: { slug } });
    if (existing) slug = slug + '-' + Date.now().toString(36);

    const cat = await prisma.postCategory.create({
      data: {
        name,
        nameEn: nameEn || null,
        slug,
        description: description || null,
        descriptionEn: descriptionEn || null,
        order: order ?? 0,
      },
    });
    return NextResponse.json({ category: cat }, { status: 201 });
  } catch (error: any) {
    console.error('Post categories POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
