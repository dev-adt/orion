export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

// GET: list all org positions (any staff). Includes assigned user info.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const positions = await prisma.orgPosition.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    // Attach user info for positions that have a user.
    const userIds = Array.from(
      new Set(positions.map((p) => p.userId).filter(Boolean) as string[]),
    );
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = positions.map((p) => ({
      ...p,
      user: p.userId ? userMap.get(p.userId) || null : null,
    }));

    return NextResponse.json({ positions: result });
  } catch (error) {
    console.error('Org positions list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: create a new position (admin only).
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Thiếu tên vị trí' }, { status: 400 });
    }

    const position = await prisma.orgPosition.create({
      data: {
        title,
        parentId: body.parentId || null,
        userId: body.userId || null,
        canUseAiSummary: !!body.canUseAiSummary,
        order: Number.isFinite(body.order) ? Number(body.order) : 0,
      },
    });

    return NextResponse.json({ position });
  } catch (error) {
    console.error('Org position create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
