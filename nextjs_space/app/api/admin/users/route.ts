export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { roleAllowed, ASSIGNABLE_ROLES, Role } from '@/lib/roles';
import bcrypt from 'bcryptjs';

// List all staff/customer accounts (admin only).
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !roleAllowed(role, ['admin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });
    return NextResponse.json({ users });
  } catch (e: any) {
    console.error('[admin/users] list failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

// Create a new staff account (admin only).
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !roleAllowed(role, ['admin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, email, password, role: newRole } = body ?? {};
    if (!email || !password || !newRole) {
      return NextResponse.json({ error: 'Thiếu email, mật khẩu hoặc vai trò' }, { status: 400 });
    }
    if (!ASSIGNABLE_ROLES.includes(newRole as Role)) {
      return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 409 });
    }
    const hashed = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.create({
      data: {
        name: name ? String(name) : null,
        email: String(email).toLowerCase(),
        password: hashed,
        role: newRole,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (e: any) {
    console.error('[admin/users] create failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Không tạo được tài khoản' }, { status: 500 });
  }
}
