export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EmbedAgentClient } from './_components/embed-agent-client';

export default async function EmbedAgentPage({ params }: { params: { id: string } }) {
  const agent = await prisma.aiAgent.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      nameEn: true,
      description: true,
      icon: true,
      active: true,
      embeddable: true,
      suggestedPrompts: true,
    },
  });
  if (!agent || !agent.active || !agent.embeddable) return notFound();

  const prompts = (agent.suggestedPrompts ?? '').split('\n').map((s) => s.trim()).filter(Boolean);

  return (
    <EmbedAgentClient agent={{
      id: agent.id,
      name: agent.name,
      nameEn: agent.nameEn,
      description: agent.description,
      icon: agent.icon,
      suggestedPrompts: prompts,
    }} />
  );
}
