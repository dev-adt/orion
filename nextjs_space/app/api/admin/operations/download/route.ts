export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getFileUrl } from '@/lib/s3';

const STAFF = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

// Staff-accessible: return a short-lived signed URL for a private attachment.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || !STAFF.includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const path = request.nextUrl.searchParams.get('path') || '';
    const type =
      request.nextUrl.searchParams.get('type') || 'application/octet-stream';
    if (!path) {
      return NextResponse.json({ error: 'Thiếu đường dẫn file' }, { status: 400 });
    }

    const url = await getFileUrl(path, type, false);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Operations download URL error:', error);
    return NextResponse.json(
      { error: 'Không tạo được đường dẫn tải xuống' },
      { status: 500 },
    );
  }
}
