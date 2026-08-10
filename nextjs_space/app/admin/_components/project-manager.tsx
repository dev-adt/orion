'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, ArrowLeft, Loader2, Trash2, Users, TrendingUp,
  Calendar, CheckCircle2, Clock, PauseCircle, Target,
  UserPlus, MessageSquarePlus, Crown, Flag, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/* ── types ── */
interface ProjectRow {
  id: string; name: string; description: string | null; ownerId: string;
  ownerName: string; progress: number; expectedRevenue: number; status: string;
  startDate: string; dueDate: string | null; completedAt: string | null;
  createdAt: string; memberCount: number; updateCount: number;
}
interface Member { id: string; userId: string; role: string; name: string; email: string; userRole: string }
interface Update { id: string; authorId: string; authorName: string; content: string; progress: number | null; createdAt: string }
interface ProjectDetail extends ProjectRow { members: Member[]; updates: Update[] }
interface StaffUser { id: string; name: string | null; email: string; role: string }

const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị',
  web_designer: 'Thiết kế web',
  sales: 'Kinh doanh',
  marketing: 'Marketing',
  accountant: 'Kế toán',
  customer: 'Khách hàng',
};
function roleLabel(r?: string) { return (r && ROLE_LABEL[r]) || r || 'Khác'; }

