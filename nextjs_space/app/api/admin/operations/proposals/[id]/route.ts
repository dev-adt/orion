export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import {
  parseAttachments,
  canUserSummarize,
  summarizeReport,
} from '@/lib/operations';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

// PATCH: action=decision (approve/reject by approver/admin) | action=summarize (AI).
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

    const proposal = await prisma.opProposal.findUnique({
      where: { id: params.id },
    });
    if (!proposal) {
      return NextResponse.json({ error: 'Không tìm thấy đề xuất' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'decision';

    if (action === 'summarize') {
      const allowed = await canUserSummarize(userId, role || '');
      if (!allowed) {
        return NextResponse.json(
          { error: 'Bạn không có quyền sử dụng AI tóm tắt' },
          { status: 403 },
        );
      }
      const summary = await summarizeReport({
        title: proposal.title,
        content: proposal.content,
        attachments: parseAttachments(proposal.attachments),
        kind: 'proposal',
      });
      const updated = await prisma.opProposal.update({
        where: { id: params.id },
        data: { aiSummary: summary },
      });
      return NextResponse.json({ proposal: updated });
    }

    if (action === 'decision') {
      // Only the designated approver or an admin can decide.
      if (proposal.approverId !== userId && role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const decision = body.decision;
      if (!['approved', 'rejected'].includes(decision)) {
        return NextResponse.json({ error: 'Quyết định không hợp lệ' }, { status: 400 });
      }
      const updated = await prisma.opProposal.update({
        where: { id: params.id },
        data: {
          status: decision,
          decisionNote: body.decisionNote ? String(body.decisionNote) : null,
          decidedAt: new Date(),
        },
      });
      return NextResponse.json({ proposal: updated });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Op proposal patch error:', error);
    return NextResponse.json(
      { error: 'Không thể xử lý đề xuất' },
      { status: 500 },
    );
  }
}

// DELETE: proposer or admin can delete (only if still pending, unless admin).
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
    const proposal = await prisma.opProposal.findUnique({
      where: { id: params.id },
    });
    if (!proposal) {
      return NextResponse.json({ error: 'Không tìm thấy đề xuất' }, { status: 404 });
    }
    if (proposal.proposerId !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.opProposal.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Op proposal delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
