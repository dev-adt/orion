'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SETTING_KEYS = [
  { key: 'hero_title', label: 'Tiêu đề banner chính (Việt)', placeholder: 'Mua sắm thông minh với' },
  { key: 'hero_title_highlight', label: 'Từ nhấn mạnh (Việt)', placeholder: 'AI Assistant' },
  { key: 'hero_subtitle', label: 'Mô tả banner (Việt)', placeholder: 'Khám phá hàng ngàn sản phẩm...' },
  { key: 'hero_title_en', label: 'Banner title (English)', placeholder: 'Smart Shopping with' },
  { key: 'hero_title_highlight_en', label: 'Highlight (English)', placeholder: 'AI Assistant' },
  { key: 'hero_subtitle_en', label: 'Banner subtitle (English)', placeholder: 'Discover thousands of quality products...' },
  { key: 'promo_title', label: 'Tiêu đề khuyến mãi (Việt)', placeholder: 'Deal hot hôm nay' },
  { key: 'promo_subtitle', label: 'Mô tả khuyến mãi (Việt)', placeholder: 'Ưu đãi có hạn, mua ngay!' },
  { key: 'promo_title_en', label: 'Promo title (English)', placeholder: "Today's Hot Deals" },
  { key: 'promo_subtitle_en', label: 'Promo subtitle (English)', placeholder: 'Limited offers, buy now!' },
];

export function HomepageEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setValues(d?.settings ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      if (!res.ok) throw new Error();
      toast.success('Đã lưu cài đặt trang chủ');
    } catch {
      toast.error('Lỗi lưu cài đặt');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-muted-foreground mb-6">
        Chỉnh sửa nội dung hiển thị trên trang chủ. Để trống nếu muốn dùng giá trị mặc định.
      </p>

      <div className="space-y-4">
        {SETTING_KEYS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-sm font-medium mb-1 block">{label}</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              value={values[key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}
