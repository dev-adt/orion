export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const CRM_ROLES = ['admin', 'sales'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !CRM_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const tagId = searchParams.get('tagId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause: customers = role customer OR has orders
    const where: any = {
      role: 'customer',
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
      delete where.role;
      // Keep customer filter inside OR
      where.AND = [
        { role: 'customer' },
        { OR: where.OR },
      ];
      delete where.OR;
    }

    // If filtering by tag, get userIds first
    let tagUserIds: string[] | null = null;
    if (tagId) {
      const contactTags = await prisma.crmContactTag.findMany({
        where: { tagId },
        select: { userId: true },
      });
      tagUserIds = contactTags.map(ct => ct.userId);
      if (where.AND) {
        where.AND.push({ id: { in: tagUserIds } });
      } else {
        where.id = { in: tagUserIds };
      }
    }

    const [contacts, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          createdAt: true,
          orders: {
            select: { id: true, total: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Get tags for these contacts
    const contactIds = contacts.map(c => c.id);
    const contactTags = await prisma.crmContactTag.findMany({
      where: { userId: { in: contactIds } },
      include: { tag: true },
    });

    const tagMap: Record<string, { id: string; name: string; color: string }[]> = {};
    contactTags.forEach(ct => {
      if (!tagMap[ct.userId]) tagMap[ct.userId] = [];
      tagMap[ct.userId].push({ id: ct.tag.id, name: ct.tag.name, color: ct.tag.color });
    });

    const enriched = contacts.map(c => {
      const orderCount = c.orders.length;
      const totalRevenue = c.orders.reduce((sum, o) => sum + o.total, 0);
      const lastOrder = c.orders[0] || null;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        createdAt: c.createdAt,
        orderCount,
        totalRevenue,
        lastOrderDate: lastOrder?.createdAt || null,
        tags: tagMap[c.id] || [],
      };
    });

    return NextResponse.json({ contacts: enriched, total, page, limit });
  } catch (error) {
    console.error('CRM contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
