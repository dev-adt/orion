export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['admin', 'web_designer'];

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const page = await prisma.page.findUnique({ where: { id: params.id } });
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ page });
  } catch (error: any) {
    console.error('Admin page GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data: any = {};
    const strFields = ['title', 'titleEn', 'metaTitle', 'metaDescription'];
    for (const key of strFields) {
      if (body[key] !== undefined) data[key] = body[key] || null;
    }
    if (body.blocks !== undefined) data.blocks = typeof body.blocks === 'string' ? body.blocks : JSON.stringify(body.blocks);
    if (body.blocksEn !== undefined) data.blocksEn = body.blocksEn ? (typeof body.blocksEn === 'string' ? body.blocksEn : JSON.stringify(body.blocksEn)) : null;
    if (body.published !== undefined) data.published = body.published;
    if (body.showInMenu !== undefined) data.showInMenu = body.showInMenu;
    if (body.menuOrder !== undefined) data.menuOrder = body.menuOrder;
    if (body.slug !== undefined && body.slug) data.slug = body.slug;
    if (body.visibility !== undefined) data.visibility = body.visibility === 'roles' ? 'roles' : 'public';
    if (body.viewRoles !== undefined) data.viewRoles = body.viewRoles || null;

    // Handle set-homepage: unset all others first
    if (body.isHomepage === true) {
      await prisma.page.updateMany({ where: { isHomepage: true, NOT: { id: params.id } }, data: { isHomepage: false } });
      data.isHomepage = true;
    } else if (body.isHomepage === false) {
      data.isHomepage = false;
    }

    const page = await prisma.page.update({ where: { id: params.id }, data });
    return NextResponse.json({ page });
  } catch (error: any) {
    console.error('Admin page PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.page.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin page DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
