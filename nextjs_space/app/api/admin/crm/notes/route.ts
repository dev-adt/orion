export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const CRM_ROLES = ['admin', 'sales'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !CRM_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, content } = await req.json();
    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: 'userId and content required' }, { status: 400 });
    }

    const note = await prisma.crmNote.create({
      data: {
        userId,
        authorId: (session.user as any).id,
        content: content.trim(),
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('CRM note create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
