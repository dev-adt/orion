export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { parseAttachments, OpAttachment } from '@/lib/operations';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

async function attachUsers(reports: any[]) {
  const ids = Array.from(
    new Set(
      reports.flatMap((r) => [r.authorId, r.toUserId]).filter(Boolean),
    ),
  ) as string[];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const map = new Map(users.map((u) => [u.id, u]));
  return reports.map((r) => ({
    ...r,
    author: map.get(r.authorId) || null,
    toUser: r.toUserId ? map.get(r.toUserId) || null : null,
    attachmentsList: parseAttachments(r.attachments),
  }));
}

// GET: ?box=sent (I authored) | received (sent to me). Admin ?box=all.
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
    if (box === 'sent') {
      where = { authorId: userId };
    } else if (box === 'all' && role === 'admin') {
      where = {};
    } else if (box === 'received' && role === 'admin') {
      // Admin sees reports sent to ANY admin user
      const adminIds = (await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })).map(u => u.id);
      where = { toUserId: { in: adminIds } };
    } else {
      where = { toUserId: userId };
    }

    const reports = await prisma.opReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports: await attachUsers(reports) });
  } catch (error) {
    console.error('Op reports list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: create a work report (typed content + attachments), optionally sent to a superior.
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
    const content = String(body.content || '').trim();
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Thiếu tiêu đề hoặc nội dung' },
        { status: 400 },
      );
    }

    const attachments: OpAttachment[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    const report = await prisma.opReport.create({
      data: {
        authorId: userId,
        toUserId: body.toUserId || null,
        taskId: body.taskId || null,
        title,
        content,
        attachments: attachments.length ? JSON.stringify(attachments) : null,
      },
    });

    const [withUsers] = await attachUsers([report]);
    return NextResponse.json({ report: withUsers });
  } catch (error) {
    console.error('Op report create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
