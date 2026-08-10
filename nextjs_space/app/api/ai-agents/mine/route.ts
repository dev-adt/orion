export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await prisma.aiAgent.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { docs: true } } },
    });

    // Admin sees all agents; staff sees only agents whose roles include their role.
    const mine = role === 'admin'
      ? agents
      : agents.filter((a) => {
          const rs = (a.roles ?? '').split(',').map((r) => r.trim());
          return rs.includes(role) || rs.includes('other');
        });

    const list = mine.map((a) => ({
      id: a.id,
      name: a.name,
      nameEn: a.nameEn,
      description: a.description,
      descriptionEn: a.descriptionEn,
      icon: a.icon,
      model: a.model,
      roles: (a.roles ?? '').split(',').map((r) => r.trim()).filter(Boolean),
      suggestedPrompts: (a.suggestedPrompts ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
      docCount: a._count.docs,
    }));
    return NextResponse.json({ agents: list });
  } catch (error: any) {
    console.error('AI agents mine GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
