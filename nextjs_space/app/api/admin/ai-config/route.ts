export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const config = await prisma.aiConfig.findUnique({ where: { key: 'default' } });
    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('AI config GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const provider = String(body?.provider ?? 'openai');
    const model = String(body?.model ?? 'gpt-4o-mini');
    const systemPrompt = String(body?.systemPrompt ?? '');
    const useWebsiteData = body?.useWebsiteData !== false;

    const config = await prisma.aiConfig.upsert({
      where: { key: 'default' },
      update: { provider, model, systemPrompt, useWebsiteData },
      create: { key: 'default', provider, model, systemPrompt, useWebsiteData },
    });
    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('AI config POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
