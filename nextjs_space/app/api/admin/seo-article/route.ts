export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, keywords } = await request.json();
    if (!topic) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const prompt = `Bạn là chuyên gia viết bài SEO cho website thương mại điện tử.
Viết bài viết hoàn chỉnh về chủ đề sau:
- Chủ đề: "${topic}"
${keywords ? `- Từ khóa SEO: ${keywords}` : ''}

Yêu cầu:
1. title: tiêu đề bài viết tiếng Việt, hấp dẫn, chuẩn SEO (dưới 70 ký tự).
2. titleEn: tiêu đề dịch tiếng Anh.
3. excerpt: tóm tắt ngắn tiếng Việt (1-2 câu, dưới 200 ký tự).
4. excerptEn: tóm tắt tiếng Anh.
5. content: nội dung bài viết tiếng Việt, 4-8 đoạn, sử dụng HTML đơn giản (<h2>, <h3>, <p>, <ul>, <li>, <strong>). Viết hấp dẫn, nhiều thông tin hữu ích, chèn từ khóa tự nhiên.
6. contentEn: bản dịch tiếng Anh của content.
7. metaTitle: tiêu đề SEO (dưới 60 ký tự) tiếng Việt.
8. metaDescription: meta description (dưới 160 ký tự) tiếng Việt.

Trả về đúng JSON:
{
  "title": "...",
  "titleEn": "...",
  "excerpt": "...",
  "excerptEn": "...",
  "content": "...",
  "contentEn": "...",
  "metaTitle": "...",
  "metaDescription": "..."
}
Chỉ trả về JSON thuần, không markdown.`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Article AI error:', errText);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    return NextResponse.json({ result: parsed });
  } catch (error: any) {
    console.error('Article generate error:', error);
    return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
  }
}
