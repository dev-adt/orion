export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; docId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.aiAgentDoc.delete({ where: { id: params.docId } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Agent doc DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
