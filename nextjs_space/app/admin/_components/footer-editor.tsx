'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  defaultFooterConfig,
  parseFooterConfig,
  FOOTER_SETTING_KEY,
  type FooterConfig,
  type FooterColumn,
  type FooterLink,
} from '@/lib/footer-config';

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const lbl = 'block text-xs font-medium text-muted-foreground mb-1';

export function FooterEditor() {
  const [cfg, setCfg] = useState<FooterConfig>(() => defaultFooterConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const raw = d?.settings?.[FOOTER_SETTING_KEY];
        if (raw) setCfg(parseFooterConfig(raw));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (patch: Partial<FooterConfig>) => setCfg((prev) => ({ ...prev, ...patch }));

  // ----- column helpers -----
  const setColumns = (columns: FooterColumn[]) => set({ columns });
  const updateColumn = (ci: number, patch: Partial<FooterColumn>) =>
    setColumns(cfg.columns.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  const moveColumn = (ci: number, dir: -1 | 1) => {
    const j = ci + dir;
    if (j < 0 || j >= cfg.columns.length) return;
    const next = [...cfg.columns];
    [next[ci], next[j]] = [next[j], next[ci]];
    setColumns(next);
  };
  const removeColumn = (ci: number) => setColumns(cfg.columns.filter((_, i) => i !== ci));
  const addColumn = () =>
    setColumns([...cfg.columns, { title: 'Cột mới', titleEn: 'New column', links: [] }]);

  // ----- link helpers -----
  const updateLink = (ci: number, li: number, patch: Partial<FooterLink>) => {
    const links = cfg.columns[ci].links.map((l, i) => (i === li ? { ...l, ...patch } : l));
    updateColumn(ci, { links });
  };
  const moveLink = (ci: number, li: number, dir: -1 | 1) => {
    const links = [...cfg.columns[ci].links];
    const j = li + dir;
    if (j < 0 || j >= links.length) return;
    [links[li], links[j]] = [links[j], links[li]];
    updateColumn(ci, { links });
  };
  const removeLink = (ci: number, li: number) =>
    updateColumn(ci, { links: cfg.columns[ci].links.filter((_, i) => i !== li) });
  const addLink = (ci: number) =>
    updateColumn(ci, {
      links: [...cfg.columns[ci].links, { label: 'Liên kết mới', labelEn: 'New link', url: '/' }],
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { [FOOTER_SETTING_KEY]: JSON.stringify(cfg) } }),
      });
      if (!res.ok) throw new Error();
      toast.success('Đã lưu chân trang');
    } catch {
      toast.error('Lỗi khi lưu chân trang');
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
    <div className="max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Chᢁnh sửa nội dung chân trang hiển thị trên toàn bộ website. Thay đổi được áp dụng ngay sau khi lưu.
      </p>

      {/* Brand description */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Giới thiệu thương hiệu</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Mô tả (VI)</label>
            <textarea className={inputCls} rows={3} value={cfg.description} onChange={(e) => set({ description: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Mô tả (EN)</label>
            <textarea className={inputCls} rows={3} value={cfg.descriptionEn || ''} onChange={(e) => set({ descriptionEn: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Link columns */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Các cột liên kết</h3>
          <Button type="button" size="sm" variant="outline" onClick={addColumn}>
            <Plus className="h-4 w-4 mr-1" />Thêm cột
          </Button>
        </div>

        {cfg.columns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Chưa có cột nào. Bấm “Thêm cột” để tạo.</p>
        ) : null}

        <div className="space-y-4">
          {cfg.columns.map((col, ci) => (
            <div key={ci} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <div className="grid md:grid-cols-2 gap-2 flex-1">
                  <div>
                    <label className={lbl}>Tiêu đề cột (VI)</label>
                    <input className={inputCls} value={col.title} onChange={(e) => updateColumn(ci, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className={lbl}>Tiêu đề cột (EN)</label>
                    <input className={inputCls} value={col.titleEn || ''} onChange={(e) => updateColumn(ci, { titleEn: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-5">
                  <button type="button" onClick={() => moveColumn(ci, -1)} disabled={ci === 0} className="p-1.5 rounded hover:bg-background disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveColumn(ci, 1)} disabled={ci === cfg.columns.length - 1} className="p-1.5 rounded hover:bg-background disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeColumn(ci)} className="p-1.5 rounded text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              {/* Links */}
              <div className="mt-3 space-y-2">
                {col.links.map((lnk, li) => (
                  <div key={li} className="rounded-md border border-border/60 bg-background p-2">
                    <div className="grid md:grid-cols-3 gap-2">
                      <div>
                        <label className={lbl}>Nhãn (VI)</label>
                        <input className={inputCls} value={lnk.label} onChange={(e) => updateLink(ci, li, { label: e.target.value })} />
                      </div>
                      <div>
                        <label className={lbl}>Nhãn (EN)</label>
                        <input className={inputCls} value={lnk.labelEn || ''} onChange={(e) => updateLink(ci, li, { labelEn: e.target.value })} />
                      </div>
                      <div>
                        <label className={lbl}>Đường dẫn (URL)</label>
                        <input className={inputCls} value={lnk.url} onChange={(e) => updateLink(ci, li, { url: e.target.value })} placeholder="/products hoặc https://..." />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <button type="button" onClick={() => moveLink(ci, li, -1)} disabled={li === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => moveLink(ci, li, 1)} disabled={li === col.links.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => removeLink(ci, li)} className="p-1 rounded text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={() => addLink(ci)}>
                  <Link2 className="h-4 w-4" />Thêm liên kết
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Thông tin liên hệ</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Tiêu đề cột liên hệ (VI)</label>
            <input className={inputCls} value={cfg.contactTitle} onChange={(e) => set({ contactTitle: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Tiêu đề cột liên hệ (EN)</label>
            <input className={inputCls} value={cfg.contactTitleEn || ''} onChange={(e) => set({ contactTitleEn: e.target.value })} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Email</label>
            <input className={inputCls} value={cfg.email} onChange={(e) => set({ email: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Số điện thoại</label>
            <input className={inputCls} value={cfg.phone} onChange={(e) => set({ phone: e.target.value })} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Địa chᢁ (VI)</label>
            <input className={inputCls} value={cfg.address} onChange={(e) => set({ address: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Địa chᢁ (EN)</label>
            <input className={inputCls} value={cfg.addressEn || ''} onChange={(e) => set({ addressEn: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Copyright */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Dòng bản quyền</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Bản quyền (VI)</label>
            <input className={inputCls} value={cfg.copyright} onChange={(e) => set({ copyright: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Bản quyền (EN)</label>
            <input className={inputCls} value={cfg.copyrightEn || ''} onChange={(e) => set({ copyrightEn: e.target.value })} />
          </div>
        </div>
      </section>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu chân trang
        </Button>
      </div>
    </div>
  );
}
