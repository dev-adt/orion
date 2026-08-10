'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { X, Loader2, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CategoryManagerProps {
  onClose: () => void;
  onSaved: () => void;
}

export function CategoryManager({ onClose, onSaved }: CategoryManagerProps) {
  const { locale } = useTranslation();
  const vi = locale === 'vi';

  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // add form
  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');

  // inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCats(data?.categories ?? []);
    } catch {
      toast.error(vi ? 'Không tải được danh mục' : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error(vi ? 'Vui lòng nhập tên danh mục' : 'Please enter a category name');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), nameEn: newNameEn.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'error');
      toast.success(vi ? 'Đã thêm danh mục' : 'Category added');
      setNewName('');
      setNewNameEn('');
      await load();
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || (vi ? 'Thêm thất bại' : 'Failed to add'));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (c: any) => {
    setEditId(c.id);
    setEditName(c.name ?? '');
    setEditNameEn(c.nameEn ?? '');
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) {
      toast.error(vi ? 'Tên không được để trống' : 'Name cannot be empty');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), nameEn: editNameEn.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'error');
      toast.success(vi ? 'Đã cập nhật' : 'Updated');
      setEditId(null);
      await load();
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || (vi ? 'Cập nhật thất bại' : 'Failed to update'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(vi ? `Xóa danh mục "${c.name}"?` : `Delete category "${c.name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'error');
      toast.success(vi ? 'Đã xóa danh mục' : 'Category deleted');
      await load();
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || (vi ? 'Xóa thất bại' : 'Failed to delete'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold">{vi ? 'Quản lý danh mục' : 'Manage categories'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Add form */}
          <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
            <div className="text-sm font-semibold">{vi ? 'Thêm danh mục mới' : 'Add new category'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={vi ? 'Tên (tiếng Việt) *' : 'Name (Vietnamese) *'}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={vi ? 'Tên (tiếng Anh)' : 'Name (English)'}
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
              />
            </div>
            <Button className="gap-2" size="sm" onClick={handleAdd} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {vi ? 'Thêm' : 'Add'}
            </Button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cats.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              {vi ? 'Chưa có danh mục nào' : 'No categories yet'}
            </div>
          ) : (
            <div className="space-y-1">
              {cats.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border p-2">
                  {editId === c.id ? (
                    <>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder={vi ? 'Tên (tiếng Việt)' : 'Name (VI)'}
                        />
                        <input
                          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                          value={editNameEn}
                          onChange={(e) => setEditNameEn(e.target.value)}
                          placeholder={vi ? 'Tên (tiếng Anh)' : 'Name (EN)'}
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleRename(c.id)} disabled={busy}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditId(null)} disabled={busy}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{vi ? c.name : (c.nameEn ?? c.name)}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(vi ? (c.nameEn ?? '') : c.name)}{' '}
                          <span className="ml-1">· {c?._count?.products ?? 0} {vi ? 'sp' : 'items'}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}