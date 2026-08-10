export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { roleAllowed, ASSIGNABLE_ROLES, Role } from '@/lib/roles';
import bcrypt from 'bcryptjs';

// Update a user's role or reset their password (admin only).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !roleAllowed(role, ['admin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const data: any = {};
    if (body?.role) {
      if (!ASSIGNABLE_ROLES.includes(body.role as Role)) {
        return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
      }
      data.role = body.role;
    }
    if (body?.password) {
      data.password = await bcrypt.hash(String(body.password), 12);
    }
    if (typeof body?.name === 'string') data.name = body.name;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Không có thay đổi' }, { status: 400 });
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (e: any) {
    console.error('[admin/users] patch failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Không cập nhật được' }, { status: 500 });
  }
}

// Delete a user (admin only). Cannot delete yourself.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !roleAllowed(role, ['admin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if ((session.user as any).id === params.id) {
      return NextResponse.json({ error: 'Không thể xóa chính mình' }, { status: 400 });
    }
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[admin/users] delete failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Không xóa được' }, { status: 500 });
  }
}
