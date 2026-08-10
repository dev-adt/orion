export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const CRM_ROLES = ['admin', 'sales'];

// Public: submit a contact-form lead.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body?.name || '').toString().trim().slice(0, 200) || null;
    const email = (body?.email || '').toString().trim().slice(0, 200) || null;
    const phone = (body?.phone || '').toString().trim().slice(0, 60) || null;
    const company = (body?.company || '').toString().trim().slice(0, 200) || null;
    const message = (body?.message || '').toString().trim().slice(0, 5000) || null;
    const source = (body?.source || '').toString().trim().slice(0, 200) || null;
    const sourceUrl = (body?.sourceUrl || '').toString().trim().slice(0, 300) || null;
    const data = body?.data && typeof body.data === 'object' ? body.data : {};

    if (!name && !email && !phone && Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Empty submission' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: { name, email, phone, company, message, source, sourceUrl, data, status: 'new' },
    });

    // Fire-and-forget admin email notification (never blocks the response on failure).
    try {
      const appUrl = process.env.NEXTAUTH_URL || '';
      const hostname = appUrl ? new URL(appUrl).hostname : 'orion.abacusai.app';
      const appName = hostname.split('.')[0] || 'Orion';
      const rows = Object.entries(data as Record<string, string>)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 10px;border:1px solid #eee;font-weight:600;background:#fafafa;">${k}</td><td style="padding:6px 10px;border:1px solid #eee;">${v}</td></tr>`,
        )
        .join('');
      const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#CC1010;border-bottom:2px solid #CC1010;padding-bottom:10px;">Thông tin liên hệ mới</h2>
          <p style="color:#555;">Nguồn: <strong>${source || sourceUrl || 'Website'}</strong></p>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>
          <p style="color:#888;font-size:12px;margin-top:16px;">Gửi lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
        </div>`;
      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_BIU_MU_LIN_H_LEAD,
          subject: `Liên hệ mới từ ${name || email || phone || 'khách hàng'}`,
          body: htmlBody,
          is_html: true,
          recipient_email: process.env.LEAD_NOTIFY_EMAIL || 'lekhachiep@gmail.com',
          reply_to: email || undefined,
          sender_email: `noreply@${hostname}`,
          sender_alias: appName,
        }),
      });
    } catch (e) {
      console.error('Lead email notification failed:', e);
    }

    return NextResponse.json({ success: true, id: lead.id });
  } catch (error) {
    console.error('Lead create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin/Sales: list leads.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !CRM_ROLES.includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total, newCount] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { status: 'new' } }),
    ]);

    return NextResponse.json({ leads, total, page, limit, newCount });
  } catch (error) {
    console.error('Lead list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
