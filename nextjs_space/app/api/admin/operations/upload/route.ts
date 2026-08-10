export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { isAllowedUploadType } from '@/lib/operations';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

// Staff-accessible: presigned URL to upload a report/proposal attachment (private).
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, contentType } = await request.json();
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Thiếu tên file hoặc loại file' },
        { status: 400 },
      );
    }
    if (!isAllowedUploadType(String(contentType))) {
      return NextResponse.json(
        { error: 'Định dạng file không được hỗ trợ' },
        { status: 400 },
      );
    }

    // Attachments are private (only accessible via signed download URL).
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      false,
    );

    return NextResponse.json({ uploadUrl, cloud_storage_path });
  } catch (error: any) {
    console.error('Operations upload URL error:', error);
    return NextResponse.json(
      { error: 'Không tạo được đường dẫn tải lên' },
      { status: 500 },
    );
  }
}
