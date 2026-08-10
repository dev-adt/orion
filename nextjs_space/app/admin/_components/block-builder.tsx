'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from './rich-text-editor';
import {
  X, Plus, ArrowUp, ArrowDown, Trash2, Upload, Loader2, GripVertical,
  LayoutGrid, MousePointer2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BLOCK_LABELS, BLOCK_CATEGORIES, defaultBlock,
  defaultContactFields,
  type PageBlock, type BlockType, type ContactField,
} from '@/lib/page-blocks';

async function uploadImage(file: File): Promise<string | null> {
  try {
    const res = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    if (!res.ok) throw new Error('presign failed');
    const { uploadUrl, publicUrl } = await res.json();
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type, 'Content-Disposition': 'attachment' },
      body: file,
    });
    if (!put.ok) throw new Error('upload failed');
    return publicUrl;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function ImageField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          const url = await uploadImage(f);
          setBusy(false);
          if (url) { onChange(url); toast.success('Đã tải ảnh lên'); } else { toast.error('Tải ảnh thất bại'); }
        }} />
        <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>
      {value ? <img src={value} alt="preview" className="mt-2 h-20 rounded-md object-cover border border-border" /> : null}
    </div>
  );
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
const lbl = 'block text-xs font-medium mb-1 text-muted-foreground';

interface BlockBuilderProps {
  blocks: PageBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<PageBlock[]>>;
  categories?: any[];
  title?: string;
}

