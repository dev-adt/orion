export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const CRM_ROLES = ['admin', 'sales'];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !CRM_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            items: { select: { quantity: true, price: true, product: { select: { name: true } } } },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, rating: true, comment: true, createdAt: true, product: { select: { name: true } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get notes
    const notes = await prisma.crmNote.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    // Get note author names
    const authorIds = [...new Set(notes.map(n => n.authorId))];
    const authors = authorIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, email: true } })
      : [];
    const authorMap: Record<string, string> = {};
    authors.forEach(a => { authorMap[a.id] = a.name || a.email; });

    const notesWithAuthor = notes.map(n => ({
      ...n,
      authorName: authorMap[n.authorId] || 'Unknown',
    }));

    // Get tags
    const contactTags = await prisma.crmContactTag.findMany({
      where: { userId: params.id },
      include: { tag: true },
    });

    // Get tasks
    const tasks = await prisma.crmTask.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    // Get chat sessions count
    let chatCount = 0;
    try {
      chatCount = await prisma.chatSession.count({ where: { userId: params.id } });
    } catch { /* ChatSession may not exist */ }

    return NextResponse.json({
      contact: {
        ...user,
        orderCount: user.orders.length,
        totalRevenue: user.orders.reduce((s, o) => s + o.total, 0),
        notes: notesWithAuthor,
        tags: contactTags.map(ct => ({ id: ct.tag.id, name: ct.tag.name, color: ct.tag.color })),
        tasks,
        chatCount,
      },
    });
  } catch (error) {
    console.error('CRM contact detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
