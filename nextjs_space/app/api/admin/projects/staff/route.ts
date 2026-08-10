export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

// List users for the project member picker.
// Default: internal staff users (grouped by department/role).
// ?scope=all&q=<search>: search ANY user in the system by name/email (individual add).
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = req.nextUrl.searchParams.get('scope') || 'staff';
    const q = (req.nextUrl.searchParams.get('q') || '').trim();

    if (scope === 'all') {
      const users = await prisma.user.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
        take: 30,
      });
      return NextResponse.json({ users });
    }

    const users = await prisma.user.findMany({
      where: { role: { in: STAFF } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Projects staff list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
