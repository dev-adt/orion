export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Admin-only: generate SEO product content (VI + EN) with AI.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin','marketing'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productName, category, keywords } = await request.json();
    if (!productName) {
      return NextResponse.json(
        { error: 'Missing productName' },
        { status: 400 },
      );
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 },
      );
    }

    const prompt = `Bạn là chuyên gia content marketing và SEO cho sàn thương mại điện tử.
Hãy viết nội dung bán hàng chuẩn SEO cho sản phẩm sau:
- Tên sản phẩm: "${productName}"
${category ? `- Danh mục: ${category}` : ''}
${keywords ? `- Từ khóa mong muốn: ${keywords}` : ''}

Yêu cầu:
1. nameEn: tên sản phẩm dịch/viết bằng tiếng Anh, ngắn gọn.
2. description: mô tả bán hàng tiếng Việt, 3-5 câu, hấp dẫn, có chèn từ khóa tự nhiên, nhấn mạnh lợi ích.
3. descriptionEn: bản dịch tiếng Anh của description.
4. metaTitle: tiêu đề SEO (dưới 60 ký tự) tiếng Việt.
5. metaDescription: meta description SEO (dưới 160 ký tự) tiếng Việt.
6. specs: object các thông số kỹ thuật gợi ý (key tiếng Việt: value), 3-6 thông số phù hợp.

Trả về đúng JSON theo cấu trúc:
{
  "nameEn": "...",
  "description": "...",
  "descriptionEn": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "specs": { "Thông số 1": "giá trị", "Thông số 2": "giá trị" }
}
Chỉ trả về JSON thuần, không kèm markdown hay code block.`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('SEO AI error:', errText);
      return NextResponse.json(
        { error: 'AI generation failed' },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    return NextResponse.json({ result: parsed });
  } catch (error: any) {
    console.error('SEO generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SEO content' },
      { status: 500 },
    );
  }
}
