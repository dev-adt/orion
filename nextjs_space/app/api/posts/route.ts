export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { visiblePostWhere } from '@/lib/post-filter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const where = visiblePostWhere();
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          title: true,
          titleEn: true,
          slug: true,
          excerpt: true,
          excerptEn: true,
          image: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({ posts, total });
  } catch (error: any) {
    console.error('Posts GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