export function BlockBuilder({ blocks, setBlocks, categories = [], title }: BlockBuilderProps) {
  const [showPalette, setShowPalette] = useState(true);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // What is currently being dragged: a new block type, or an existing block index.
  const dragData = useRef<{ kind: 'new'; type: BlockType } | { kind: 'move'; index: number } | null>(null);

  const updateBlock = (id: string, patch: Record<string, any>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };
  const insertBlock = (type: BlockType, index: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const at = index < 0 || index > next.length ? next.length : index;
      next.splice(at, 0, defaultBlock(type));
      return next;
    });
  };
  const addBlock = (type: BlockType) => setBlocks((prev) => [...prev, defaultBlock(type)]);
  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };
  const moveBlockTo = (from: number, to: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      if (from < 0 || from >= next.length) return prev;
      const [item] = next.splice(from, 1);
      let at = to;
      if (from < to) at -= 1;
      if (at < 0) at = 0;
      if (at > next.length) at = next.length;
      next.splice(at, 0, item);
      return next;
    });
  };

  // ---- Drag handlers ----
  const onPaletteDragStart = (type: BlockType) => (e: React.DragEvent) => {
    dragData.current = { kind: 'new', type };
    setDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
    try { e.dataTransfer.setData('text/plain', 'new:' + type); } catch {}
  };
  const onBlockDragStart = (index: number) => (e: React.DragEvent) => {
    dragData.current = { kind: 'move', index };
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', 'move:' + index); } catch {}
  };
  const endDrag = () => { dragData.current = null; setDragOverIdx(null); setDragging(false); };
  const handleDrop = (dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const data = dragData.current;
    endDrag();
    if (!data) return;
    if (data.kind === 'new') {
      insertBlock(data.type, dropIndex);
    } else {
      moveBlockTo(data.index, dropIndex);
    }
  };
  const allowDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const DropZone = ({ index }: { index: number }) => (
    <div
      onDragOver={allowDrop(index)}
      onDragLeave={() => setDragOverIdx((cur) => (cur === index ? null : cur))}
      onDrop={handleDrop(index)}
      className={
        'rounded-lg border-2 border-dashed transition-all ' +
        (dragOverIdx === index
          ? 'border-primary bg-primary/10 h-14 my-1'
          : dragging
            ? 'border-primary/40 bg-primary/5 h-10 my-1'
            : 'border-transparent h-3 my-0.5')
      }
    >
      {dragOverIdx === index ? (
        <div className="flex items-center justify-center h-full text-xs font-medium text-primary">Thả khối vào đây</div>
      ) : dragging ? (
        <div className="flex items-center justify-center h-full text-[11px] text-primary/60">Thả vào đây</div>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title || 'Nội dung'} ({blocks.length} khối)</h3>
        <Button type="button" size="sm" variant={showPalette ? 'secondary' : 'default'} className="gap-1.5" onClick={() => setShowPalette((v) => !v)}>
          <LayoutGrid className="h-4 w-4" /> {showPalette ? 'Ẩn thư viện khối' : 'Thư viện khối'}
        </Button>
      </div>

      {blocks.length === 0 ? (
        <div
          onDragOver={allowDrop(0)}
          onDragLeave={() => setDragOverIdx(null)}
          onDrop={handleDrop(0)}
          className={
            'rounded-xl border-2 border-dashed p-8 text-center text-sm transition-all ' +
            (dragOverIdx === 0 ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')
          }
        >
          <MousePointer2 className="h-6 w-6 mx-auto mb-2 opacity-60" />
          Kéo một khối từ thư viện bên phải và thả vào đây, hoặc bấm vào khối để thêm.
        </div>
      ) : (
        <div>
          <DropZone index={0} />
          {blocks.map((block, idx) => (
            <div key={block.id}>
              <div className="rounded-xl border border-border bg-card">
                <div
                  className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40 cursor-move"
                  draggable
                  onDragStart={onBlockDragStart(idx)}
                  onDragEnd={endDrag}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {BLOCK_LABELS[block.type as BlockType]?.vi || block.type}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveBlock(idx, -1)} disabled={idx === 0}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeBlock(block.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="p-3 grid gap-3">
                  {renderBlockFields(block, updateBlock, categories)}
                </div>
              </div>
              <DropZone index={idx + 1} />
            </div>
          ))}
          {/* Trailing spacer so the last block & drop zone are comfortably reachable above the docked palette */}
          <div className="h-64" aria-hidden="true" />
        </div>
      )}

      {/* Right-docked Odoo-style palette */}
      {showPalette ? (
        <div className="fixed right-0 top-16 z-[60] h-[calc(100%-4rem)] w-72 bg-card border-l border-border shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <span className="text-sm font-semibold flex items-center gap-1.5"><LayoutGrid className="h-4 w-4" /> Thư viện khối</span>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowPalette(false)}><X className="h-4 w-4" /></Button>
          </div>
          <p className="px-4 py-2 text-[11px] text-muted-foreground border-b border-border/60">Kéo khối và thả vào trang, hoặc bấm để thêm vào cuối.</p>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {BLOCK_CATEGORIES.map((cat) => (
              <div key={cat.en}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{cat.vi}</div>
                <div className="grid grid-cols-2 gap-2">
                  {cat.types.map((type) => (
                    <button
                      key={type}
                      type="button"
                      draggable
                      onDragStart={onPaletteDragStart(type)}
                      onDragEnd={endDrag}
                      onClick={() => addBlock(type)}
                      className="rounded-lg border border-border bg-background px-2 py-2.5 text-xs font-medium hover:border-primary hover:bg-primary/5 cursor-grab active:cursor-grabbing text-center leading-tight transition-colors"
                      title={BLOCK_LABELS[type].vi}
                    >
                      {BLOCK_LABELS[type].vi}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderBlockFields(
  block: PageBlock,
  update: (id: string, patch: Record<string, any>) => void,
  categories: any[],
) {
  const u = (patch: Record<string, any>) => update(block.id, patch);
  switch (block.type) {
    case 'hero':
      return (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
            <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Mô tả (VI)</label><textarea className={inputCls} rows={2} value={block.subtitle || ''} onChange={(e) => u({ subtitle: e.target.value })} /></div>
            <div><label className={lbl}>Mô tả (EN)</label><textarea className={inputCls} rows={2} value={block.subtitleEn || ''} onChange={(e) => u({ subtitleEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className={lbl}>Nút (VI)</label><input className={inputCls} value={block.buttonText || ''} onChange={(e) => u({ buttonText: e.target.value })} /></div>
            <div><label className={lbl}>Nút (EN)</label><input className={inputCls} value={block.buttonTextEn || ''} onChange={(e) => u({ buttonTextEn: e.target.value })} /></div>
            <div><label className={lbl}>Liên kết nút</label><input className={inputCls} value={block.buttonLink || ''} onChange={(e) => u({ buttonLink: e.target.value })} placeholder="/products" /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 items-end">
            <ImageField label="Ảnh nền (tùy chọn)" value={block.image || ''} onChange={(v) => u({ image: v })} />
            <div><label className={lbl}>Căn lề</label>
              <select className={inputCls} value={block.align || 'center'} onChange={(e) => u({ align: e.target.value })}>
                <option value="center">Giữa</option>
                <option value="left">Trái</option>
              </select>
            </div>
          </div>
        </>
      );
    case 'heading':
      return (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Nội dung (VI)</label><input className={inputCls} value={block.text || ''} onChange={(e) => u({ text: e.target.value })} /></div>
            <div><label className={lbl}>Nội dung (EN)</label><input className={inputCls} value={block.textEn || ''} onChange={(e) => u({ textEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Cấp độ</label>
              <select className={inputCls} value={block.level || 'h2'} onChange={(e) => u({ level: e.target.value })}>
                <option value="h2">Tiêu đề lớn (H2)</option>
                <option value="h3">Tiêu đề nhỏ (H3)</option>
              </select>
            </div>
            <div><label className={lbl}>Căn lề</label>
              <select className={inputCls} value={block.align || 'center'} onChange={(e) => u({ align: e.target.value })}>
                <option value="center">Giữa</option>
                <option value="left">Trái</option>
                <option value="right">Phải</option>
              </select>
            </div>
          </div>
        </>
      );
    case 'richtext':
      return (
        <>
          <div><label className={lbl}>Nội dung (VI)</label><RichTextEditor value={block.html || ''} onChange={(html) => u({ html })} /></div>
          <div><label className={lbl}>Nội dung (EN) — tùy chọn</label><RichTextEditor value={block.htmlEn || ''} onChange={(htmlEn) => u({ htmlEn })} /></div>
        </>
      );
    case 'image':
      return (
        <>
          <ImageField label="Hình ảnh" value={block.url || ''} onChange={(v) => u({ url: v })} />
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Chú thích (VI)</label><input className={inputCls} value={block.caption || ''} onChange={(e) => u({ caption: e.target.value })} /></div>
            <div><label className={lbl}>Chú thích (EN)</label><input className={inputCls} value={block.captionEn || ''} onChange={(e) => u({ captionEn: e.target.value })} /></div>
          </div>
          <div><label className={lbl}>Mô tả ảnh (alt)</label><input className={inputCls} value={block.alt || ''} onChange={(e) => u({ alt: e.target.value })} /></div>
        </>
      );
    case 'products':
      return (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
            <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className={lbl}>Nguồn</label>
              <select className={inputCls} value={block.source || 'featured'} onChange={(e) => u({ source: e.target.value })}>
                <option value="featured">Sản phẩm nổi bật</option>
                <option value="category">Theo danh mục</option>
                <option value="newest">Mới nhất</option>
              </select>
            </div>
            {block.source === 'category' ? (
              <div><label className={lbl}>Danh mục</label>
                <select className={inputCls} value={block.categorySlug || ''} onChange={(e) => u({ categorySlug: e.target.value })}>
                  <option value="">-- Chọn --</option>
                  {categories.map((c) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
                </select>
              </div>
            ) : <div />}
            <div><label className={lbl}>Số lượng</label><input type="number" className={inputCls} value={block.limit ?? 8} onChange={(e) => u({ limit: parseInt(e.target.value) || 8 })} /></div>
          </div>
        </>
      );
    case 'categories':
      return (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
            <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className={lbl}>Kiểu hiển thị</label>
              <select className={inputCls} value={block.displayMode || 'grid'} onChange={(e) => u({ displayMode: e.target.value })}>
                <option value="grid">Lưới danh mục</option>
                <option value="products">Sản phẩm theo danh mục</option>
              </select>
            </div>
            {block.displayMode === 'products' ? (
              <>
                <div><label className={lbl}>Danh mục</label>
                  <select className={inputCls} value={block.categorySlug || ''} onChange={(e) => u({ categorySlug: e.target.value })}>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
                  </select>
                </div>
                <div><label className={lbl}>Số lượng</label><input type="number" className={inputCls} value={block.limit ?? 8} onChange={(e) => u({ limit: parseInt(e.target.value) || 8 })} /></div>
              </>
            ) : null}
          </div>
          {block.displayMode === 'products' && !block.categorySlug ? (
            <p className="text-[11px] text-amber-600">Hãy chọn một danh mục để hiển thị sản phẩm của danh mục đó.</p>
          ) : null}
        </>
      );
    case 'cta':
      return (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
            <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Mô tả (VI)</label><textarea className={inputCls} rows={2} value={block.subtitle || ''} onChange={(e) => u({ subtitle: e.target.value })} /></div>
            <div><label className={lbl}>Mô tả (EN)</label><textarea className={inputCls} rows={2} value={block.subtitleEn || ''} onChange={(e) => u({ subtitleEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className={lbl}>Nút (VI)</label><input className={inputCls} value={block.buttonText || ''} onChange={(e) => u({ buttonText: e.target.value })} /></div>
            <div><label className={lbl}>Nút (EN)</label><input className={inputCls} value={block.buttonTextEn || ''} onChange={(e) => u({ buttonTextEn: e.target.value })} /></div>
            <div><label className={lbl}>Liên kết</label><input className={inputCls} value={block.buttonLink || ''} onChange={(e) => u({ buttonLink: e.target.value })} placeholder="/products" /></div>
          </div>
        </>
      );
    case 'posts':
      return (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
            <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
          </div>
          <div>
            <label className={lbl}>Số bài viết hiển thị</label>
            <input type="number" className={inputCls + ' max-w-[120px]'} value={block.limit ?? 3} onChange={(e) => u({ limit: parseInt(e.target.value) || 3 })} />
          </div>
        </>
      );
    case 'video':
      return (
        <>
          <div>
            <label className={lbl}>Link video (YouTube / Vimeo / MP4)</label>
            <input className={inputCls} value={block.url || ''} onChange={(e) => u({ url: e.target.value })} placeholder="https://youtu.be/103Jn6YP67I" />
            <p className="text-[11px] text-muted-foreground mt-1">Dán link YouTube/Vimeo thông thường, hệ thống tự chuyển thành trình phát nhúng.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tiêu đề (VI) — tùy chọn</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
            <div><label className={lbl}>Tiêu đề (EN) — tùy chọn</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Chú thích (VI)</label><input className={inputCls} value={block.caption || ''} onChange={(e) => u({ caption: e.target.value })} /></div>
            <div><label className={lbl}>Chú thích (EN)</label><input className={inputCls} value={block.captionEn || ''} onChange={(e) => u({ captionEn: e.target.value })} /></div>
          </div>
        </>
      );
    case 'embed':
      return (
        <>
          <div>
            <label className={lbl}>Mã nhúng (HTML / iframe / script)</label>
            <textarea className={inputCls + ' font-mono text-xs'} rows={6} value={block.code || ''} onChange={(e) => u({ code: e.target.value })} placeholder='&lt;iframe src="..."&gt;&lt;/iframe&gt;' />
            <p className="text-[11px] text-muted-foreground mt-1">Dán mã nhúng từ Google Maps, Facebook, biểu mẫu, lịch... Mã sẽ được hiển thị trực tiếp trên trang.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tiêu đề (VI) — tùy chọn</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
            <div><label className={lbl}>Tiêu đề (EN) — tùy chọn</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Chú thích (VI)</label><input className={inputCls} value={block.caption || ''} onChange={(e) => u({ caption: e.target.value })} /></div>
            <div><label className={lbl}>Chú thích (EN)</label><input className={inputCls} value={block.captionEn || ''} onChange={(e) => u({ captionEn: e.target.value })} /></div>
          </div>
        </>
      );
    case 'contact':
      return <ContactBlockFields block={block} u={u} />;
    case 'columns':
      return <ColumnsBlockFields block={block} u={u} />;
    case 'features':
      return <FeaturesBlockFields block={block} u={u} />;
    case 'stats':
      return <StatsBlockFields block={block} u={u} />;
    case 'testimonial':
      return <TestimonialBlockFields block={block} u={u} />;
    case 'accordion':
      return <AccordionBlockFields block={block} u={u} />;
    case 'button':
      return (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Chữ trên nút (VI)</label><input className={inputCls} value={block.text || ''} onChange={(e) => u({ text: e.target.value })} /></div>
            <div><label className={lbl}>Chữ trên nút (EN)</label><input className={inputCls} value={block.textEn || ''} onChange={(e) => u({ textEn: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className={lbl}>Liên kết</label><input className={inputCls} value={block.link || ''} onChange={(e) => u({ link: e.target.value })} placeholder="/products" /></div>
            <div><label className={lbl}>Kiểu nút</label>
              <select className={inputCls} value={block.variant || 'primary'} onChange={(e) => u({ variant: e.target.value })}>
                <option value="primary">Nổi bật (màu chính)</option>
                <option value="outline">Viền</option>
                <option value="secondary">Phụ</option>
              </select>
            </div>
            <div><label className={lbl}>Căn lề</label>
              <select className={inputCls} value={block.align || 'center'} onChange={(e) => u({ align: e.target.value })}>
                <option value="center">Giữa</option>
                <option value="left">Trái</option>
                <option value="right">Phải</option>
              </select>
            </div>
          </div>
        </>
      );
    case 'gallery':
      return <GalleryBlockFields block={block} u={u} />;
    case 'mediatext':
      return (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Bố trí ảnh & văn bản</label>
              <select className={inputCls} value={block.layout || 'image-left'} onChange={(e) => u({ layout: e.target.value })}>
                <option value="image-left">Ảnh bên trái – văn bản bên phải</option>
                <option value="image-right">Ảnh bên phải – văn bản bên trái</option>
                <option value="image-top">Ảnh phía trên – văn bản phía dưới</option>
                <option value="image-bottom">Văn bản phía trên – ảnh phía dưới</option>
              </select>
            </div>
            <div><label className={lbl}>Tỉ lệ ảnh</label>
              <select className={inputCls} value={block.ratio || 'landscape'} onChange={(e) => u({ ratio: e.target.value })}>
                <option value="landscape">Ngang (16:9)</option>
                <option value="square">Vuông (1:1)</option>
                <option value="portrait">Dọc (3:4)</option>
                <option value="auto">Tự nhiên (theo ảnh)</option>
              </select>
            </div>
          </div>
          <ImageField label="Hình ảnh" value={block.image || ''} onChange={(v) => u({ image: v })} />
          <div><label className={lbl}>Mô tả ảnh (alt)</label><input className={inputCls} value={block.imageAlt || ''} onChange={(e) => u({ imageAlt: e.target.value })} /></div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
            <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
          </div>
          <div><label className={lbl}>Nội dung (VI)</label><RichTextEditor value={block.html || ''} onChange={(html) => u({ html })} /></div>
          <div><label className={lbl}>Nội dung (EN) — tùy chọn</label><RichTextEditor value={block.htmlEn || ''} onChange={(htmlEn) => u({ htmlEn })} /></div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className={lbl}>Chữ trên nút (VI)</label><input className={inputCls} value={block.buttonText || ''} onChange={(e) => u({ buttonText: e.target.value })} placeholder="Tìm hiểu thêm" /></div>
            <div><label className={lbl}>Chữ trên nút (EN)</label><input className={inputCls} value={block.buttonTextEn || ''} onChange={(e) => u({ buttonTextEn: e.target.value })} placeholder="Learn more" /></div>
            <div><label className={lbl}>Liên kết nút</label><input className={inputCls} value={block.buttonLink || ''} onChange={(e) => u({ buttonLink: e.target.value })} placeholder="/products" /></div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1">Để trống “Chữ trên nút” nếu không muốn hiển thị nút.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={lbl}>Kiểu nút</label>
              <select className={inputCls} value={block.buttonVariant || 'primary'} onChange={(e) => u({ buttonVariant: e.target.value })}>
                <option value="primary">Nổi bật (màu chính)</option>
                <option value="outline">Viền</option>
                <option value="secondary">Phụ</option>
              </select>
            </div>
            <div><label className={lbl}>Màu nền (tùy chọn)</label><input className={inputCls} value={block.background || ''} onChange={(e) => u({ background: e.target.value })} placeholder="#f5f5f5 hoặc để trống" /></div>
          </div>
        </>
      );
    case 'html':
      return (
        <div>
          <label className={lbl}>Mã HTML tùy chỉnh</label>
          <textarea className={inputCls + ' font-mono text-xs'} rows={8} value={block.code || ''} onChange={(e) => u({ code: e.target.value })} placeholder="<div>...</div>" />
          <p className="text-[11px] text-muted-foreground mt-1">Mã HTML sẽ được hiển thị trực tiếp trên trang. Có thể dùng class Tailwind hoặc kết hợp với khối CSS tùy chỉnh.</p>
        </div>
      );
    case 'css':
      return (
        <div>
          <label className={lbl}>CSS tùy chỉnh</label>
          <textarea className={inputCls + ' font-mono text-xs'} rows={8} value={block.css || ''} onChange={(e) => u({ css: e.target.value })} placeholder={'.my-class { color: red; }'} />
          <p className="text-[11px] text-muted-foreground mt-1">CSS sẽ áp dụng cho toàn bộ trang này. Nên dùng class riêng để tránh ảnh hưởng phần khác.</p>
        </div>
      );
    case 'header':
    case 'footer':
      return (
        <>
          <div>
            <label className={lbl}>Mã HTML {block.type === 'header' ? 'Header' : 'Footer'}</label>
            <textarea className={inputCls + ' font-mono text-xs'} rows={6} value={block.code || ''} onChange={(e) => u({ code: e.target.value })} placeholder="<div>...</div>" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Màu nền (tùy chọn)</label>
              <input className={inputCls} value={block.background || ''} onChange={(e) => u({ background: e.target.value })} placeholder="#f5f5f5 hoặc để trống" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={block.fullWidth !== false} onChange={(e) => u({ fullWidth: e.target.checked })} /> Trải rộng toàn màn hình
              </label>
            </div>
          </div>
        </>
      );
    case 'spacer':
      return (
        <div><label className={lbl}>Chiều cao (px)</label><input type="number" className={inputCls} value={block.height ?? 48} onChange={(e) => u({ height: parseInt(e.target.value) || 0 })} /></div>
      );
    default:
      return null;
  }
}

// ---- Helpers for repeatable item lists ----
function ItemToolbar({ onUp, onDown, onRemove, isFirst, isLast }: { onUp: () => void; onDown: () => void; onRemove: () => void; isFirst: boolean; isLast: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onUp} disabled={isFirst} className="p-1.5 rounded hover:bg-background disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" onClick={onDown} disabled={isLast} className="p-1.5 rounded hover:bg-background disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
      <button type="button" onClick={onRemove} className="p-1.5 rounded text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function useItemList(block: PageBlock, u: (patch: Record<string, any>) => void, key: string, makeNew: () => any) {
  const items: any[] = Array.isArray(block[key]) ? block[key] : [];
  const set = (next: any[]) => u({ [key]: next });
  const updateItem = (idx: number, patch: Record<string, any>) => set(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    set(next);
  };
  const remove = (idx: number) => set(items.filter((_, i) => i !== idx));
  const add = () => set([...items, makeNew()]);
  return { items, updateItem, move, remove, add };
}

function ColumnsBlockFields({ block, u }: { block: PageBlock; u: (patch: Record<string, any>) => void }) {
  const { items, updateItem, move, remove, add } = useItemList(block, u, 'items', () => ({ title: 'Cột mới', titleEn: 'New column', html: '<p></p>', htmlEn: '' }));
  return (
    <>
      <div><label className={lbl}>Số cột trên máy tính</label>
        <select className={inputCls + ' max-w-[160px]'} value={block.cols || 3} onChange={(e) => u({ cols: parseInt(e.target.value) })}>
          <option value={2}>2 cột</option>
          <option value={3}>3 cột</option>
          <option value={4}>4 cột</option>
        </select>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Cột {idx + 1}</span>
              <ItemToolbar onUp={() => move(idx, -1)} onDown={() => move(idx, 1)} onRemove={() => remove(idx)} isFirst={idx === 0} isLast={idx === items.length - 1} />
            </div>
            <div className="grid md:grid-cols-2 gap-2 mb-2">
              <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={it.title || ''} onChange={(e) => updateItem(idx, { title: e.target.value })} /></div>
              <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={it.titleEn || ''} onChange={(e) => updateItem(idx, { titleEn: e.target.value })} /></div>
            </div>
            <label className={lbl}>Nội dung (VI)</label>
            <RichTextEditor value={it.html || ''} onChange={(html) => updateItem(idx, { html })} />
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" />Thêm cột</Button>
    </>
  );
}

function FeaturesBlockFields({ block, u }: { block: PageBlock; u: (patch: Record<string, any>) => void }) {
  const { items, updateItem, move, remove, add } = useItemList(block, u, 'items', () => ({ icon: '✨', title: 'Tính năng mới', titleEn: 'New feature', text: '', textEn: '' }));
  return (
    <>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className={lbl}>Tiêu đề mục (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
        <div><label className={lbl}>Tiêu đề mục (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
      </div>
      <div><label className={lbl}>Số cột</label>
        <select className={inputCls + ' max-w-[160px]'} value={block.cols || 3} onChange={(e) => u({ cols: parseInt(e.target.value) })}>
          <option value={2}>2 cột</option>
          <option value={3}>3 cột</option>
          <option value={4}>4 cột</option>
        </select>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Tính năng {idx + 1}</span>
              <ItemToolbar onUp={() => move(idx, -1)} onDown={() => move(idx, 1)} onRemove={() => remove(idx)} isFirst={idx === 0} isLast={idx === items.length - 1} />
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <div><label className={lbl}>Biểu tượng (emoji)</label><input className={inputCls} value={it.icon || ''} onChange={(e) => updateItem(idx, { icon: e.target.value })} placeholder="⭐" /></div>
              <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={it.title || ''} onChange={(e) => updateItem(idx, { title: e.target.value })} /></div>
              <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={it.titleEn || ''} onChange={(e) => updateItem(idx, { titleEn: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-2 mt-2">
              <div><label className={lbl}>Mô tả (VI)</label><textarea className={inputCls} rows={2} value={it.text || ''} onChange={(e) => updateItem(idx, { text: e.target.value })} /></div>
              <div><label className={lbl}>Mô tả (EN)</label><textarea className={inputCls} rows={2} value={it.textEn || ''} onChange={(e) => updateItem(idx, { textEn: e.target.value })} /></div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" />Thêm tính năng</Button>
    </>
  );
}

function StatsBlockFields({ block, u }: { block: PageBlock; u: (patch: Record<string, any>) => void }) {
  const { items, updateItem, move, remove, add } = useItemList(block, u, 'items', () => ({ value: '0', label: 'Nhãn', labelEn: 'Label' }));
  return (
    <>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className={lbl}>Tiêu đề mục (VI) — tùy chọn</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
        <div><label className={lbl}>Tiêu đề mục (EN) — tùy chọn</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Số liệu {idx + 1}</span>
              <ItemToolbar onUp={() => move(idx, -1)} onDown={() => move(idx, 1)} onRemove={() => remove(idx)} isFirst={idx === 0} isLast={idx === items.length - 1} />
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <div><label className={lbl}>Con số</label><input className={inputCls} value={it.value || ''} onChange={(e) => updateItem(idx, { value: e.target.value })} placeholder="1000+" /></div>
              <div><label className={lbl}>Nhãn (VI)</label><input className={inputCls} value={it.label || ''} onChange={(e) => updateItem(idx, { label: e.target.value })} /></div>
              <div><label className={lbl}>Nhãn (EN)</label><input className={inputCls} value={it.labelEn || ''} onChange={(e) => updateItem(idx, { labelEn: e.target.value })} /></div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" />Thêm số liệu</Button>
    </>
  );
}

function TestimonialBlockFields({ block, u }: { block: PageBlock; u: (patch: Record<string, any>) => void }) {
  const { items, updateItem, move, remove, add } = useItemList(block, u, 'items', () => ({ quote: '', quoteEn: '', author: '', role: '' }));
  return (
    <>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className={lbl}>Tiêu đề mục (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
        <div><label className={lbl}>Tiêu đề mục (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Nhận xét {idx + 1}</span>
              <ItemToolbar onUp={() => move(idx, -1)} onDown={() => move(idx, 1)} onRemove={() => remove(idx)} isFirst={idx === 0} isLast={idx === items.length - 1} />
            </div>
            <div className="grid md:grid-cols-2 gap-2 mb-2">
              <div><label className={lbl}>Nội dung nhận xét (VI)</label><textarea className={inputCls} rows={2} value={it.quote || ''} onChange={(e) => updateItem(idx, { quote: e.target.value })} /></div>
              <div><label className={lbl}>Nội dung nhận xét (EN)</label><textarea className={inputCls} rows={2} value={it.quoteEn || ''} onChange={(e) => updateItem(idx, { quoteEn: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <div><label className={lbl}>Tên người nhận xét</label><input className={inputCls} value={it.author || ''} onChange={(e) => updateItem(idx, { author: e.target.value })} /></div>
              <div><label className={lbl}>Chức danh</label><input className={inputCls} value={it.role || ''} onChange={(e) => updateItem(idx, { role: e.target.value })} /></div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" />Thêm nhận xét</Button>
    </>
  );
}

function AccordionBlockFields({ block, u }: { block: PageBlock; u: (patch: Record<string, any>) => void }) {
  const { items, updateItem, move, remove, add } = useItemList(block, u, 'items', () => ({ q: '', qEn: '', a: '', aEn: '' }));
  return (
    <>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className={lbl}>Tiêu đề mục (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
        <div><label className={lbl}>Tiêu đề mục (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Câu hỏi {idx + 1}</span>
              <ItemToolbar onUp={() => move(idx, -1)} onDown={() => move(idx, 1)} onRemove={() => remove(idx)} isFirst={idx === 0} isLast={idx === items.length - 1} />
            </div>
            <div className="grid md:grid-cols-2 gap-2 mb-2">
              <div><label className={lbl}>Câu hỏi (VI)</label><input className={inputCls} value={it.q || ''} onChange={(e) => updateItem(idx, { q: e.target.value })} /></div>
              <div><label className={lbl}>Câu hỏi (EN)</label><input className={inputCls} value={it.qEn || ''} onChange={(e) => updateItem(idx, { qEn: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <div><label className={lbl}>Trả lời (VI)</label><textarea className={inputCls} rows={2} value={it.a || ''} onChange={(e) => updateItem(idx, { a: e.target.value })} /></div>
              <div><label className={lbl}>Trả lời (EN)</label><textarea className={inputCls} rows={2} value={it.aEn || ''} onChange={(e) => updateItem(idx, { aEn: e.target.value })} /></div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" />Thêm câu hỏi</Button>
    </>
  );
}

function GalleryBlockFields({ block, u }: { block: PageBlock; u: (patch: Record<string, any>) => void }) {
  const { items, updateItem, move, remove, add } = useItemList(block, u, 'images', () => ({ url: '', alt: '' }));
  return (
    <>
      <div><label className={lbl}>Số cột</label>
        <select className={inputCls + ' max-w-[160px]'} value={block.cols || 3} onChange={(e) => u({ cols: parseInt(e.target.value) })}>
          <option value={2}>2 cột</option>
          <option value={3}>3 cột</option>
          <option value={4}>4 cột</option>
        </select>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Ảnh {idx + 1}</span>
              <ItemToolbar onUp={() => move(idx, -1)} onDown={() => move(idx, 1)} onRemove={() => remove(idx)} isFirst={idx === 0} isLast={idx === items.length - 1} />
            </div>
            <ImageField label="Hình ảnh" value={it.url || ''} onChange={(v) => updateItem(idx, { url: v })} />
            <div className="mt-2"><label className={lbl}>Mô tả ảnh (alt)</label><input className={inputCls} value={it.alt || ''} onChange={(e) => updateItem(idx, { alt: e.target.value })} /></div>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" />Thêm ảnh</Button>
    </>
  );
}

function ContactBlockFields({ block, u }: { block: PageBlock; u: (patch: Record<string, any>) => void }) {
  const fields: ContactField[] = Array.isArray(block.fields) && block.fields.length > 0 ? block.fields : defaultContactFields();

  const setFields = (next: ContactField[]) => u({ fields: next });
  const updateField = (idx: number, patch: Partial<ContactField>) => {
    const next = fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    setFields(next);
  };
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[idx], next[j]] = [next[j], next[idx]];
    setFields(next);
  };
  const remove = (idx: number) => setFields(fields.filter((_, i) => i !== idx));
  const add = () => {
    const key = 'f_' + Math.random().toString(36).slice(2, 8);
    setFields([...fields, { key, label: 'Trường mới', labelEn: 'New field', type: 'text', required: false }]);
  };

  return (
    <>
      <div className="rounded-lg border-2 border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">⚙️ Cài đặt nâng cao (khách hàng không nhìn thấy)</p>
        <div>
          <label className={lbl}>🔗 URL trang Thank-you (sau khi gửi, tự động chuyển hướng)</label>
          <input className={inputCls} value={block.thankYouUrl || ''} onChange={(e) => u({ thankYouUrl: e.target.value })} placeholder="/cam-on hoặc https://example.com/thank-you" />
          <p className="text-[11px] text-muted-foreground mt-1">Để trống → hiển thị thông báo thành công ngay tại chỗ. Có link → tự chuyển hướng sau khi gửi.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={block.showRequired !== false} onChange={(e) => u({ showRequired: e.target.checked })} />
            Hiển thị dấu <span className="text-red-500 font-bold">*</span> cho trường bắt buộc
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div><label className={lbl}>Tiêu đề (VI)</label><input className={inputCls} value={block.title || ''} onChange={(e) => u({ title: e.target.value })} /></div>
        <div><label className={lbl}>Tiêu đề (EN)</label><input className={inputCls} value={block.titleEn || ''} onChange={(e) => u({ titleEn: e.target.value })} /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className={lbl}>Mô tả (VI)</label><textarea className={inputCls} rows={2} value={block.subtitle || ''} onChange={(e) => u({ subtitle: e.target.value })} /></div>
        <div><label className={lbl}>Mô tả (EN)</label><textarea className={inputCls} rows={2} value={block.subtitleEn || ''} onChange={(e) => u({ subtitleEn: e.target.value })} /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className={lbl}>Chữ trên nút (VI)</label><input className={inputCls} value={block.submitText || ''} onChange={(e) => u({ submitText: e.target.value })} placeholder="Gửi" /></div>
        <div><label className={lbl}>Chữ trên nút (EN)</label><input className={inputCls} value={block.submitTextEn || ''} onChange={(e) => u({ submitTextEn: e.target.value })} placeholder="Send" /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className={lbl}>Thông báo sau khi gửi (VI)</label><input className={inputCls} value={block.successText || ''} onChange={(e) => u({ successText: e.target.value })} /></div>
        <div><label className={lbl}>Thông báo sau khi gửi (EN)</label><input className={inputCls} value={block.successTextEn || ''} onChange={(e) => u({ successTextEn: e.target.value })} /></div>
      </div>

      <div className="border-t border-border/60 pt-3 mt-1">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Các trường thông tin thu thập</label>
          <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" />Thêm trường</Button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Dữ liệu người dùng gửi sẽ tự động đổ về mục CRM &rarr; Liên hệ.</p>
        <div className="space-y-2">
          {fields.map((f, idx) => (
            <div key={f.key} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="grid md:grid-cols-2 gap-2">
                <div><label className={lbl}>Nhãn (VI)</label><input className={inputCls} value={f.label || ''} onChange={(e) => updateField(idx, { label: e.target.value })} /></div>
                <div><label className={lbl}>Nhãn (EN)</label><input className={inputCls} value={f.labelEn || ''} onChange={(e) => updateField(idx, { labelEn: e.target.value })} /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-2 mt-2 items-end">
                <div><label className={lbl}>Loại trường</label>
                  <select className={inputCls} value={f.type} onChange={(e) => updateField(idx, { type: e.target.value as ContactField['type'] })}>
                    <option value="text">Văn bản ngắn</option>
                    <option value="email">Email</option>
                    <option value="tel">Số điện thoại</option>
                    <option value="textarea">Văn bản dài</option>
                    <option value="select">Lựa chọn (dropdown)</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pb-1 flex-wrap">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(idx, { required: e.target.checked })} />
                    Bắt buộc
                  </label>
                  <div className="ml-auto flex items-center gap-1">
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 rounded hover:bg-background disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === fields.length - 1} className="p-1.5 rounded hover:bg-background disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => remove(idx)} className="p-1.5 rounded text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
              {f.type === 'select' ? (
                <div className="mt-2">
                  <label className={lbl}>Các lựa chọn (mỗi dòng một mục)</label>
                  <textarea className={inputCls} rows={3} value={(f.options || []).join('\n')} onChange={(e) => updateField(idx, { options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
