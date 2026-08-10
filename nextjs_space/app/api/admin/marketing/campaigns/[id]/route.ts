export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const ALLOWED = ['admin', 'marketing'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !ALLOWED.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data: any = {};
    if (typeof body.name === 'string') data.name = body.name.trim();
    if (typeof body.channel === 'string') data.channel = body.channel;
    if ('objective' in body) data.objective = body.objective?.trim() || null;
    if (body.budget !== undefined) data.budget = typeof body.budget === 'number' ? body.budget : parseFloat(body.budget) || 0;
    if (typeof body.status === 'string') data.status = body.status;
    if ('startDate' in body) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if ('endDate' in body) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.reach !== undefined) data.reach = parseInt(body.reach) || 0;
    if (body.clicks !== undefined) data.clicks = parseInt(body.clicks) || 0;
    if (body.conversions !== undefined) data.conversions = parseInt(body.conversions) || 0;
    if (body.revenue !== undefined) data.revenue = typeof body.revenue === 'number' ? body.revenue : parseFloat(body.revenue) || 0;

    const campaign = await prisma.campaign.update({ where: { id: params.id }, data });
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Campaign update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !ALLOWED.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.campaign.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Campaign delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
