'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Loader2, Trash2, Sparkles, CheckCircle2, XCircle, Clock, Send, FileText, Lightbulb, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Modal, inputCls, labelCls, AttachmentPicker, AttachmentList,
  fmtDate, fmtDateTime, userName,
  PRIORITY, TASK_STATUS, PROP_STATUS,
  type OpAttachment, type Task, type Report, type Proposal,
} from './operations-manager';
import { useStaff, StaffSelect } from './operations-tabs';

type Box = 'received' | 'sent' | 'assigned' | 'all';

function BoxSwitch({ box, setBox, options }: { box: Box; setBox: (b: Box) => void; options: { key: Box; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1">
      {options.map((o) => (
        <button key={o.key} onClick={() => setBox(o.key)}
          className={`px-3 py-1.5 text-sm rounded-md transition ${box === o.key ? 'bg-white shadow text-orange-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* TASKS TAB */
export function TasksTab({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const [box, setBox] = useState<Box>('received');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const staff = useStaff();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/operations/tasks?box=${box}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []))
      .catch(() => toast.error('Không tải được công việc'))
      .finally(() => setLoading(false));
  }, [box]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (t: Task, status: string) => {
    const res = await fetch(`/api/admin/operations/tasks/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (res.ok) { setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, status } : x)); }
    else toast.error('Cập nhật thất bại');
  };

  const removeTask = async (id: string) => {
    if (!confirm('Xóa công việc này?')) return;
    const res = await fetch(`/api/admin/operations/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Đã xóa'); load(); }
    else toast.error('Xóa thất bại');
  };

  const options: { key: Box; label: string }[] = [
    { key: 'received', label: 'Việc được giao' },
    { key: 'assigned', label: 'Việc tôi giao' },
    ...(isAdmin ? [{ key: 'all' as Box, label: 'Tất cả' }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <BoxSwitch box={box} setBox={setBox} options={options} />
        <Button onClick={() => setModalOpen(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" /> Giao việc
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có công việc nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const st = TASK_STATUS[t.status] || TASK_STATUS.todo;
            const pr = PRIORITY[t.priority] || PRIORITY.normal;
            const canEdit = isAdmin || t.assignerId === userId;
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{t.title}</span>
                      <span className={`text-[11px] rounded-full px-2 py-0.5 ${pr.cls}`}>{pr.label}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 ${st.cls}`}>{st.label}</span>
                    </div>
                    {t.description && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{t.description}</p>}
                    <div className="text-xs text-gray-400 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Người giao: {userName(t.assigner)}</span>
                      <span>Người nhận: {userName(t.assignee)}</span>
                      {t.dueDate && <span>Hạn: {fmtDate(t.dueDate)}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => removeTask(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
                {(t.assigneeId === userId || isAdmin) && (
                  <div className="flex gap-2 mt-3">
                    {['todo', 'in_progress', 'done'].map((s) => (
                      <button key={s} onClick={() => setStatus(t, s)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition ${t.status === s ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        {TASK_STATUS[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && <TaskModal staff={staff} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); if (box !== 'received') load(); else setBox('assigned'); }} />}
    </div>
  );
}

function TaskModal({ staff, onClose, onSaved }: { staff: any[]; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !assigneeId) { toast.error('Nhập tiêu đề và chọn người nhận'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/operations/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description, assigneeId, priority, dueDate: dueDate || null }),
    });
    setSaving(false);
    if (res.ok) { toast.success('Đã giao việc'); onSaved(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Lưu thất bại'); }
  };

  return (
    <Modal title="Giao việc mới" onClose={onClose}>
      <div className="space-y-4">
        <div><label className={labelCls}>Tiêu đề *</label><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className={labelCls}>Mô tả</label><textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><label className={labelCls}>Người nhận *</label><StaffSelect value={assigneeId} onChange={setAssigneeId} staff={staff} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Mức ưu tiên</label>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Thấp</option><option value="normal">Bình thường</option>
              <option value="high">Cao</option><option value="urgent">Khẩn</option>
            </select>
          </div>
          <div><label className={labelCls}>Hạn hoàn thành</label><input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Giao việc</Button>
        </div>
      </div>
    </Modal>
  );
}

/* REPORTS TAB */
export function ReportsTab({ userId, isAdmin, canSummarize }: { userId: string; isAdmin: boolean; canSummarize: boolean }) {
  const [box, setBox] = useState<Box>('received');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const staff = useStaff();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/operations/reports?box=${box}`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .catch(() => toast.error('Không tải được báo cáo'))
      .finally(() => setLoading(false));
  }, [box]);
  useEffect(() => { load(); }, [load]);

  const summarize = async (r: Report) => {
    setSummarizing(r.id);
    try {
      const res = await fetch(`/api/admin/operations/reports/${r.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'summarize' }),
      });
      const d = await res.json();
      if (res.ok) { setReports((prev) => prev.map((x) => x.id === r.id ? { ...x, aiSummary: d.report.aiSummary } : x)); toast.success('Đã tóm tắt bằng AI'); }
      else toast.error(d.error || 'Tóm tắt thất bại');
    } catch { toast.error('Tóm tắt thất bại'); }
    finally { setSummarizing(null); }
  };

  const removeReport = async (id: string) => {
    if (!confirm('Xóa báo cáo này?')) return;
    const res = await fetch(`/api/admin/operations/reports/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Đã xóa'); load(); }
    else toast.error('Xóa thất bại');
  };

  const options: { key: Box; label: string }[] = [
    { key: 'received', label: 'Nhận được' },
    { key: 'sent', label: 'Tôi gửi' },
    ...(isAdmin ? [{ key: 'all' as Box, label: 'Tất cả' }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <BoxSwitch box={box} setBox={setBox} options={options} />
        <Button onClick={() => setModalOpen(true)} className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> Tạo báo cáo</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có báo cáo nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-900">{r.title}</span>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{r.content}</p>
                  <AttachmentList items={r.attachmentsList || []} />
                  <div className="text-xs text-gray-400 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Người gửi: {userName(r.author)}</span>
                    {r.toUser && <span>Gửi đến: {userName(r.toUser)}</span>}
                    <span>{fmtDateTime(r.createdAt)}</span>
                  </div>
                </div>
                {(isAdmin || r.authorId === userId) && (
                  <button onClick={() => removeReport(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>

              {r.aiSummary && (
                <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-purple-700 text-xs font-medium mb-1"><Sparkles className="w-3.5 h-3.5" /> Tóm tắt bằng AI</div>
                  <p className="text-sm text-purple-900 whitespace-pre-wrap">{r.aiSummary}</p>
                </div>
              )}

              {canSummarize && (
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => summarize(r)} disabled={summarizing === r.id}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50">
                    {summarizing === r.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {r.aiSummary ? 'Tóm tắt lại' : 'AI tóm tắt (gồm file)'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && <ReportModal staff={staff} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); setBox('sent'); }} />}
    </div>
  );
}

function ReportModal({ staff, onClose, onSaved }: { staff: any[]; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [files, setFiles] = useState<OpAttachment[]>([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Nhập tiêu đề và nội dung'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/operations/reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), content: content.trim(), toUserId: toUserId || null, attachments: files }),
    });
    setSaving(false);
    if (res.ok) { toast.success('Đã gửi báo cáo'); onSaved(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Lưu thất bại'); }
  };

  return (
    <Modal title="Tạo báo cáo công việc" onClose={onClose} wide>
      <div className="space-y-4">
        <div><label className={labelCls}>Tiêu đề *</label><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className={labelCls}>Nội dung *</label><textarea className={inputCls} rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nhập nội dung báo cáo bằng đánh máy..." /></div>
        <div><label className={labelCls}>Gửi đến (cấp trên)</label><StaffSelect value={toUserId} onChange={setToUserId} staff={staff} placeholder="— Không gửi ai cụ thể —" /></div>
        <div><label className={labelCls}>File đính kèm</label><AttachmentPicker files={files} setFiles={setFiles} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Send className="w-4 h-4 mr-2" /> Gửi báo cáo</Button>
        </div>
      </div>
    </Modal>
  );
}

/* PROPOSALS TAB */
export function ProposalsTab({ userId, isAdmin, canSummarize }: { userId: string; isAdmin: boolean; canSummarize: boolean }) {
  const [box, setBox] = useState<Box>('received');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const staff = useStaff();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/operations/proposals?box=${box}`)
      .then((r) => r.json())
      .then((d) => setProposals(d.proposals || []))
      .catch(() => toast.error('Không tải được đề xuất'))
      .finally(() => setLoading(false));
  }, [box]);
  useEffect(() => { load(); }, [load]);

  const decide = async (p: Proposal, decision: 'approved' | 'rejected') => {
    const note = decision === 'rejected' ? (prompt('Lý do từ chối (không bắt buộc):') || '') : (prompt('Ghi chú duyệt (không bắt buộc):') || '');
    const res = await fetch(`/api/admin/operations/proposals/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decision', decision, decisionNote: note }),
    });
    if (res.ok) { toast.success(decision === 'approved' ? 'Đã duyệt' : 'Đã từ chối'); load(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Thất bại'); }
  };

  const summarize = async (p: Proposal) => {
    setSummarizing(p.id);
    try {
      const res = await fetch(`/api/admin/operations/proposals/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'summarize' }),
      });
      const d = await res.json();
      if (res.ok) { setProposals((prev) => prev.map((x) => x.id === p.id ? { ...x, aiSummary: d.proposal.aiSummary } : x)); toast.success('Đã tóm tắt bằng AI'); }
      else toast.error(d.error || 'Tóm tắt thất bại');
    } catch { toast.error('Tóm tắt thất bại'); }
    finally { setSummarizing(null); }
  };

  const removeProposal = async (id: string) => {
    if (!confirm('Xóa đề xuất này?')) return;
    const res = await fetch(`/api/admin/operations/proposals/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Đã xóa'); load(); }
    else toast.error('Xóa thất bại');
  };

  const options: { key: Box; label: string }[] = [
    { key: 'received', label: 'Cần tôi duyệt' },
    { key: 'sent', label: 'Tôi đề xuất' },
    ...(isAdmin ? [{ key: 'all' as Box, label: 'Tất cả' }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <BoxSwitch box={box} setBox={setBox} options={options} />
        <Button onClick={() => setModalOpen(true)} className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> Tạo đề xuất</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Lightbulb className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có đề xuất nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => {
            const st = PROP_STATUS[p.status] || PROP_STATUS.pending;
            const StIcon = st.icon;
            const canDecide = (p.approverId === userId || isAdmin) && p.status === 'pending';
            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{p.title}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 ${st.cls}`}><StIcon className="w-3 h-3" /> {st.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{p.content}</p>
                    <AttachmentList items={p.attachmentsList || []} />
                    <div className="text-xs text-gray-400 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Người đề xuất: {userName(p.proposer)}</span>
                      <span>Người duyệt: {userName(p.approver)}</span>
                      <span>{fmtDateTime(p.createdAt)}</span>
                    </div>
                    {p.decisionNote && <p className="text-xs text-gray-500 mt-1 italic">Ghi chú: {p.decisionNote}</p>}
                  </div>
                  {(isAdmin || p.proposerId === userId) && (
                    <button onClick={() => removeProposal(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>

                {p.aiSummary && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-purple-700 text-xs font-medium mb-1"><Sparkles className="w-3.5 h-3.5" /> Tóm tắt bằng AI</div>
                    <p className="text-sm text-purple-900 whitespace-pre-wrap">{p.aiSummary}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {canDecide && (
                    <>
                      <Button size="sm" onClick={() => decide(p, 'approved')} className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-4 h-4 mr-1.5" /> Duyệt</Button>
                      <Button size="sm" onClick={() => decide(p, 'rejected')} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"><XCircle className="w-4 h-4 mr-1.5" /> Từ chối</Button>
                    </>
                  )}
                  {canSummarize && (
                    <Button variant="outline" size="sm" onClick={() => summarize(p)} disabled={summarizing === p.id} className="border-purple-300 text-purple-700 hover:bg-purple-50">
                      {summarizing === p.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      {p.aiSummary ? 'Tóm tắt lại' : 'AI tóm tắt (gồm file)'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && <ProposalModal staff={staff} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); setBox('sent'); }} />}
    </div>
  );
}

function ProposalModal({ staff, onClose, onSaved }: { staff: any[]; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [approverId, setApproverId] = useState('');
  const [files, setFiles] = useState<OpAttachment[]>([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !content.trim() || !approverId) { toast.error('Nhập tiêu đề, nội dung và chọn người duyệt'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/operations/proposals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), content: content.trim(), approverId, attachments: files }),
    });
    setSaving(false);
    if (res.ok) { toast.success('Đã gửi đề xuất'); onSaved(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Lưu thất bại'); }
  };

  return (
    <Modal title="Tạo đề xuất" onClose={onClose} wide>
      <div className="space-y-4">
        <div><label className={labelCls}>Tiêu đề *</label><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className={labelCls}>Nội dung đề xuất *</label><textarea className={inputCls} rows={6} value={content} onChange={(e) => setContent(e.target.value)} /></div>
        <div><label className={labelCls}>Người phê duyệt *</label><StaffSelect value={approverId} onChange={setApproverId} staff={staff} /></div>
        <div><label className={labelCls}>File đính kèm</label><AttachmentPicker files={files} setFiles={setFiles} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Send className="w-4 h-4 mr-2" /> Gửi đề xuất</Button>
        </div>
      </div>
    </Modal>
  );
}
