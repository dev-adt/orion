export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: params.slug },
      include: { author: { select: { name: true } } },
    });
    if (!post || !post.published) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Post detail error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
