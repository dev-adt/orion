import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { AdminClient } from './_components/admin-client';
import { canAccessAdmin, type Role } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as Role | undefined;
  if (!session?.user || !canAccessAdmin(role)) {
    redirect('/auth');
  }
  return <AdminClient role={role as Role} userId={(session.user as any)?.id ?? ''} />;
}
