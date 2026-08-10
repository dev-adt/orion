'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Tag, Plus, X, ChevronRight, Phone, Mail, MapPin,
  ShoppingBag, MessageSquare, StickyNote, CheckCircle2,
  Clock, AlertTriangle, AlertCircle, Trash2, Loader2,
  Calendar, User, ArrowLeft, Filter, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/* ───── types ───── */
interface CrmContact {
  id: string; name: string | null; email: string; phone: string | null;
  address: string | null; createdAt: string; orderCount: number;
  totalRevenue: number; lastOrderDate: string | null;
  tags: { id: string; name: string; color: string }[];
}

interface CrmTag { id: string; name: string; color: string; _count?: { contacts: number } }

interface CrmNote { id: string; userId: string; authorId: string; authorName: string; content: string; createdAt: string }

interface CrmTask {
  id: string; userId: string | null; assignedTo: string | null;
  title: string; description: string | null; priority: string;
  status: string; dueDate: string | null; completedAt: string | null;
  createdAt: string; userName: string | null; assigneeName: string | null;
}

interface ContactDetail extends CrmContact {
  orders: any[]; reviews: any[]; notes: CrmNote[]; tasks: CrmTask[]; chatCount: number;
}

interface Lead {
  id: string; name: string | null; email: string | null; phone: string | null;
  company: string | null; message: string | null; data: Record<string, string> | null;
  source: string | null; sourceUrl: string | null; status: string; createdAt: string;
}

const LEAD_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new: { label: 'Mới', cls: 'bg-red-100 text-red-700' },
  contacted: { label: 'Đã liên hệ', cls: 'bg-blue-100 text-blue-700' },
  converted: { label: 'Đã chuyển đổi', cls: 'bg-green-100 text-green-700' },
  archived: { label: 'Lưu trữ', cls: 'bg-gray-100 text-gray-600' },
};

/* ───── helpers ───── */
const PRIORITY_MAP: Record<string, { label: string; icon: any; cls: string }> = {
  normal: { label: 'Bình thường', icon: Clock, cls: 'text-gray-500' },
  high: { label: 'Cao', icon: AlertTriangle, cls: 'text-amber-500' },
  urgent: { label: 'Khẩn cấp', icon: AlertCircle, cls: 'text-red-500' },
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Chờ xử lý', cls: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'Đang thực hiện', cls: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-800' },
};

const TAG_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316'];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
}
function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
}

