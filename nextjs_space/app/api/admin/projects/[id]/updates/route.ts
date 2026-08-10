export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, progress } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const authorId = (session.user as any).id;
    const hasProgress = progress !== undefined && progress !== null && progress !== '';
    const progressVal = hasProgress ? Math.max(0, Math.min(100, parseInt(progress) || 0)) : null;

    const update = await prisma.projectUpdate.create({
      data: {
        projectId: params.id,
        authorId,
        content: content.trim(),
        progress: progressVal,
      },
    });

    // If a progress value was supplied, reflect it on the project
    if (progressVal !== null) {
      await prisma.project.update({
        where: { id: params.id },
        data: { progress: progressVal },
      });
    }

    return NextResponse.json({ update });
  } catch (error) {
    console.error('Project update post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
