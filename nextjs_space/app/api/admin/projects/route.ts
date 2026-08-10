export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const where: any = {};
    if (status) where.status = status;

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        members: { select: { userId: true } },
        _count: { select: { updates: true, members: true } },
      },
    });

    // Resolve owner names
    const ownerIds = [...new Set(projects.map(p => p.ownerId))];
    const owners = ownerIds.length
      ? await prisma.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true, email: true } })
      : [];
    const ownerMap: Record<string, string> = {};
    owners.forEach(o => { ownerMap[o.id] = o.name || o.email; });

    const list = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      ownerId: p.ownerId,
      ownerName: ownerMap[p.ownerId] || 'Unknown',
      progress: p.progress,
      expectedRevenue: p.expectedRevenue,
      status: p.status,
      startDate: p.startDate,
      dueDate: p.dueDate,
      completedAt: p.completedAt,
      createdAt: p.createdAt,
      memberCount: p._count.members,
      updateCount: p._count.updates,
    }));

    return NextResponse.json({ projects: list });
  } catch (error) {
    console.error('Projects GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, expectedRevenue, dueDate, memberIds } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const ownerId = (session.user as any).id;
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId,
        expectedRevenue: typeof expectedRevenue === 'number' ? expectedRevenue : parseFloat(expectedRevenue) || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Owner is always a member (lead); plus any selected members
    const memberSet = new Set<string>([ownerId, ...(Array.isArray(memberIds) ? memberIds : [])]);
    await prisma.projectMember.createMany({
      data: [...memberSet].map(uid => ({
        projectId: project.id,
        userId: uid,
        role: uid === ownerId ? 'lead' : 'member',
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Project create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
