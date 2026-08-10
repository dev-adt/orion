import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RestrictedNotice({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Nội dung giới hạn</h1>
        {loggedIn ? (
          <p className="text-sm text-muted-foreground mb-6">
            Tài khoản của bạn không có quyền xem nội dung này. Vui lòng liên hệ quản trị viên nếu bạn cần truy cập.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-6">
            Nội dung này chỉ dành cho người dùng đã đăng nhập đúng vai trò. Vui lòng đăng nhập để tiếp tục.
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          {!loggedIn && (
            <Button asChild>
              <Link href="/auth">Đăng nhập</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
