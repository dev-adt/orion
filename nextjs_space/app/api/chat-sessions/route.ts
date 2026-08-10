export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Public endpoint: a visitor starts a chat by submitting their profile
// (name, gender, short note). Creates a ChatSession used for customer care.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, gender, note, email, phone } = body ?? {};
    if (!customerName || !String(customerName).trim()) {
      return NextResponse.json({ error: 'Tên khách hàng là bắt buộc' }, { status: 400 });
    }
    let userId: string | null = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) userId = (session.user as any).id ?? null;
    } catch {}

    const created = await prisma.chatSession.create({
      data: {
        customerName: String(customerName).slice(0, 120),
        gender: gender ? String(gender).slice(0, 20) : null,
        note: note ? String(note).slice(0, 2000) : null,
        email: email ? String(email).slice(0, 200) : null,
        phone: phone ? String(phone).slice(0, 40) : null,
        userId,
      },
    });
    return NextResponse.json({ id: created.id });
  } catch (e: any) {
    console.error('[chat-sessions] create failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Không tạo được phiên chat' }, { status: 500 });
  }
}
