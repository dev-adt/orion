import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { canUseAiTools, type Role } from '@/lib/roles';
import { AgentsClient } from './_components/agents-client';

export const dynamic = 'force-dynamic';

export default async function AiToolsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as Role | undefined;
  if (!session?.user || !canUseAiTools(role)) {
    redirect('/auth');
  }
  return <AgentsClient role={role as Role} />;
}
