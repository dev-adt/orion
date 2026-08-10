'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageEditor } from './page-editor';
import {
  Plus, Pencil, Trash2, Home, Eye, EyeOff, ExternalLink, Loader2, Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  categories: any[];
  initialEditId?: string | null;
  onConsumedInitialEdit?: () => void;
}

export function PageManager({ categories, initialEditId, onConsumedInitialEdit }: Props) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pages');
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-open a specific page editor when arriving via deep-link (?editPage=)
  useEffect(() => {
    if (!initialEditId || pages.length === 0) return;
    const p = pages.find((x: any) => x.id === initialEditId);
    if (p) {
      setEditing(p);
      onConsumedInitialEdit?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditId, pages]);

  const patch = async (id: string, body: any) => {
    try {
      const res = await fetch('/api/admin/pages/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('patch failed');
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Cập nhật thất bại');
    }
  };

  const setHomepage = async (id: string) => {
    await patch(id, { isHomepage: true, published: true });
    toast.success('Đã đặt làm trang chủ');
  };
  const togglePublished = async (p: any) => {
    await patch(p.id, { published: !p.published });
  };
  const remove = async (p: any) => {
    if (!confirm('Xóa trang "' + p.title + '"?')) return;
    try {
      const res = await fetch('/api/admin/pages/' + p.id, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      toast.success('Đã xóa trang');
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Xóa thất bại');
    }
  };

  if (editing || creating) {
    return (
      <PageEditor
        page={editing}
        categories={categories}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSaved={() => { setEditing(null); setCreating(false); load(); }}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Trang (Pages)</h2>
          <p className="text-sm text-muted-foreground">Tạo trang giới thiệu, liên hệ, landing... và chọn bất kỳ trang nào làm trang chủ.</p>
        </div>
        <Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Tạo trang</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Chưa có trang nào. Nhấn "Tạo trang" để bắt đầu.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Tiêu đề</th>
                <th className="px-4 py-3 font-medium">Đường dẫn</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      {p.isHomepage ? <span title="Trang chủ" className="inline-flex items-center gap-1 text-primary"><Home className="h-4 w-4" /></span> : null}
                      {p.title}
                    </div>
                    {p.showInMenu ? <span className="text-[11px] text-muted-foreground">Hiển thị trên menu</span> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">/trang/{p.slug}</td>
                  <td className="px-4 py-3">
                    <span className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ' + (p.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground')}>
                      {p.published ? 'Xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {!p.isHomepage ? (
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => setHomepage(p.id)} title="Đặt làm trang chủ">
                          <Star className="h-4 w-4" /> Trang chủ
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => togglePublished(p)} title={p.published ? 'Ẩn' : 'Xuất bản'}>
                        {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <a href={'/trang/' + p.slug} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent" title="Xem"><ExternalLink className="h-4 w-4" /></a>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(p)} title="Sửa"><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => remove(p)} title="Xóa"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
