'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RichTextEditor } from './rich-text-editor';
import { BlockBuilder } from './block-builder';
import { parseBlocks, type PageBlock } from '@/lib/page-blocks';
import { VisibilityField } from './visibility-field';
import { parseViewRoles } from '@/lib/roles';

interface Props {
  post: any | null;
  onClose: () => void;
  onSaved: () => void;
}

// Convert an ISO date string to the value format expected by datetime-local input
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

export function PostEditor({ post, onClose, onSaved }: Props) {
  const isEdit = !!post;
  const [form, setForm] = useState({
    title: post?.title ?? '',
    titleEn: post?.titleEn ?? '',
    excerpt: post?.excerpt ?? '',
    excerptEn: post?.excerptEn ?? '',
    content: post?.content ?? '',
    contentEn: post?.contentEn ?? '',
    customCss: post?.customCss ?? '',
    headerHtml: post?.headerHtml ?? '',
    footerHtml: post?.footerHtml ?? '',
    image: post?.image ?? '',
    metaTitle: post?.metaTitle ?? '',
    metaDescription: post?.metaDescription ?? '',
    published: post?.published ?? false,
    publishedAt: toLocalInput(post?.publishedAt),
    expiresAt: toLocalInput(post?.expiresAt),
    postCategoryId: post?.postCategoryId ?? '',
  });
  const [blocks, setBlocks] = useState<PageBlock[]>(() => parseBlocks(post?.blocks));
  const [visibility, setVisibility] = useState<string>(post?.visibility || 'public');
  const [viewRoles, setViewRoles] = useState<string[]>(() => parseViewRoles(post?.viewRoles));
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  const set = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }));

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/post-categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadProductCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setProductCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadCategories(); loadProductCategories(); }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const res = await fetch('/api/admin/post-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Loi');
      await loadCategories();
      set('postCategoryId', data.category.id);
      setNewCatName('');
      toast.success('Đã thêm chuyên mục');
    } catch (err: any) {
      toast.error('Không thêm được chuyên mục');
    }
    setAddingCat(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type, 'Content-Disposition': 'attachment' },
        body: file,
      });
      set('image', data.publicUrl);
      toast.success('Tải ảnh thành công');
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tải ảnh');
    }
    setUploading(false);
  };

  const handleAIWrite = async () => {
    if (!form.title.trim()) {
      toast.error('Nhập chủ đề / tiêu đề trước');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/admin/seo-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: form.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      const r = data.result;
      setForm((prev) => ({
        ...prev,
        title: r.title || prev.title,
        titleEn: r.titleEn || prev.titleEn,
        excerpt: r.excerpt || prev.excerpt,
        excerptEn: r.excerptEn || prev.excerptEn,
        content: r.content || prev.content,
        contentEn: r.contentEn || prev.contentEn,
        metaTitle: r.metaTitle || prev.metaTitle,
        metaDescription: r.metaDescription || prev.metaDescription,
      }));
      toast.success('AI đã tạo bài viết!');
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi AI');
    }
    setAiLoading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Tiêu đề không được trống');
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/posts/${post.id}` : '/api/admin/posts';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, visibility, viewRoles: viewRoles.join(','), blocks: JSON.stringify(blocks) }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error || 'Lỗi lưu');
      }
      toast.success(isEdit ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
        <h2 className="font-display text-lg font-bold">
          {isEdit ? 'Sửa bài viết' : 'Thêm bài viết mới'}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[1600px] mx-auto p-6 lg:pr-80 space-y-4">
          {/* AI generate button */}
          <div className="bg-primary/5 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <p className="text-sm text-muted-foreground flex-1">
              Nhập chủ đề vào tiêu đề, sau đó nhấn nút bên phải để AI viết bài hoàn chỉnh.
            </p>
            <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleAIWrite} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Viết bài bằng AI
            </Button>
          </div>

          {/* Title VI */}
          <div>
            <label className="text-sm font-medium mb-1 block">Tiêu đề (Việt) *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="VD: Hướng dẫn chọn máy khuếch tán tinh dầu"
            />
          </div>

          {/* Title EN */}
          <div>
            <label className="text-sm font-medium mb-1 block">Tiêu đề (English)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              value={form.titleEn}
              onChange={(e) => set('titleEn', e.target.value)}
            />
          </div>

          {/* Image */}
          <div>
            <label className="text-sm font-medium mb-1 block">Ảnh bìa</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 bg-background text-sm"
                value={form.image}
                onChange={(e) => set('image', e.target.value)}
                placeholder="URL ảnh hoặc tải lên"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                  }}
                />
                <Button variant="outline" size="icon" className="h-10 w-10" asChild disabled={uploading}>
                  <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                </Button>
              </label>
            </div>
            {form.image && (
              <div className="mt-2 w-32 h-20 rounded border overflow-hidden bg-muted">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Excerpt VI */}
          <div>
            <label className="text-sm font-medium mb-1 block">Tóm tắt (Việt)</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              rows={2}
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
            />
          </div>

          {/* Excerpt EN */}
          <div>
            <label className="text-sm font-medium mb-1 block">Tóm tắt (English)</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              rows={2}
              value={form.excerptEn}
              onChange={(e) => set('excerptEn', e.target.value)}
            />
          </div>

          {/* Content VI */}
          <div>
            <label className="text-sm font-medium mb-1 block">Nội dung (Việt)</label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => set('content', html)}
              placeholder="Soạn nội dung bài viết..."
            />
          </div>

          {/* Content EN */}
          <div>
            <label className="text-sm font-medium mb-1 block">Nội dung (English)</label>
            <RichTextEditor
              value={form.contentEn}
              onChange={(html) => set('contentEn', html)}
              placeholder="Write the English content..."
            />
          </div>

          {/* Block builder — chèn khối nội dung như trang */}
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-semibold mb-1">Khối nội dung nâng cao</p>
            <p className="text-[11px] text-muted-foreground mb-3">Chèn thêm các khối (banner, lưới sản phẩm, CTA, video, biểu mẫu liên hệ, HTML/CSS...) hiển thị phía dưới nội dung bài viết.</p>
            <BlockBuilder blocks={blocks} setBlocks={setBlocks} categories={productCategories} title="Khối nội dung" />
          </div>

          {/* Advanced: HTML / CSS / Header / Footer */}
          <details className="rounded-lg border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-semibold select-none">Nâng cao: HTML / CSS / Header / Footer</summary>
            <div className="mt-3 space-y-4">
              <p className="text-[11px] text-muted-foreground">Tùy chỉnh cho riêng bài viết này. Header hiển thị phía trên nội dung, Footer phía dưới, CSS áp dụng cho cả trang bài viết.</p>
              <div>
                <label className="text-sm font-medium mb-1 block">Header tùy chỉnh (HTML)</label>
                <textarea className="w-full border rounded-lg px-3 py-2 bg-background text-xs font-mono" rows={4} value={form.headerHtml} onChange={(e) => set('headerHtml', e.target.value)} placeholder="<div>...</div>" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Footer tùy chỉnh (HTML)</label>
                <textarea className="w-full border rounded-lg px-3 py-2 bg-background text-xs font-mono" rows={4} value={form.footerHtml} onChange={(e) => set('footerHtml', e.target.value)} placeholder="<div>...</div>" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">CSS tùy chỉnh</label>
                <textarea className="w-full border rounded-lg px-3 py-2 bg-background text-xs font-mono" rows={5} value={form.customCss} onChange={(e) => set('customCss', e.target.value)} placeholder={'.my-class { color: red; }'} />
              </div>
            </div>
          </details>

          {/* Meta SEO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Meta Title SEO</label>
              <input
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                value={form.metaTitle}
                onChange={(e) => set('metaTitle', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Meta Description</label>
              <input
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                value={form.metaDescription}
                onChange={(e) => set('metaDescription', e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-1 block">Chuyên mục</label>
            <div className="flex gap-2">
              <select
                className="flex-1 border rounded-lg px-3 py-2 bg-background text-sm"
                value={form.postCategoryId}
                onChange={(e) => set('postCategoryId', e.target.value)}
              >
                <option value="">-- Không phân loại --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 bg-background text-sm"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Thêm chuyên mục mới..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
              />
              <Button type="button" variant="outline" size="sm" className="gap-1 shrink-0" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}>
                {addingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Thêm
              </Button>
            </div>
          </div>

          {/* Publish & expiry dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Ngày xuất bản</label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                value={form.publishedAt}
                onChange={(e) => set('publishedAt', e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Để trống = xuất bản ngay khi đăng.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ngày hết hạn (tự ẩn)</label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                value={form.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Để trống = không hết hạn. Sau thời điểm này bài viết tự ẩn.</p>
            </div>
          </div>

          {/* Published toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set('published', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Đăng bài (công khai)</span>
          </label>

          {/* Visibility / audience */}
          <VisibilityField visibility={visibility} setVisibility={setVisibility} viewRoles={viewRoles} setViewRoles={setViewRoles} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-3 border-t shrink-0">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Cập nhật' : 'Tạo bài viết'}
        </Button>
      </div>
    </div>
  );
}
