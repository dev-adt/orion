export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: { orderBy: { createdAt: 'asc' } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Resolve user names for owner, members, update authors
    const userIds = [...new Set([
      project.ownerId,
      ...project.members.map(m => m.userId),
      ...project.updates.map(u => u.authorId),
    ])];
    const users = userIds.length
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, role: true } })
      : [];
    const userMap: Record<string, { name: string; email: string; role: string }> = {};
    users.forEach(u => { userMap[u.id] = { name: u.name || u.email, email: u.email, role: u.role }; });

    return NextResponse.json({
      project: {
        ...project,
        ownerName: userMap[project.ownerId]?.name || 'Unknown',
        members: project.members.map(m => ({
          ...m,
          name: userMap[m.userId]?.name || 'Unknown',
          email: userMap[m.userId]?.email || '',
          userRole: userMap[m.userId]?.role || '',
        })),
        updates: project.updates.map(u => ({
          ...u,
          authorName: userMap[u.authorId]?.name || 'Unknown',
        })),
      },
    });
  } catch (error) {
    console.error('Project detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.progress !== undefined) data.progress = Math.max(0, Math.min(100, parseInt(body.progress) || 0));
    if (body.expectedRevenue !== undefined) data.expectedRevenue = parseFloat(body.expectedRevenue) || 0;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === 'completed') {
        data.completedAt = new Date();
        data.progress = 100;
      } else {
        data.completedAt = null;
      }
    }

    const project = await prisma.project.update({ where: { id: params.id }, data });
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Only owner or admin may delete
    const project = await prisma.project.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (role !== 'admin' && project.ownerId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await prisma.project.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
