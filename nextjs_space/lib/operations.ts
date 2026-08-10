import { prisma } from '@/lib/prisma';

// Kiểu file đính kèm lưu trong trường attachments (JSON).
export interface OpAttachment {
  name: string;
  path: string;   // cloud_storage_path (private)
  type: string;   // contentType
  size: number;
}

export function parseAttachments(raw?: string | null): OpAttachment[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((a) => a && typeof a.path === 'string')
      .map((a) => ({
        name: String(a.name || 'file'),
        path: String(a.path),
        type: String(a.type || 'application/octet-stream'),
        size: Number(a.size || 0),
      }));
  } catch {
    return [];
  }
}

// Kiểm tra 1 người dùng có quyền dùng AI tóm tắt báo cáo hay không.
// Admin luôn được phép; hoặc vị trí của người đó được bật canUseAiSummary.
export async function canUserSummarize(userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return true;
  const pos = await prisma.orgPosition.findFirst({
    where: { userId, canUseAiSummary: true },
    select: { id: true },
  });
  return !!pos;
}

export const OP_ALLOWED_UPLOAD_TYPES = [
  'image/',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
];

export function isAllowedUploadType(contentType: string): boolean {
  return OP_ALLOWED_UPLOAD_TYPES.some((t) =>
    t.endsWith('/') ? contentType.startsWith(t) : contentType === t,
  );
}

// ---------------------------------------------------------------------------
// AI summarization of a report/proposal, including attachment contents.
// Fetches private attachments from S3, base64-encodes images & PDFs and sends
// them to the LLM. Other file types are referenced by name only.
// ---------------------------------------------------------------------------
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client, getBucketConfig } from './aws-config';

async function fetchFileBuffer(path: string): Promise<Buffer | null> {
  try {
    const s3 = createS3Client();
    const { bucketName } = getBucketConfig();
    const res = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: path }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) return null;
    return Buffer.from(bytes);
  } catch (e) {
    console.error('fetchFileBuffer error for', path, e);
    return null;
  }
}

// Trích xuất nội dung text từ các định dạng Office/văn bản.
async function extractTextFromFile(att: OpAttachment): Promise<string | null> {
  const name = (att.name || '').toLowerCase();
  const type = att.type || '';
  const isDocx =
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx');
  const isXlsx =
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.ms-excel' ||
    name.endsWith('.xlsx') || name.endsWith('.xls');
  const isText =
    type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.csv');
  if (!isDocx && !isXlsx && !isText) return null;

  const buf = await fetchFileBuffer(att.path);
  if (!buf) return null;

  try {
    if (isDocx) {
      const mammoth = await import('mammoth');
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return (value || '').trim() || null;
    }
    if (isXlsx) {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buf, { type: 'buffer' });
      const parts: string[] = [];
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(ws);
        if (csv.trim()) parts.push(`# Sheet: ${sheetName}\n${csv}`);
      }
      const out = parts.join('\n\n').trim();
      return out || null;
    }
    // text / csv
    return buf.toString('utf-8').trim() || null;
  } catch (e) {
    console.error('extractTextFromFile error for', att.path, e);
    return null;
  }
}

export async function summarizeReport(params: {
  title: string;
  content: string;
  attachments: OpAttachment[];
  kind?: 'report' | 'proposal';
}): Promise<string> {
  const { title, content, attachments, kind = 'report' } = params;

  const label = kind === 'proposal' ? 'đề xuất' : 'báo cáo';

  // Build the multimodal user content.
  const userContent: any[] = [
    {
      type: 'text',
      text:
        `Bạn là trợ lý điều hành. Hãy tóm tắt ngắn gọn, rõ ràng bằng tiếng Việt nội dung ${label} dưới đây ` +
        `để lãnh đạo nắm nhanh: các ý chính, kết quả/đề nghị, vấn đề cần chú ý và việc cần quyết định (nếu có). ` +
        `Nếu có file đính kèm, hãy đọc và tổng hợp cả nội dung file.\n\n` +
        `Tiêu đề: ${title}\n\nNội dung:\n${content || '(không có)'}`,
    },
  ];

  const noteLines: string[] = [];
  for (const att of attachments) {
    const isImage = att.type.startsWith('image/');
    const isPdf = att.type === 'application/pdf';
    if (isImage || isPdf) {
      const buf = await fetchFileBuffer(att.path);
      if (buf) {
        const b64 = buf.toString('base64');
        if (isImage) {
          userContent.push({
            type: 'image_url',
            image_url: { url: `data:${att.type};base64,${b64}` },
          });
        } else {
          userContent.push({
            type: 'file',
            file: {
              filename: att.name,
              file_data: `data:application/pdf;base64,${b64}`,
            },
          });
        }
        continue;
      }
      noteLines.push(`- ${att.name} (${att.type || 'không rõ định dạng'})`);
      continue;
    }

    // Word / Excel / text: trích xuất nội dung text rồi đưa vào prompt.
    const extracted = await extractTextFromFile(att);
    if (extracted) {
      const clipped = extracted.length > 20000 ? extracted.slice(0, 20000) + '\n...(đã cắt bớt)' : extracted;
      userContent.push({
        type: 'text',
        text: `--- Nội dung file đính kèm: ${att.name} ---\n${clipped}\n--- Hết file ${att.name} ---`,
      });
      continue;
    }
    noteLines.push(`- ${att.name} (${att.type || 'không rõ định dạng'})`);
  }

  if (noteLines.length) {
    userContent.push({
      type: 'text',
      text:
        `Ngoài ra còn có các file đính kèm không thể đọc trực tiếp (chỉ liệt kê theo tên):\n` +
        noteLines.join('\n'),
    });
  }

  const resp = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      messages: [{ role: 'user', content: userContent }],
      max_tokens: 1200,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error('summarizeReport LLM error:', resp.status, t);
    throw new Error('AI summarize failed');
  }

  const data = await resp.json();
  const summary = data?.choices?.[0]?.message?.content;
  return typeof summary === 'string' ? summary.trim() : String(summary || '');
}
