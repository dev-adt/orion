export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const CRM_ROLES = ['admin', 'sales'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !CRM_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const assignedTo = searchParams.get('assignedTo') || '';

    const where: any = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    const tasks = await prisma.crmTask.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    // Enrich with user and assignee names
    const userIds = [...new Set([...tasks.map(t => t.userId).filter(Boolean), ...tasks.map(t => t.assignedTo).filter(Boolean)])] as string[];
    const users = userIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
      : [];
    const userMap: Record<string, string> = {};
    users.forEach(u => { userMap[u.id] = u.name || u.email; });

    const enriched = tasks.map(t => ({
      ...t,
      userName: t.userId ? userMap[t.userId] || null : null,
      assigneeName: t.assignedTo ? userMap[t.assignedTo] || null : null,
    }));

    return NextResponse.json({ tasks: enriched });
  } catch (error) {
    console.error('CRM tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !CRM_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, description, priority, dueDate, assignedTo } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }

    const task = await prisma.crmTask.create({
      data: {
        userId: userId || null,
        assignedTo: assignedTo || (session.user as any).id,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'normal',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('CRM task create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