const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  active: { label: 'Đang triển khai', cls: 'bg-blue-100 text-blue-800', icon: Clock },
  on_hold: { label: 'Tạm dừng', cls: 'bg-amber-100 text-amber-800', icon: PauseCircle },
  completed: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-800', icon: CheckCircle2 },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
}
function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 100 ? 'bg-green-500' : value >= 50 ? 'bg-blue-500' : 'bg-amber-500';
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function ProjectManager({ userId, role }: { userId: string; role: string }) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [staff, setStaff] = useState<StaffUser[]>([]);

  // create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', expectedRevenue: '', dueDate: '', memberIds: [] as string[] });
  const [creating, setCreating] = useState(false);

  // update form
  const [updateText, setUpdateText] = useState('');
  const [updateProgress, setUpdateProgress] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);

  // add member (detail view)
  const [addMemberId, setAddMemberId] = useState('');
  const [memberTab, setMemberTab] = useState<'dept' | 'individual'>('dept');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<StaffUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // create form individual search
  const [createTab, setCreateTab] = useState<'dept' | 'individual'>('dept');
  const [createUserSearch, setCreateUserSearch] = useState('');
  const [createUserResults, setCreateUserResults] = useState<StaffUser[]>([]);
  const [createSearching, setCreateSearching] = useState(false);
  const [pickedUsers, setPickedUsers] = useState<StaffUser[]>([]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/projects?${params}`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch { toast.error('Lỗi tải danh sách dự án'); }
    setLoading(false);
  }, [statusFilter]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/projects/staff');
      const data = await res.json();
      setStaff(data.users || []);
    } catch {}
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}`);
      const data = await res.json();
      setDetail(data.project || null);
    } catch { toast.error('Lỗi tải chi tiết'); }
    setDetailLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => { loadStaff(); }, [loadStaff]);

  const openDetail = (id: string) => { setSelectedId(id); setView('detail'); loadDetail(id); };

  const createProject = async () => {
    if (!createForm.name.trim()) { toast.error('Nhập tên dự án'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name, description: createForm.description,
          expectedRevenue: parseFloat(createForm.expectedRevenue) || 0,
          dueDate: createForm.dueDate || null,
          memberIds: Array.from(new Set([...createForm.memberIds, ...pickedUsers.map(u => u.id)])),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ name: '', description: '', expectedRevenue: '', dueDate: '', memberIds: [] });
        setPickedUsers([]); setCreateUserSearch(''); setCreateUserResults([]); setCreateTab('dept');
        loadProjects();
        toast.success('Đã tạo dự án');
      } else { toast.error('Lỗi tạo dự án'); }
    } catch { toast.error('Lỗi tạo dự án'); }
    setCreating(false);
  };

  const postUpdate = async () => {
    if (!updateText.trim() || !selectedId) return;
    setPostingUpdate(true);
    try {
      const res = await fetch(`/api/admin/projects/${selectedId}/updates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updateText, progress: updateProgress }),
      });
      if (res.ok) {
        setUpdateText(''); setUpdateProgress('');
        loadDetail(selectedId);
        toast.success('Đã cập nhật tiến độ');
      }
    } catch { toast.error('Lỗi cập nhật'); }
    setPostingUpdate(false);
  };

  const patchProject = async (data: any, msg?: string) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/projects/${selectedId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { loadDetail(selectedId); loadProjects(); if (msg) toast.success(msg); }
    } catch { toast.error('Lỗi cập nhật'); }
  };

  const addMember = async (uid?: string) => {
    const targetId = uid || addMemberId;
    if (!targetId || !selectedId) return;
    try {
      const res = await fetch(`/api/admin/projects/${selectedId}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId }),
      });
      if (res.ok) {
        setAddMemberId('');
        setUserSearch(''); setUserResults([]);
        loadDetail(selectedId); loadProjects(); toast.success('Đã thêm thành viên');
      }
      else { const d = await res.json(); toast.error(d.error || 'Lỗi'); }
    } catch { toast.error('Lỗi thêm thành viên'); }
  };

  // Search any user in the system (individual add) — detail view
  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setUserResults([]); return; }
    setSearchingUsers(true);
    try {
      const res = await fetch(`/api/admin/projects/staff?scope=all&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setUserResults(data.users || []);
    } catch {} finally { setSearchingUsers(false); }
  }, []);

  // Search any user in the system — create form
  const searchCreateUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setCreateUserResults([]); return; }
    setCreateSearching(true);
    try {
      const res = await fetch(`/api/admin/projects/staff?scope=all&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCreateUserResults(data.users || []);
    } catch {} finally { setCreateSearching(false); }
  }, []);

  // debounce individual-user searches
  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch, searchUsers]);
  useEffect(() => {
    const t = setTimeout(() => searchCreateUsers(createUserSearch), 300);
    return () => clearTimeout(t);
  }, [createUserSearch, searchCreateUsers]);

  const removeMember = async (uid: string) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/projects/${selectedId}/members`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      if (res.ok) { loadDetail(selectedId); loadProjects(); toast.success('Đã gỡ thành viên'); }
      else { const d = await res.json(); toast.error(d.error || 'Lỗi'); }
    } catch { toast.error('Lỗi gỡ thành viên'); }
  };

  const deleteProject = async (id: string, ownerId: string) => {
    if (role !== 'admin' && ownerId !== userId) { toast.error('Chỉ chủ dự án hoặc admin mới xóa được'); return; }
    if (!confirm('Xóa dự án này? Hành động không thể hoàn tác.')) return;
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa dự án');
        setView('list'); setDetail(null); setSelectedId(null); loadProjects();
      } else { const d = await res.json(); toast.error(d.error || 'Lỗi'); }
    } catch { toast.error('Lỗi xóa'); }
  };

  const availableStaff = staff.filter(s => !detail?.members.some(m => m.userId === s.id));

  /* ───── RENDER ───── */
  return (
    <div className="space-y-4">
      {view === 'list' && (
        <div className="space-y-4">
          {/* header */}
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="flex gap-2 items-center">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang triển khai</option>
                <option value="on_hold">Tạm dừng</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Tạo dự án
            </Button>
          </div>

          {/* summary cards */}
          {!loading && projects.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <Target className="w-5 h-5 text-blue-600 mb-1" />
                <div className="text-2xl font-bold text-blue-700">{projects.length}</div>
                <div className="text-xs text-blue-600">Tổng dự án</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <Clock className="w-5 h-5 text-amber-600 mb-1" />
                <div className="text-2xl font-bold text-amber-700">{projects.filter(p => p.status === 'active').length}</div>
                <div className="text-xs text-amber-600">Đang triển khai</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 mb-1" />
                <div className="text-2xl font-bold text-green-700">{projects.filter(p => p.status === 'completed').length}</div>
                <div className="text-xs text-green-600">Hoàn thành</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <DollarSign className="w-5 h-5 text-purple-600 mb-1" />
                <div className="text-lg font-bold text-purple-700">{formatPrice(projects.reduce((s, p) => s + p.expectedRevenue, 0))}</div>
                <div className="text-xs text-purple-600">Doanh thu dự kiến</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Chưa có dự án nào. Nhấn “Tạo dự án” để bắt đầu.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(p => {
                const st = STATUS_MAP[p.status] || STATUS_MAP.active;
                const StIcon = st.icon;
                const overdue = p.dueDate && p.status !== 'completed' && new Date(p.dueDate) < new Date();
                return (
                  <div key={p.id} onClick={() => openDetail(p.id)}
                    className="bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{p.name}</h3>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${st.cls}`}>
                        <StIcon className="w-3 h-3" />{st.label}
                      </span>
                    </div>
                    {p.description && <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>}
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Tiến độ</span><span className="font-medium">{p.progress}%</span>
                      </div>
                      <ProgressBar value={p.progress} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-600"><Users className="w-4 h-4" />{p.memberCount}</span>
                      <span className="font-medium text-purple-700">{formatPrice(p.expectedRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                      <span className="flex items-center gap-1"><Crown className="w-3 h-3" />{p.ownerName}</span>
                      {p.dueDate && (
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                          <Calendar className="w-3 h-3" />{formatDate(p.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════ DETAIL ════ */}
      {view === 'detail' && (
        <div className="space-y-6">
          <button onClick={() => { setView('list'); setDetail(null); setSelectedId(null); }}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>

          {detailLoading || !detail ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* left column */}
              <div className="space-y-4">
                <div className="bg-white border rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{detail.name}</h2>
                    {(role === 'admin' || detail.ownerId === userId) && (
                      <button onClick={() => deleteProject(detail.id, detail.ownerId)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {detail.description && <p className="text-sm text-gray-600">{detail.description}</p>}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Crown className="w-4 h-4 text-amber-500" /> Chủ dự án: <span className="font-medium text-gray-700">{detail.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Flag className="w-3 h-3" /> Bắt đầu {formatDate(detail.startDate)}</span>
                    {detail.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Hạn {formatDate(detail.dueDate)}</span>}
                  </div>
                </div>

                {/* status control */}
                <div className="bg-white border rounded-xl p-5 space-y-3">
                  <h4 className="font-medium text-gray-700">Trạng thái</h4>
                  <div className="flex gap-2 flex-wrap">
                    {(['active', 'on_hold', 'completed'] as const).map(s => {
                      const m = STATUS_MAP[s];
                      const active = detail.status === s;
                      return (
                        <button key={s} onClick={() => patchProject({ status: s }, s === 'completed' ? 'Đã đóng dự án' : 'Đã cập nhật trạng thái')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            active ? m.cls + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                  {detail.status === 'completed' && detail.completedAt && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đóng lúc {formatDateTime(detail.completedAt)}
                    </p>
                  )}
                </div>

                {/* progress & revenue */}
                <div className="bg-white border rounded-xl p-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Tiến độ hoàn thành</span>
                      <span className="font-semibold">{detail.progress}%</span>
                    </div>
                    <ProgressBar value={detail.progress} />
                    <input type="range" min={0} max={100} step={5} value={detail.progress}
                      onChange={e => setDetail(d => d ? { ...d, progress: parseInt(e.target.value) } : d)}
                      onMouseUp={e => patchProject({ progress: parseInt((e.target as HTMLInputElement).value) })}
                      onTouchEnd={e => patchProject({ progress: detail.progress })}
                      className="w-full mt-2" disabled={detail.status === 'completed'} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-1 mb-1"><TrendingUp className="w-4 h-4" /> Doanh thu dự kiến</label>
                    <div className="flex gap-2">
                      <input type="number" defaultValue={detail.expectedRevenue}
                        onBlur={e => { const v = parseFloat(e.target.value) || 0; if (v !== detail.expectedRevenue) patchProject({ expectedRevenue: v }, 'Đã cập nhật doanh thu'); }}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                      <span className="flex items-center text-sm font-medium text-purple-700">{formatPrice(detail.expectedRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* members */}
                <div className="bg-white border rounded-xl p-5">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-1"><Users className="w-4 h-4" /> Thành viên ({detail.members.length})</h4>
                  <div className="space-y-2 mb-3">
                    {detail.members.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                              {m.name}
                              {m.role === 'lead' && <Crown className="w-3 h-3 text-amber-500" />}
                            </div>
                            <div className="text-xs text-gray-400">{m.email}</div>
                          </div>
                        </div>
                        {m.role !== 'lead' && (
                          <button onClick={() => removeMember(m.userId)} className="text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {(role === 'admin' || detail.ownerId === userId) && (
                    <div className="border-t pt-3">
                      {/* mode toggle */}
                      <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setMemberTab('dept')}
                          className={`flex-1 text-xs font-medium rounded-md py-1.5 transition ${memberTab === 'dept' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          Theo phòng ban
                        </button>
                        <button
                          onClick={() => setMemberTab('individual')}
                          className={`flex-1 text-xs font-medium rounded-md py-1.5 transition ${memberTab === 'individual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          Cá nhân
                        </button>
                      </div>

                      {memberTab === 'dept' && (
                        availableStaff.length > 0 ? (
                          <div className="flex gap-2">
                            <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)}
                              className="flex-1 border rounded-lg px-2 py-1.5 text-sm bg-white">
                              <option value="">+ Chọn nhân viên theo phòng...</option>
                              {Object.entries(
                                availableStaff.reduce((acc, s) => {
                                  (acc[s.role] ||= []).push(s); return acc;
                                }, {} as Record<string, StaffUser[]>)
                              ).map(([r, list]) => (
                                <optgroup key={r} label={roleLabel(r)}>
                                  {list.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                                </optgroup>
                              ))}
                            </select>
                            <Button size="sm" onClick={() => addMember()} disabled={!addMemberId}><UserPlus className="w-4 h-4" /></Button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Tất cả nhân viên đã tham gia dự án.</p>
                        )
                      )}

                      {memberTab === 'individual' && (
                        <div>
                          <input
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            placeholder="Tìm theo tên hoặc email..."
                            className="w-full border rounded-lg px-3 py-1.5 text-sm"
                          />
                          <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                            {searchingUsers && <div className="flex items-center gap-2 text-xs text-gray-400 p-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang tìm...</div>}
                            {!searchingUsers && userSearch.trim() && userResults.filter(u => !detail.members.some(m => m.userId === u.id)).length === 0 && (
                              <p className="text-xs text-gray-400 p-1">Không tìm thấy người dùng phù hợp.</p>
                            )}
                            {userResults.filter(u => !detail.members.some(m => m.userId === u.id)).map(u => (
                              <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 hover:bg-gray-100">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-800 truncate">{u.name || u.email}</div>
                                  <div className="text-xs text-gray-400 truncate">{u.email} · {roleLabel(u.role)}</div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => addMember(u.id)}><UserPlus className="w-4 h-4" /></Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* right column: updates timeline */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border rounded-xl p-5">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <MessageSquarePlus className="w-4 h-4 text-blue-500" /> Cập nhật tình trạng
                  </h4>
                  {detail.status !== 'completed' ? (
                    <div className="space-y-2 mb-4">
                      <textarea placeholder="Thành viên cập nhật tiến độ, công việc đã làm..."
                        value={updateText} onChange={e => setUpdateText(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
                      <div className="flex gap-2 items-center">
                        <input type="number" min={0} max={100} placeholder="Tiến độ % (tuỳ chọn)"
                          value={updateProgress} onChange={e => setUpdateProgress(e.target.value)}
                          className="w-40 border rounded-lg px-3 py-2 text-sm" />
                        <Button size="sm" onClick={postUpdate} disabled={postingUpdate || !updateText.trim()}>
                          {postingUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi cập nhật'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-4">Dự án đã đóng — không thể thêm cập nhật.</p>
                  )}

                  {/* timeline */}
                  <div className="space-y-3">
                    {detail.updates.length === 0 && <p className="text-sm text-gray-400">Chưa có cập nhật nào</p>}
                    {detail.updates.map(u => (
                      <div key={u.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                          <div className="flex-1 w-px bg-gray-200" />
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="text-sm text-gray-800">{u.content}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400">{u.authorName} — {formatDateTime(u.createdAt)}</span>
                            {u.progress !== null && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Tiến độ → {u.progress}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ CREATE MODAL ════ */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Tạo dự án mới</h3>
                <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Tên dự án *</label>
                  <input type="text" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="VD: Triển khai website khách hàng A" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mô tả</label>
                  <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={3} placeholder="Mục tiêu, phạm vi công việc..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Doanh thu dự kiến (đ)</label>
                    <input type="number" value={createForm.expectedRevenue} onChange={e => setCreateForm(f => ({ ...f, expectedRevenue: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Hạn hoàn thành</label>
                    <input type="date" value={createForm.dueDate} onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Thành viên tham gia</label>
                  {/* mode toggle */}
                  <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-1">
                    <button type="button"
                      onClick={() => setCreateTab('dept')}
                      className={`flex-1 text-xs font-medium rounded-md py-1.5 transition ${createTab === 'dept' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      Theo phòng ban
                    </button>
                    <button type="button"
                      onClick={() => setCreateTab('individual')}
                      className={`flex-1 text-xs font-medium rounded-md py-1.5 transition ${createTab === 'individual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      Cá nhân
                    </button>
                  </div>

                  {createTab === 'dept' && (
                    <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                      {staff.filter(s => s.id !== userId).length === 0 && <p className="text-xs text-gray-400 p-1">Không có nhân viên khác</p>}
                      {Object.entries(
                        staff.filter(s => s.id !== userId).reduce((acc, s) => {
                          (acc[s.role] ||= []).push(s); return acc;
                        }, {} as Record<string, StaffUser[]>)
                      ).map(([r, list]) => (
                        <div key={r}>
                          <div className="text-[11px] font-semibold text-gray-400 uppercase px-1 pt-1">{roleLabel(r)}</div>
                          {list.map(s => {
                            const checked = createForm.memberIds.includes(s.id);
                            return (
                              <label key={s.id} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={checked}
                                  onChange={e => setCreateForm(f => ({
                                    ...f,
                                    memberIds: e.target.checked ? [...f.memberIds, s.id] : f.memberIds.filter(x => x !== s.id),
                                  }))} />
                                <span>{s.name || s.email}</span>
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {createTab === 'individual' && (
                    <div>
                      <input
                        value={createUserSearch}
                        onChange={e => setCreateUserSearch(e.target.value)}
                        placeholder="Tìm theo tên hoặc email..."
                        className="w-full border rounded-lg px-3 py-1.5 text-sm"
                      />
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                        {createSearching && <div className="flex items-center gap-2 text-xs text-gray-400 p-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang tìm...</div>}
                        {!createSearching && createUserSearch.trim() && createUserResults.filter(u => u.id !== userId && !pickedUsers.some(p => p.id === u.id)).length === 0 && (
                          <p className="text-xs text-gray-400 p-1">Không tìm thấy người dùng phù hợp.</p>
                        )}
                        {createUserResults.filter(u => u.id !== userId && !pickedUsers.some(p => p.id === u.id)).map(u => (
                          <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 hover:bg-gray-100">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{u.name || u.email}</div>
                              <div className="text-xs text-gray-400 truncate">{u.email} · {roleLabel(u.role)}</div>
                            </div>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setPickedUsers(p => [...p, u])}><Plus className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pickedUsers.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Cá nhân đã chọn ({pickedUsers.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {pickedUsers.map(u => (
                          <span key={u.id} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs rounded-full pl-2.5 pr-1 py-1">
                            {u.name || u.email}
                            <button type="button" onClick={() => setPickedUsers(p => p.filter(x => x.id !== u.id))} className="hover:bg-orange-200 rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Bạn (người tạo) sẽ tự động làm chủ dự án.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Huỷ</Button>
                <Button onClick={createProject} disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />} Tạo dự án
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
