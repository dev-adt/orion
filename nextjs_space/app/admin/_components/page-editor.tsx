'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { parseBlocks, type PageBlock } from '@/lib/page-blocks';
import { BlockBuilder } from './block-builder';
import { VisibilityField } from './visibility-field';
import { parseViewRoles } from '@/lib/roles';

interface Props {
  page: any | null;
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
const lbl = 'block text-xs font-medium mb-1 text-muted-foreground';

export function PageEditor({ page, categories, onClose, onSaved }: Props) {
  const isEdit = !!page;
  const [title, setTitle] = useState(page?.title || '');
  const [titleEn, setTitleEn] = useState(page?.titleEn || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [published, setPublished] = useState(page?.published ?? true);
  const [showInMenu, setShowInMenu] = useState(page?.showInMenu ?? false);
  const [menuOrder, setMenuOrder] = useState<number>(page?.menuOrder ?? 0);
  const [isHomepage, setIsHomepage] = useState(page?.isHomepage ?? false);
  const [metaTitle, setMetaTitle] = useState(page?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(page?.metaDescription || '');
  const [blocks, setBlocks] = useState<PageBlock[]>(() => parseBlocks(page?.blocks));
  const [visibility, setVisibility] = useState<string>(page?.visibility || 'public');
  const [viewRoles, setViewRoles] = useState<string[]>(() => parseViewRoles(page?.viewRoles));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { toast.error('Vui lòng nhập tiêu đề trang'); return; }
    setSaving(true);
    try {
      const payload = {
        title, titleEn, slug, published, showInMenu, menuOrder: Number(menuOrder) || 0,
        isHomepage, metaTitle, metaDescription,
        visibility, viewRoles: viewRoles.join(','),
        blocks: JSON.stringify(blocks),
      };
      const url = isEdit ? '/api/admin/pages/' + page.id : '/api/admin/pages';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('save failed');
      toast.success(isEdit ? 'Đã cập nhật trang' : 'Đã tạo trang');
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
          <h2 className="font-semibold">{isEdit ? 'Chỉnh sửa trang' : 'Tạo trang mới'}</h2>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu
        </Button>
      </div>

      <div className="w-full max-w-[1600px] mx-auto p-4 lg:pr-80 grid gap-6">
        {/* Page meta */}
        <div className="grid gap-3 rounded-xl border border-border p-4 bg-card">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Tiêu đề trang (VI) *</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Giới thiệu" />
            </div>
            <div>
              <label className={lbl}>Tiêu đề trang (EN)</label>
              <input className={inputCls} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. About us" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Đường dẫn (slug)</label>
              <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gioi-thieu (để trống để tự tạo)" />
              <p className="text-[11px] text-muted-foreground mt-1">Trang sẽ truy cập tại /trang/{slug || 'slug'}</p>
            </div>
            <div>
              <label className={lbl}>Thứ tự trong menu</label>
              <input type="number" className={inputCls} value={menuOrder} onChange={(e) => setMenuOrder(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Xuất bản</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showInMenu} onChange={(e) => setShowInMenu(e.target.checked)} /> Hiển thị trên menu</label>
            <label className="flex items-center gap-2 text-sm font-medium text-primary"><input type="checkbox" checked={isHomepage} onChange={(e) => setIsHomepage(e.target.checked)} /> Đặt làm trang chủ</label>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Meta title (SEO)</label>
              <input className={inputCls} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Meta description (SEO)</label>
              <input className={inputCls} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Visibility / audience */}
        <VisibilityField visibility={visibility} setVisibility={setVisibility} viewRoles={viewRoles} setViewRoles={setViewRoles} />

        {/* Blocks */}
        <BlockBuilder blocks={blocks} setBlocks={setBlocks} categories={categories} title="Nội dung trang" />
      </div>
    </div>
  );
}
