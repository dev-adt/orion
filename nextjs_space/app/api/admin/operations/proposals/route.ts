export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { parseAttachments, OpAttachment } from '@/lib/operations';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

async function attachUsers(items: any[]) {
  const ids = Array.from(
    new Set(items.flatMap((r) => [r.proposerId, r.approverId]).filter(Boolean)),
  ) as string[];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const map = new Map(users.map((u) => [u.id, u]));
  return items.map((r) => ({
    ...r,
    proposer: map.get(r.proposerId) || null,
    approver: map.get(r.approverId) || null,
    attachmentsList: parseAttachments(r.attachments),
  }));
}

// GET: ?box=sent (I proposed) | received (I approve). Admin ?box=all.
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
      where = { proposerId: userId };
    } else if (box === 'all' && role === 'admin') {
      where = {};
    } else if (box === 'received' && role === 'admin') {
      // Admin sees proposals sent to ANY admin user
      const adminIds = (await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })).map(u => u.id);
      where = { approverId: { in: adminIds } };
    } else {
      where = { approverId: userId };
    }

    const proposals = await prisma.opProposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ proposals: await attachUsers(proposals) });
  } catch (error) {
    console.error('Op proposals list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: submit a proposal for approval by a chosen approver.
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
    const approverId = String(body.approverId || '').trim();
    if (!title || !content || !approverId) {
      return NextResponse.json(
        { error: 'Thiếu tiêu đề, nội dung hoặc người phê duyệt' },
        { status: 400 },
      );
    }

    const attachments: OpAttachment[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    const proposal = await prisma.opProposal.create({
      data: {
        proposerId: userId,
        approverId,
        title,
        content,
        attachments: attachments.length ? JSON.stringify(attachments) : null,
        status: 'pending',
      },
    });

    const [withUsers] = await attachUsers([proposal]);
    return NextResponse.json({ proposal: withUsers });
  } catch (error) {
    console.error('Op proposal create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
