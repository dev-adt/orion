export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// PATCH: update a position (admin only) — title, parent, assigned user, AI permission, order.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data: any = {};
    if (typeof body.title === 'string') data.title = body.title.trim();
    if ('parentId' in body) data.parentId = body.parentId || null;
    if ('userId' in body) data.userId = body.userId || null;
    if ('canUseAiSummary' in body) data.canUseAiSummary = !!body.canUseAiSummary;
    if ('order' in body && Number.isFinite(body.order)) data.order = Number(body.order);

    // Prevent a position from being its own parent.
    if (data.parentId && data.parentId === params.id) {
      return NextResponse.json(
        { error: 'Vị trí không thể là cấp trên của chính nó' },
        { status: 400 },
      );
    }

    const position = await prisma.orgPosition.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ position });
  } catch (error) {
    console.error('Org position update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove a position (admin only). Children are re-parented to this position's parent.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const target = await prisma.orgPosition.findUnique({
      where: { id: params.id },
      select: { parentId: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy vị trí' }, { status: 404 });
    }

    // Re-parent children so the tree stays connected.
    await prisma.orgPosition.updateMany({
      where: { parentId: params.id },
      data: { parentId: target.parentId },
    });

    await prisma.orgPosition.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Org position delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
