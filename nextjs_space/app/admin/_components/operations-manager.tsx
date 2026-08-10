'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Network, ClipboardList, FileText, Lightbulb, Settings2,
  Plus, X, Loader2, Trash2, Pencil, Paperclip, Sparkles, Download,
  ChevronRight, CheckCircle2, XCircle, Clock, Send, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { OrgChartTab, SettingsTab } from './operations-tabs';
import { TasksTab, ReportsTab, ProposalsTab } from './operations-tabs2';

/* ─────────────── types ─────────────── */
export interface OpAttachment { name: string; path: string; type: string; size: number }
export interface StaffUser { id: string; name: string | null; email: string; role: string }
export interface Position {
  id: string; title: string; parentId: string | null; userId: string | null;
  canUseAiSummary: boolean; order: number;
  user?: { id: string; name: string | null; email: string; role: string } | null;
}
export type UserLite = { id: string; name: string | null; email: string } | null;
export interface Task {
  id: string; title: string; description: string | null; assignerId: string; assigneeId: string;
  status: string; priority: string; dueDate: string | null; createdAt: string;
  assigner?: UserLite; assignee?: UserLite;
}
export interface Report {
  id: string; authorId: string; toUserId: string | null; title: string; content: string;
  attachments: string | null; aiSummary: string | null; createdAt: string;
  author?: UserLite; toUser?: UserLite; attachmentsList?: OpAttachment[];
}
export interface Proposal {
  id: string; proposerId: string; approverId: string; title: string; content: string;
  attachments: string | null; status: string; decisionNote: string | null; aiSummary: string | null;
  decidedAt: string | null; createdAt: string;
  proposer?: UserLite; approver?: UserLite; attachmentsList?: OpAttachment[];
}

type SubTab = 'org' | 'tasks' | 'reports' | 'proposals' | 'settings';

const SUBTABS: { key: SubTab; label: string; icon: any }[] = [
  { key: 'org', label: 'Sơ đồ tổ chức', icon: Network },
  { key: 'tasks', label: 'Giao việc', icon: ClipboardList },
  { key: 'reports', label: 'Báo cáo', icon: FileText },
  { key: 'proposals', label: 'Đề xuất', icon: Lightbulb },
  { key: 'settings', label: 'Cài đặt', icon: Settings2 },
];

export const PRIORITY: Record<string, { label: string; cls: string }> = {
  low: { label: 'Thấp', cls: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Bình thường', cls: 'bg-blue-100 text-blue-700' },
  high: { label: 'Cao', cls: 'bg-amber-100 text-amber-800' },
  urgent: { label: 'Khẩn', cls: 'bg-red-100 text-red-700' },
};
export const TASK_STATUS: Record<string, { label: string; cls: string; icon: any }> = {
  todo: { label: 'Chưa làm', cls: 'bg-gray-100 text-gray-700', icon: Clock },
  in_progress: { label: 'Đang làm', cls: 'bg-blue-100 text-blue-700', icon: Clock },
  done: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};
export const PROP_STATUS: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Đã duyệt', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Từ chối', cls: 'bg-red-100 text-red-700', icon: XCircle },
};

export function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
}
export function fmtDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
}
export function fmtSize(n: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
export function userName(u: UserLite | undefined) { return (u && (u.name || u.email)) || 'Không rõ'; }

/* ─────────────── attachment helpers ─────────────── */
export async function uploadAttachment(file: File): Promise<OpAttachment> {
  const res = await fetch('/api/admin/operations/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Tải lên thất bại');
  }
  const { uploadUrl, cloud_storage_path } = await res.json();
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });
  if (!put.ok) throw new Error('Tải file lên thất bại');
  return { name: file.name, path: cloud_storage_path, type: file.type || 'application/octet-stream', size: file.size };
}

export async function downloadAttachment(att: OpAttachment) {
  try {
    const res = await fetch(`/api/admin/operations/download?path=${encodeURIComponent(att.path)}&type=${encodeURIComponent(att.type)}`);
    if (!res.ok) throw new Error();
    const { url } = await res.json();
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    toast.error('Không mở được file đính kèm');
  }
}

/* Reusable attachment picker used in report/proposal forms */
export function AttachmentPicker({ files, setFiles }: { files: OpAttachment[]; setFiles: (f: OpAttachment[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setUploading(true);
    try {
      const uploaded: OpAttachment[] = [];
      for (const f of list) {
        if (f.size > 100 * 1024 * 1024) { toast.error(`${f.name} vượt quá 100MB`); continue; }
        uploaded.push(await uploadAttachment(f));
      }
      setFiles([...files, ...uploaded]);
      if (uploaded.length) toast.success('Đã tải lên file đính kèm');
    } catch (err: any) {
      toast.error(err.message || 'Tải lên thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Paperclip className="w-4 h-4 mr-2" />}
        Đính kèm file
      </Button>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
              <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate flex-1">{f.name}</span>
              <span className="text-xs text-gray-400">{fmtSize(f.size)}</span>
              <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AttachmentList({ items }: { items: OpAttachment[] }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((f, i) => (
        <button key={i} onClick={() => downloadAttachment(f)}
          className="inline-flex items-center gap-1.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1 hover:bg-orange-100">
          <Download className="w-3.5 h-3.5" />
          <span className="truncate max-w-[180px]">{f.name}</span>
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';
export const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

/* ═══════════════ main component ═══════════════ */
export function OperationsManager({ userId, role }: { userId: string; role: string }) {
  const [sub, setSub] = useState<SubTab>('org');
  const isAdmin = role === 'admin';
  const [canSummarize, setCanSummarize] = useState(isAdmin);

  // Check whether current user has AI-summary permission (for report/proposal buttons).
  useEffect(() => {
    if (isAdmin) { setCanSummarize(true); return; }
    fetch('/api/admin/operations/positions')
      .then((r) => r.json())
      .then((d) => {
        const mine = (d.positions || []).some((p: Position) => p.userId === userId && p.canUseAiSummary);
        setCanSummarize(mine);
      })
      .catch(() => {});
  }, [isAdmin, userId]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Network className="w-6 h-6 text-orange-500" /> Điều hành
        </h2>
        <p className="text-gray-500 text-sm mt-1">Sơ đồ tổ chức, giao việc, báo cáo, phê duyệt đề xuất và cấu hình quyền dùng AI tóm tắt.</p>
      </div>

      {/* sub-tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
        {SUBTABS.map((s) => {
          if (s.key === 'settings' && !isAdmin) return null;
          const Icon = s.icon;
          const active = sub === s.key;
          return (
            <button key={s.key} onClick={() => setSub(s.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${active ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Icon className="w-4 h-4" /> {s.label}
            </button>
          );
        })}
      </div>

      {sub === 'org' && <OrgChartTab isAdmin={isAdmin} />}
      {sub === 'tasks' && <TasksTab userId={userId} isAdmin={isAdmin} />}
      {sub === 'reports' && <ReportsTab userId={userId} isAdmin={isAdmin} canSummarize={canSummarize} />}
      {sub === 'proposals' && <ProposalsTab userId={userId} isAdmin={isAdmin} canSummarize={canSummarize} />}
      {sub === 'settings' && isAdmin && <SettingsTab />}
    </div>
  );
}
