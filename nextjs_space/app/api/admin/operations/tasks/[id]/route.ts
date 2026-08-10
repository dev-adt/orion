export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

// PATCH: update task. Assignee can change status; assigner/admin can edit details.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;
    if (!session?.user || !STAFF.includes(role || '') || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.opTask.findUnique({ where: { id: params.id } });
    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy công việc' }, { status: 404 });
    }

    const isOwner = task.assignerId === userId;
    const isAssignee = task.assigneeId === userId;
    const isAdmin = role === 'admin';
    if (!isOwner && !isAssignee && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data: any = {};

    if ('status' in body && ['todo', 'in_progress', 'done'].includes(body.status)) {
      data.status = body.status;
    }
    // Only owner/admin can edit the core details.
    if (isOwner || isAdmin) {
      if (typeof body.title === 'string') data.title = body.title.trim();
      if ('description' in body) data.description = body.description || null;
      if ('priority' in body && ['low', 'normal', 'high', 'urgent'].includes(body.priority))
        data.priority = body.priority;
      if ('dueDate' in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if ('assigneeId' in body && body.assigneeId) data.assigneeId = body.assigneeId;
    }

    const updated = await prisma.opTask.update({ where: { id: params.id }, data });
    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error('Op task update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: owner or admin can delete a task.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;
    if (!session?.user || !STAFF.includes(role || '') || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.opTask.findUnique({ where: { id: params.id } });
    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy công việc' }, { status: 404 });
    }
    if (task.assignerId !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.opTask.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Op task delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
