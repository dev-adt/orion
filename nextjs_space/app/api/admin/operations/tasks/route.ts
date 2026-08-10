export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

async function attachUsers(tasks: any[]) {
  const ids = Array.from(
    new Set(
      tasks.flatMap((t) => [t.assignerId, t.assigneeId]).filter(Boolean),
    ),
  ) as string[];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const map = new Map(users.map((u) => [u.id, u]));
  return tasks.map((t) => ({
    ...t,
    assigner: map.get(t.assignerId) || null,
    assignee: map.get(t.assigneeId) || null,
  }));
}

// GET: list tasks. ?box=received (assigned to me) | assigned (created by me). Admin ?box=all.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;
    if (!session?.user || !STAFF.includes(role || '') || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const box = request.nextUrl.searchParams.get('box') || 'received';
    let where: any;
    if (box === 'assigned') {
      where = { assignerId: userId };
    } else if (box === 'all' && role === 'admin') {
      where = {};
    } else if (box === 'received' && role === 'admin') {
      // Admin sees tasks assigned to ANY admin user
      const adminIds = (await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })).map(u => u.id);
      where = { assigneeId: { in: adminIds } };
    } else {
      where = { assigneeId: userId };
    }

    const tasks = await prisma.opTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks: await attachUsers(tasks) });
  } catch (error) {
    console.error('Op tasks list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: create/assign a task (any staff can assign to another staff).
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;
    if (!session?.user || !STAFF.includes(role || '') || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    const assigneeId = String(body.assigneeId || '').trim();
    if (!title || !assigneeId) {
      return NextResponse.json(
        { error: 'Thiếu tiêu đề hoặc người nhận' },
        { status: 400 },
      );
    }

    const task = await prisma.opTask.create({
      data: {
        title,
        description: body.description ? String(body.description) : null,
        assignerId: userId,
        assigneeId,
        status: 'todo',
        priority: ['low', 'normal', 'high', 'urgent'].includes(body.priority)
          ? body.priority
          : 'normal',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });

    const [withUsers] = await attachUsers([task]);
    return NextResponse.json({ task: withUsers });
  } catch (error) {
    console.error('Op task create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
