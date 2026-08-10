export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      where: { published: true, showInMenu: true, isHomepage: false },
      orderBy: [{ menuOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, title: true, titleEn: true, slug: true },
    });
    return NextResponse.json({ pages });
  } catch (error: any) {
    console.error('Menu pages GET error:', error);
    return NextResponse.json({ pages: [] });
  }
}
