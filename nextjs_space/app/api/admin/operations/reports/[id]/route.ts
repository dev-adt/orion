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

// PATCH: action=summarize -> generate an AI summary (gated by AI permission).
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

    const report = await prisma.opReport.findUnique({ where: { id: params.id } });
    if (!report) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'summarize';

    if (action === 'summarize') {
      const allowed = await canUserSummarize(userId, role || '');
      if (!allowed) {
        return NextResponse.json(
          { error: 'Bạn không có quyền sử dụng AI tóm tắt' },
          { status: 403 },
        );
      }

      const summary = await summarizeReport({
        title: report.title,
        content: report.content,
        attachments: parseAttachments(report.attachments),
        kind: 'report',
      });

      const updated = await prisma.opReport.update({
        where: { id: params.id },
        data: { aiSummary: summary },
      });
      return NextResponse.json({ report: updated });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Op report patch error:', error);
    return NextResponse.json(
      { error: 'Không thể xử lý báo cáo' },
      { status: 500 },
    );
  }
}

// DELETE: author or admin can delete.
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
    const report = await prisma.opReport.findUnique({ where: { id: params.id } });
    if (!report) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 });
    }
    if (report.authorId !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.opReport.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Op report delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