/* ===== MAIN COMPONENT ===== */
export function CrmManager() {
  const [view, setView] = useState<'list' | 'detail' | 'tasks' | 'leads'>('list');
  // Leads (contact-form submissions)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadStatusFilter, setLeadStatusFilter] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadNewCount, setLeadNewCount] = useState(0);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Tasks view
  const [allTasks, setAllTasks] = useState<CrmTask[]>([]);
  const [taskFilter, setTaskFilter] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);

  // Tag management
  const [showTagMgr, setShowTagMgr] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Note input
  const [noteText, setNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Task creation
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'normal', dueDate: '' });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  /* ── data loaders ── */
  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterTag) params.set('tagId', filterTag);
      const res = await fetch(`/api/admin/crm/contacts?${params}`);
      const data = await res.json();
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
    } catch { toast.error('Lỗi tải danh sách khách hàng'); }
    setLoading(false);
  }, [page, search, filterTag]);

  const loadTags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crm/tags');
      const data = await res.json();
      setTags(data.tags || []);
    } catch {}
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/contacts/${id}`);
      const data = await res.json();
      setDetail(data.contact || null);
    } catch { toast.error('Lỗi tải thông tin'); }
    setDetailLoading(false);
  }, []);

  const loadAllTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const params = new URLSearchParams();
      if (taskFilter) params.set('status', taskFilter);
      const res = await fetch(`/api/admin/crm/tasks?${params}`);
      const data = await res.json();
      setAllTasks(data.tasks || []);
    } catch { toast.error('Lỗi tải công việc'); }
    setTasksLoading(false);
  }, [taskFilter]);

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams();
      if (leadStatusFilter) params.set('status', leadStatusFilter);
      if (leadSearch) params.set('search', leadSearch);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setLeadNewCount(data.newCount || 0);
    } catch { toast.error('Lỗi tải liên hệ'); }
    setLeadsLoading(false);
  }, [leadStatusFilter, leadSearch]);

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      loadLeads();
    } catch { toast.error('Cập nhật thất bại'); }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Xoá liên hệ này?')) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success('Đã xoá');
    } catch { toast.error('Xoá thất bại'); }
  };

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { loadTags(); }, [loadTags]);
  useEffect(() => { if (view === 'tasks') loadAllTasks(); }, [view, loadAllTasks]);
  useEffect(() => { if (view === 'leads') loadLeads(); }, [view, loadLeads]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
    loadDetail(id);
  };

  /* ── actions ── */
  const addNote = async () => {
    if (!noteText.trim() || !selectedId) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch('/api/admin/crm/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedId, content: noteText }),
      });
      if (res.ok) { setNoteText(''); loadDetail(selectedId); toast.success('Đã thêm ghi chú'); }
    } catch { toast.error('Lỗi thêm ghi chú'); }
    setNoteSubmitting(false);
  };

  const deleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/admin/crm/notes/${noteId}`, { method: 'DELETE' });
      if (selectedId) loadDetail(selectedId);
      toast.success('Đã xóa ghi chú');
    } catch { toast.error('Lỗi xóa ghi chú'); }
  };

  const addTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch('/api/admin/crm/tags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });
      if (res.ok) { setNewTagName(''); loadTags(); toast.success('Đã tạo nhãn'); }
      else { const d = await res.json(); toast.error(d.error || 'Lỗi'); }
    } catch { toast.error('Lỗi tạo nhãn'); }
  };

  const deleteTag = async (id: string) => {
    try {
      await fetch(`/api/admin/crm/tags/${id}`, { method: 'DELETE' });
      loadTags(); toast.success('Đã xóa nhãn');
    } catch { toast.error('Lỗi xóa nhãn'); }
  };

  const assignTag = async (userId: string, tagId: string) => {
    try {
      const res = await fetch(`/api/admin/crm/contacts/${userId}/tags`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      if (res.ok) { loadDetail(userId); loadContacts(); toast.success('Đã gắn nhãn'); }
      else { const d = await res.json(); toast.error(d.error || 'Lỗi'); }
    } catch { toast.error('Lỗi gắn nhãn'); }
  };

  const removeTag = async (userId: string, tagId: string) => {
    try {
      await fetch(`/api/admin/crm/contacts/${userId}/tags`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      loadDetail(userId); loadContacts(); toast.success('Đã gỡ nhãn');
    } catch { toast.error('Lỗi gỡ nhãn'); }
  };

  const createTask = async () => {
    if (!taskForm.title.trim()) return;
    setTaskSubmitting(true);
    try {
      const res = await fetch('/api/admin/crm/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskForm, userId: selectedId }),
      });
      if (res.ok) {
        setTaskForm({ title: '', description: '', priority: 'normal', dueDate: '' });
        setShowTaskForm(false);
        if (selectedId) loadDetail(selectedId);
        if (view === 'tasks') loadAllTasks();
        toast.success('Đã tạo công việc');
      }
    } catch { toast.error('Lỗi tạo công việc'); }
    setTaskSubmitting(false);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetch(`/api/admin/crm/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (selectedId) loadDetail(selectedId);
      if (view === 'tasks') loadAllTasks();
    } catch { toast.error('Lỗi cập nhật'); }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/admin/crm/tasks/${taskId}`, { method: 'DELETE' });
      if (selectedId) loadDetail(selectedId);
      if (view === 'tasks') loadAllTasks();
      toast.success('Đã xóa công việc');
    } catch { toast.error('Lỗi xóa'); }
  };

  const totalPages = Math.ceil(total / 20);

  /* ───── RENDER ───── */
  return (
    <div className="space-y-4">
      {/* Header tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => { setView('list'); setSelectedId(null); setDetail(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'list' || view === 'detail' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <User className="w-4 h-4 inline mr-1.5" />Khách hàng
        </button>
        <button
          onClick={() => setView('leads')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            view === 'leads' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-1.5" />Liên hệ
          {leadNewCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">{leadNewCount}</span>
          )}
        </button>
        <button
          onClick={() => setView('tasks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'tasks' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 inline mr-1.5" />Công việc
        </button>
        <button
          onClick={() => setShowTagMgr(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Tag className="w-4 h-4 inline mr-1.5" />Quản lý nhãn
        </button>
      </div>

      {/* ═══════ CONTACT LIST ═══════ */}
      {view === 'list' && (
        <div className="space-y-4">
          {/* Search & filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Tìm theo tên, email, SĐT..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterTag} onChange={e => { setFilterTag(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Tất cả nhãn</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Tag filter pills */}
          {filterTag && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Lọc:</span>
              {tags.filter(t => t.id === filterTag).map(t => (
                <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: t.color }}>
                  {t.name}
                  <button onClick={() => setFilterTag('')}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Không tìm thấy khách hàng nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Khách hàng</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 hidden md:table-cell">Liên hệ</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Đơn hàng</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Doanh thu</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 hidden lg:table-cell">Nhãn</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 hidden lg:table-cell">Đơn gần nhất</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openDetail(c.id)}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{c.name || '(Chưa đặt tên)'}</div>
                        <div className="text-xs text-gray-500 md:hidden">{c.email}</div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="text-gray-700">{c.email}</div>
                        {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-medium text-sm">
                          {c.orderCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatPrice(c.totalRevenue)}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {c.tags.slice(0, 3).map(t => (
                            <span key={t.id} className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: t.color }}>{t.name}</span>
                          ))}
                          {c.tags.length > 3 && <span className="text-xs text-gray-400">+{c.tags.length - 3}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 hidden lg:table-cell">{formatDate(c.lastOrderDate)}</td>
                      <td className="py-3 px-4"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{total} khách hàng</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
                <span className="px-3 py-1 text-gray-600">Trang {page}/{totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ CONTACT DETAIL ═══════ */}
      {view === 'detail' && (
        <div className="space-y-6">
          <button onClick={() => { setView('list'); setDetail(null); setSelectedId(null); }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>

          {detailLoading || !detail ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: info + stats */}
              <div className="space-y-4">
                <div className="bg-white border rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                      {(detail.name || detail.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{detail.name || '(Chưa đặt tên)'}</h3>
                      <p className="text-sm text-gray-500">Khách hàng từ {formatDate(detail.createdAt)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" />{detail.email}</div>
                    {detail.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" />{detail.phone}</div>}
                    {detail.address && <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" />{detail.address}</div>}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <ShoppingBag className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                    <div className="text-2xl font-bold text-blue-700">{detail.orderCount}</div>
                    <div className="text-xs text-blue-600">Đơn hàng</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <Hash className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <div className="text-lg font-bold text-green-700">{formatPrice(detail.totalRevenue)}</div>
                    <div className="text-xs text-green-600">Doanh thu</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white border rounded-xl p-4">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1"><Tag className="w-4 h-4" /> Nhãn</h4>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {detail.tags.map(t => (
                      <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white" style={{ backgroundColor: t.color }}>
                        {t.name}
                        <button onClick={() => removeTag(detail.id, t.id)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {detail.tags.length === 0 && <span className="text-xs text-gray-400">Chưa có nhãn</span>}
                  </div>
                  {/* Add tag */}
                  {tags.filter(t => !detail.tags.some(dt => dt.id === t.id)).length > 0 && (
                    <select
                      onChange={e => { if (e.target.value) { assignTag(detail.id, e.target.value); e.target.value = ''; } }}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white"
                      defaultValue=""
                    >
                      <option value="" disabled>+ Gắn nhãn...</option>
                      {tags.filter(t => !detail.tags.some(dt => dt.id === t.id)).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Chat count */}
                <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium text-gray-900">{detail.chatCount} phiên chat</div>
                    <div className="text-xs text-gray-500">Lịch sử trao đổi</div>
                  </div>
                </div>
              </div>

              {/* Right: notes, tasks, orders */}
              <div className="lg:col-span-2 space-y-6">
                {/* Notes */}
                <div className="bg-white border rounded-xl p-5">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <StickyNote className="w-4 h-4 text-amber-500" /> Ghi chú
                  </h4>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text" placeholder="Thêm ghi chú..."
                      value={noteText} onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addNote()}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <Button size="sm" onClick={addNote} disabled={noteSubmitting || !noteText.trim()}>
                      {noteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detail.notes.length === 0 && <p className="text-sm text-gray-400">Chưa có ghi chú</p>}
                    {detail.notes.map(n => (
                      <div key={n.id} className="bg-amber-50 rounded-lg p-3 text-sm group">
                        <div className="flex justify-between items-start">
                          <p className="text-gray-800">{n.content}</p>
                          <button onClick={() => deleteNote(n.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{n.authorName} — {formatDateTime(n.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tasks for this contact */}
                <div className="bg-white border rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" /> Công việc
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => setShowTaskForm(!showTaskForm)}>
                      <Plus className="w-4 h-4 mr-1" /> Thêm
                    </Button>
                  </div>

                  {showTaskForm && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                      <input type="text" placeholder="Tiêu đề công việc" value={taskForm.title}
                        onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm" />
                      <textarea placeholder="Mô tả (tuỳ chọn)" value={taskForm.description}
                        onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
                      <div className="flex gap-2">
                        <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                          className="border rounded-lg px-2 py-1.5 text-sm bg-white">
                          <option value="normal">Bình thường</option>
                          <option value="high">Cao</option>
                          <option value="urgent">Khẩn cấp</option>
                        </select>
                        <input type="date" value={taskForm.dueDate}
                          onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                          className="border rounded-lg px-2 py-1.5 text-sm" />
                        <Button size="sm" onClick={createTask} disabled={taskSubmitting}>
                          {taskSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detail.tasks.length === 0 && <p className="text-sm text-gray-400">Chưa có công việc</p>}
                    {detail.tasks.map(t => (
                      <TaskRow key={t.id} task={t} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
                    ))}
                  </div>
                </div>

                {/* Order history */}
                <div className="bg-white border rounded-xl p-5">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-green-500" /> Lịch sử đơn hàng ({detail.orders.length})
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {detail.orders.length === 0 && <p className="text-sm text-gray-400">Chưa có đơn hàng</p>}
                    {detail.orders.map((o: any) => (
                      <div key={o.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">#{o.id.slice(-6).toUpperCase()}</span>
                          <span className="font-medium text-green-700">{formatPrice(o.total)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            o.status === 'completed' ? 'bg-green-100 text-green-800'
                              : o.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {o.status === 'completed' ? 'Hoàn thành' : o.status === 'pending' ? 'Chờ xử lý' : o.status}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(o.createdAt)}</span>
                        </div>
                        {o.items?.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            {o.items.map((it: any, i: number) => (
                              <span key={i}>{it.product?.name} x{it.quantity}{i < o.items.length - 1 ? ', ' : ''}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                {detail.reviews && detail.reviews.length > 0 && (
                  <div className="bg-white border rounded-xl p-5">
                    <h4 className="font-medium text-gray-700 mb-3">Đánh giá ({detail.reviews.length})</h4>
                    <div className="space-y-2">
                      {detail.reviews.map((r: any) => (
                        <div key={r.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            <span className="text-gray-500">— {r.product?.name}</span>
                          </div>
                          {r.comment && <p className="text-gray-700 mt-1">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ LEADS (CONTACT FORM) ═══════ */}
      {view === 'leads' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Tìm theo tên, email, SĐT, công ty..."
                value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Tất cả trạng thái</option>
              <option value="new">Mới</option>
              <option value="contacted">Đã liên hệ</option>
              <option value="converted">Đã chuyển đổi</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>

          {leadsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Chưa có liên hệ nào từ biểu mẫu.</div>
          ) : (
            <div className="space-y-2">
              {leads.map(l => {
                const st = LEAD_STATUS_MAP[l.status] || LEAD_STATUS_MAP.new;
                const isOpen = expandedLead === l.id;
                return (
                  <div key={l.id} className="border rounded-xl bg-white overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{l.name || '(Không tên)'}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mt-1">
                          {l.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{l.email}</span>}
                          {l.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</span>}
                          {l.company && <span>{l.company}</span>}
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateTime(l.createdAt)}</span>
                          {l.source && <span className="italic">{l.source}</span>}
                        </div>
                      </div>
                      <select value={l.status} onChange={e => updateLeadStatus(l.id, e.target.value)}
                        className="border rounded-lg px-2 py-1.5 text-xs bg-white">
                        <option value="new">Mới</option>
                        <option value="contacted">Đã liên hệ</option>
                        <option value="converted">Đã chuyển đổi</option>
                        <option value="archived">Lưu trữ</option>
                      </select>
                      <button onClick={() => setExpandedLead(isOpen ? null : l.id)} className="text-blue-600 text-xs font-medium hover:underline whitespace-nowrap">
                        {isOpen ? 'Ẩn' : 'Chi tiết'}
                      </button>
                      <button onClick={() => deleteLead(l.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    {isOpen && (
                      <div className="border-t bg-gray-50 px-4 py-3 text-sm">
                        <table className="w-full">
                          <tbody>
                            {l.data && Object.keys(l.data).length > 0 ? (
                              Object.entries(l.data).map(([k, v]) => (
                                <tr key={k} className="border-b border-gray-100 last:border-0">
                                  <td className="py-1.5 pr-4 font-medium text-gray-600 align-top whitespace-nowrap">{k}</td>
                                  <td className="py-1.5 text-gray-800 whitespace-pre-wrap">{v}</td>
                                </tr>
                              ))
                            ) : (
                              <tr><td className="py-1.5 text-gray-500">{l.message || 'Không có dữ liệu chi tiết.'}</td></tr>
                            )}
                            {l.sourceUrl && (
                              <tr><td className="py-1.5 pr-4 font-medium text-gray-600">Trang</td><td className="py-1.5 text-gray-800">{l.sourceUrl}</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════ ALL TASKS ═══════ */}
      {view === 'tasks' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center flex-wrap">
            <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
            </select>
            <Button size="sm" variant="outline" onClick={() => { setShowTaskForm(!showTaskForm); setSelectedId(null); }}>
              <Plus className="w-4 h-4 mr-1" /> Tạo công việc mới
            </Button>
          </div>

          {showTaskForm && (
            <div className="bg-gray-50 border rounded-xl p-4 space-y-2">
              <input type="text" placeholder="Tiêu đề công việc" value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Mô tả (tuỳ chọn)" value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              <div className="flex gap-2 flex-wrap">
                <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                  className="border rounded-lg px-2 py-1.5 text-sm bg-white">
                  <option value="normal">Bình thường</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khẩn cấp</option>
                </select>
                <input type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="border rounded-lg px-2 py-1.5 text-sm" />
                <Button size="sm" onClick={createTask} disabled={taskSubmitting}>
                  {taskSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowTaskForm(false)}>Huỷ</Button>
              </div>
            </div>
          )}

          {tasksLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : allTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Chưa có công việc nào</div>
          ) : (
            <div className="space-y-2">
              {allTasks.map(t => (
                <TaskRow key={t.id} task={t} onStatusChange={updateTaskStatus} onDelete={deleteTask} showContact />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAG MANAGER MODAL ═══════ */}
      <AnimatePresence>
        {showTagMgr && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTagMgr(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Quản lý nhãn CRM</h3>
                <button onClick={() => setShowTagMgr(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {/* New tag */}
              <div className="flex gap-2">
                <input type="text" placeholder="Tên nhãn mới" value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <div className="flex gap-1">
                  {TAG_COLORS.map(c => (
                    <button key={c} className={`w-6 h-6 rounded-full border-2 ${
                      newTagColor === c ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`} style={{ backgroundColor: c }} onClick={() => setNewTagColor(c)} />
                  ))}
                </div>
                <Button size="sm" onClick={addTag}><Plus className="w-4 h-4" /></Button>
              </div>

              {/* Existing tags */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tags.length === 0 && <p className="text-sm text-gray-400">Chưa có nhãn nào</p>}
                {tags.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-gray-400">{t._count?.contacts || 0} KH</span>
                    </div>
                    <button onClick={() => deleteTag(t.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Task Row sub-component ── */
function TaskRow({ task, onStatusChange, onDelete, showContact }: {
  task: CrmTask; onStatusChange: (id: string, s: string) => void;
  onDelete: (id: string) => void; showContact?: boolean;
}) {
  const pri = PRIORITY_MAP[task.priority] || PRIORITY_MAP.normal;
  const st = STATUS_MAP[task.status] || STATUS_MAP.pending;
  const PriIcon = pri.icon;
  const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date();

  return (
    <div className={`bg-white border rounded-lg p-3 text-sm flex items-start gap-3 group ${
      isOverdue ? 'border-red-200 bg-red-50/50' : ''
    }`}>
      {/* Status toggle */}
      <button
        onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'completed')}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </div>
        {task.description && <p className="text-gray-500 text-xs mt-0.5">{task.description}</p>}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs ${st.cls}`}>{st.label}</span>
          <span className={`flex items-center gap-0.5 text-xs ${pri.cls}`}>
            <PriIcon className="w-3 h-3" />{pri.label}
          </span>
          {task.dueDate && (
            <span className={`flex items-center gap-0.5 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              <Calendar className="w-3 h-3" />{formatDate(task.dueDate)}
            </span>
          )}
          {showContact && task.userName && (
            <span className="text-xs text-gray-500">KH: {task.userName}</span>
          )}
          {task.assigneeName && (
            <span className="text-xs text-gray-400">→ {task.assigneeName}</span>
          )}
        </div>
      </div>

      <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
