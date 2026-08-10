'use client';

import { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ASSIGNABLE_ROLES, ROLE_LABELS, Role } from '@/lib/roles';

interface UserRow {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  phone?: string | null;
  createdAt?: string;
}

export function UserManagement({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; password: string; role: Role }>({
    name: '',
    email: '',
    password: '',
    role: 'sales',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const j = await res.json();
      if (res.ok) setUsers(j?.users ?? []);
    } catch {
      toast.error('Không tải được danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      toast.error('Nhập email và mật khẩu');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (res.ok) {
        toast.success('Đã tạo tài khoản');
        setForm({ name: '', email: '', password: '', role: 'sales' });
        load();
      } else {
        toast.error(j?.error ?? 'Không tạo được');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setCreating(false);
    }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      const res = await fetch('/api/admin/users/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
        toast.success('Đã cập nhật vai trò');
      } else {
        toast.error('Không cập nhật được');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Xóa tài khoản này?')) return;
    try {
      const res = await fetch('/api/admin/users/' + id, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast.success('Đã xóa');
      } else {
        toast.error(j?.error ?? 'Không xóa được');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Quản lý tài khoản & phân quyền
          </h2>
          <p className="text-sm text-muted-foreground">Tạo nhân viên và gán vai trò trong hệ thống</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={'h-4 w-4 mr-1 ' + (loading ? 'animate-spin' : '')} /> Làm mới
        </Button>
      </div>

      <div className="border rounded-lg p-4 mb-4 bg-muted/30">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1"><UserPlus className="h-4 w-4" /> Thêm tài khoản mới</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="text" placeholder="Họ tên" value={form.name} onChange={(e: any) => setForm((f) => ({ ...f, name: e.target.value }))} className="px-3 py-2 text-sm border rounded-lg bg-background" />
          <input type="email" placeholder="Email" value={form.email} onChange={(e: any) => setForm((f) => ({ ...f, email: e.target.value }))} className="px-3 py-2 text-sm border rounded-lg bg-background" />
          <input type="text" placeholder="Mật khẩu" value={form.password} onChange={(e: any) => setForm((f) => ({ ...f, password: e.target.value }))} className="px-3 py-2 text-sm border rounded-lg bg-background" />
          <select value={form.role} onChange={(e: any) => setForm((f) => ({ ...f, role: e.target.value as Role }))} className="px-3 py-2 text-sm border rounded-lg bg-background">
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r].vi}</option>
            ))}
          </select>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={createUser} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />} Tạo tài khoản
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Tên</th>
                <th className="text-left px-3 py-2 font-medium">Email</th>
                <th className="text-left px-3 py-2 font-medium">Vai trò</th>
                <th className="text-right px-3 py-2 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.name ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-2">
                    <select value={u.role} onChange={(e: any) => changeRole(u.id, e.target.value)} className="px-2 py-1 text-xs border rounded-lg bg-background">
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r].vi}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {u.id !== currentUserId && (
                      <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:text-red-700 p-1" title="Xóa">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
