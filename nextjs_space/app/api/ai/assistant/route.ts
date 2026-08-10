export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public: returns the assistant "brain" config the chatbot needs (no secrets, no knowledge content).
export async function GET() {
  try {
    const config = await prisma.aiConfig.findUnique({ where: { key: 'default' } });
    const knowledgeCount = await prisma.knowledgeDoc.count();
    return NextResponse.json({
      config: config
        ? {
            provider: config.provider,
            model: config.model,
            systemPrompt: config.systemPrompt,
            useWebsiteData: config.useWebsiteData,
            knowledgeCount,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Assistant config GET error:', error);
    return NextResponse.json({ config: null });
  }
}
