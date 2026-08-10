'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import {
  X, Loader2, Sparkles, Upload, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductEditorProps {
  product: any | null; // null = create mode
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductEditor({ product, categories, onClose, onSaved }: ProductEditorProps) {
  const { locale } = useTranslation();
  const isEdit = !!product?.id;
  const vi = locale === 'vi';

  const [form, setForm] = useState<any>({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    price: '',
    originalPrice: '',
    stock: 100,
    categoryId: '',
    image: '',
    featured: false,
    specs: {},
  });
  const [seoKeywords, setSeoKeywords] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [meta, setMeta] = useState<{ metaTitle?: string; metaDescription?: string }>({});

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name ?? '',
        nameEn: product.nameEn ?? '',
        description: product.description ?? '',
        descriptionEn: product.descriptionEn ?? '',
        price: product.price ?? '',
        originalPrice: product.originalPrice ?? '',
        stock: product.stock ?? 100,
        categoryId: product.categoryId ?? '',
        image: product.image ?? '',
        featured: !!product.featured,
        specs: product.specs ?? {},
      });
    } else if (categories?.length) {
      setForm((f: any) => ({ ...f, categoryId: categories[0]?.id ?? '' }));
    }
  }, [product, categories]);

  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const handleUpload = async (e: any) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(vi ? 'Chỉ chấp nhận file ảnh' : 'Only image files allowed');
      return;
    }
    setUploading(true);
    try {
      const presRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      if (!presRes.ok) throw new Error('presign failed');
      const { uploadUrl, publicUrl } = await presRes.json();
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('upload failed');
      set('image', publicUrl);
      toast.success(vi ? 'Đã tải ảnh lên' : 'Image uploaded');
    } catch {
      toast.error(vi ? 'Tải ảnh thất bại' : 'Upload failed');
    }
    setUploading(false);
  };

  const generateSEO = async () => {
    if (!form.name?.trim()) {
      toast.error(vi ? 'Nhập tên sản phẩm trước' : 'Enter product name first');
      return;
    }
    setGenerating(true);
    try {
      const catName = categories.find((c) => c.id === form.categoryId)?.name;
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: form.name, category: catName, keywords: seoKeywords }),
      });
      if (!res.ok) throw new Error('seo failed');
      const { result } = await res.json();
      setForm((f: any) => ({
        ...f,
        nameEn: result?.nameEn || f.nameEn,
        description: result?.description || f.description,
        descriptionEn: result?.descriptionEn || f.descriptionEn,
        specs: result?.specs || f.specs,
      }));
      setMeta({ metaTitle: result?.metaTitle, metaDescription: result?.metaDescription });
      toast.success(vi ? 'Đã tạo nội dung SEO' : 'SEO content generated');
    } catch {
      toast.error(vi ? 'Tạo nội dung thất bại' : 'Generation failed');
    }
    setGenerating(false);
  };

  const save = async () => {
    if (!form.name?.trim()) {
      toast.error(vi ? 'Vui lòng nhập tên sản phẩm' : 'Product name required');
      return;
    }
    if (form.price === '' || form.price === null || isNaN(Number(form.price))) {
      toast.error(vi ? 'Vui lòng nhập giá hợp lệ' : 'Valid price required');
      return;
    }
    if (!form.categoryId) {
      toast.error(vi ? 'Vui lòng chọn danh mục' : 'Category required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      const res = isEdit
        ? await fetch(`/api/admin/products/${product.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error('save failed');
      toast.success(isEdit ? (vi ? 'Đã cập nhật' : 'Updated') : (vi ? 'Đã thêm sản phẩm' : 'Product added'));
      onSaved();
      onClose();
    } catch {
      toast.error(vi ? 'Lưu thất bại' : 'Save failed');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold">
            {isEdit ? (vi ? 'Sửa sản phẩm' : 'Edit product') : (vi ? 'Thêm sản phẩm mới' : 'Add new product')}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Image */}
          <div>
            <label className="text-sm font-medium">{vi ? 'Hình ảnh sản phẩm' : 'Product image'}</label>
            <div className="mt-1 flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg border bg-muted overflow-hidden relative flex-shrink-0">
                {form.image ? (
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    {vi ? 'Chưa có ảnh' : 'No image'}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:bg-muted text-sm">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {vi ? 'Tải ảnh lên' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
                <input
                  value={form.image}
                  onChange={(e) => set('image', e.target.value)}
                  placeholder={vi ? 'Hoặc dán link ảnh...' : 'Or paste image URL...'}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
                />
              </div>
            </div>
          </div>

          {/* SEO generator */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {vi ? 'Viết bài SEO bằng AI' : 'AI SEO writer'}
            </div>
            <p className="text-xs text-muted-foreground">
              {vi
                ? 'Nhập tên sản phẩm ở trên, AI sẽ tự viết mô tả, tên tiếng Anh, thông số và meta SEO.'
                : 'Enter the product name above, AI will write the description, English name, specs and SEO meta.'}
            </p>
            <div className="flex gap-2">
              <input
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder={vi ? 'Từ khóa (tùy chọn)...' : 'Keywords (optional)...'}
                className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background"
              />
              <Button type="button" onClick={generateSEO} disabled={generating} className="gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {vi ? 'Tạo' : 'Generate'}
              </Button>
            </div>
            {(meta.metaTitle || meta.metaDescription) && (
              <div className="text-xs text-muted-foreground bg-background rounded p-2 border">
                {meta.metaTitle && <p><b>Meta title:</b> {meta.metaTitle}</p>}
                {meta.metaDescription && <p><b>Meta description:</b> {meta.metaDescription}</p>}
              </div>
            )}
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{vi ? 'Tên sản phẩm (VI) *' : 'Name (VI) *'}</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)}
                className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">{vi ? 'Tên (EN)' : 'Name (EN)'}</label>
              <input value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)}
                className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" />
            </div>
          </div>

          {/* Category + featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{vi ? 'Danh mục *' : 'Category *'}</label>
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}
                className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background">
                <option value="">{vi ? '-- Chọn --' : '-- Select --'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{vi ? c.name : (c.nameEn ?? c.name)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
                <Star className="h-4 w-4 text-yellow-500" />
                {vi ? 'Sản phẩm nổi bật' : 'Featured product'}
              </label>
            </div>
          </div>

          {/* Price + stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">{vi ? 'Giá bán (đ) *' : 'Price (VND) *'}</label>
              <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)}
                className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">{vi ? 'Giá gốc (đ)' : 'Original price'}</label>
              <input type="number" value={form.originalPrice ?? ''} onChange={(e) => set('originalPrice', e.target.value)}
                className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">{vi ? 'Tồn kho' : 'Stock'}</label>
              <input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)}
                className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" />
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <label className="text-sm font-medium">{vi ? 'Mô tả (VI)' : 'Description (VI)'}</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
              className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" />
          </div>
          <div>
            <label className="text-sm font-medium">{vi ? 'Mô tả (EN)' : 'Description (EN)'}</label>
            <textarea value={form.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)} rows={3}
              className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" />
          </div>

          {/* Specs preview */}
          {form.specs && Object.keys(form.specs).length > 0 && (
            <div>
              <label className="text-sm font-medium">{vi ? 'Thông số kỹ thuật' : 'Specifications'}</label>
              <div className="mt-1 text-xs bg-muted rounded-lg p-3 space-y-1">
                {Object.entries(form.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t p-4 sticky bottom-0 bg-card">
          <Button variant="outline" onClick={onClose}>{vi ? 'Hủy' : 'Cancel'}</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {vi ? 'Lưu' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
