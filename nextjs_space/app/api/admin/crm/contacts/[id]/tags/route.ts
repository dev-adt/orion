export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const CRM_ROLES = ['admin', 'sales'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !CRM_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tagId } = await req.json();
    if (!tagId) {
      return NextResponse.json({ error: 'tagId required' }, { status: 400 });
    }

    const ct = await prisma.crmContactTag.create({
      data: { userId: params.id, tagId },
      include: { tag: true },
    });

    return NextResponse.json({ contactTag: ct });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Tag already assigned' }, { status: 409 });
    }
    console.error('CRM assign tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !CRM_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tagId } = await req.json();
    if (!tagId) {
      return NextResponse.json({ error: 'tagId required' }, { status: 400 });
    }

    await prisma.crmContactTag.deleteMany({
      where: { userId: params.id, tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CRM remove tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
