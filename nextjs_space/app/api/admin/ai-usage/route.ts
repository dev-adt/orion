export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Admin-only: aggregated AI Router usage + cost-savings summary.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.aiUsageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    let totalCost = 0;
    let totalBaseline = 0;
    let fallbacks = 0;
    let todayRequests = 0;
    let todayCost = 0;
    const byModel: Record<string, { count: number; cost: number }> = {};
    const byComplexity: Record<string, number> = {};

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    for (const l of logs) {
      totalCost += l.estimatedCost;
      totalBaseline += l.baselineCost;
      if (l.fallbackUsed) fallbacks++;
      if (!byModel[l.modelId]) byModel[l.modelId] = { count: 0, cost: 0 };
      byModel[l.modelId].count++;
      byModel[l.modelId].cost += l.estimatedCost;
      byComplexity[l.complexity] = (byComplexity[l.complexity] || 0) + 1;
      if (l.createdAt >= startOfToday) {
        todayRequests++;
        todayCost += l.estimatedCost;
      }
    }

    const savingsPct = totalBaseline > 0 ? (1 - totalCost / totalBaseline) * 100 : 0;

    return NextResponse.json({
      totalRequests: logs.length,
      totalCost,
      totalBaseline,
      savedAmount: totalBaseline - totalCost,
      savingsPct,
      fallbacks,
      byModel,
      byComplexity,
      todayRequests,
      todayCost,
    });
  } catch (e: any) {
    console.error('ai-usage GET error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
