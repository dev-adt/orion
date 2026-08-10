'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Network, Plus, Loader2, Trash2, Pencil, Sparkles, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Modal, inputCls, labelCls,
  type StaffUser, type Position,
} from './operations-manager';

/* shared: staff hook & select */
export function useStaff() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  useEffect(() => {
    fetch('/api/admin/projects/staff')
      .then((r) => r.json())
      .then((d) => setStaff(d.users || []))
      .catch(() => {});
  }, []);
  return staff;
}

export function StaffSelect({ value, onChange, staff, placeholder, excludeId }: {
  value: string; onChange: (v: string) => void; staff: StaffUser[]; placeholder?: string; excludeId?: string;
}) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder || '— Chọn —'}</option>
      {staff.filter((s) => s.id !== excludeId).map((s) => (
        <option key={s.id} value={s.id}>{s.name || s.email}</option>
      ))}
    </select>
  );
}

/* ORG CHART TAB */
export function OrgChartTab({ isAdmin }: { isAdmin: boolean }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const staff = useStaff();

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/operations/positions')
      .then((r) => r.json())
      .then((d) => setPositions(d.positions || []))
      .catch(() => toast.error('Không tải được sơ đồ tổ chức'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const roots = positions.filter((p) => !p.parentId || !positions.some((q) => q.id === p.parentId));
  const childrenOf = (id: string) => positions.filter((p) => p.parentId === id);

  const removePos = async (id: string) => {
    if (!confirm('Xóa vị trí này? Các vị trí cấp dưới sẽ được chuyển lên cấp trên.')) return;
    const res = await fetch(`/api/admin/operations/positions/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Đã xóa vị trí'); load(); }
    else toast.error('Xóa thất bại');
  };

  const renderNode = (p: Position, depth: number): JSX.Element => {
    const kids = childrenOf(p.id);
    return (
      <div key={p.id} className="space-y-2">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm" style={{ marginLeft: depth * 24 }}>
          {depth > 0 && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{p.title}</span>
              {p.canUseAiSummary && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">
                  <Sparkles className="w-3 h-3" /> AI tóm tắt
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 truncate">{p.user ? (p.user.name || p.user.email) : 'Chưa gán nhân sự'}</div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setEditing(p); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-orange-500" title="Sửa"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => removePos(p.id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Xóa"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        {kids.map((k) => renderNode(k, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Xây dựng cây tổ chức: mỗi vị trí có thể gán một nhân sự và có cấp trên.</p>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> Thêm vị trí
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : positions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Network className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có sơ đồ tổ chức. {isAdmin ? "Nhấn 'Thêm vị trí' để bắt đầu." : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">{roots.map((r) => renderNode(r, 0))}</div>
      )}

      {modalOpen && (
        <PositionModal position={editing} positions={positions} staff={staff}
          onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />
      )}
    </div>
  );
}

function PositionModal({ position, positions, staff, onClose, onSaved }: {
  position: Position | null; positions: Position[]; staff: StaffUser[]; onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(position?.title || '');
  const [parentId, setParentId] = useState(position?.parentId || '');
  const [assignedUserId, setAssignedUserId] = useState(position?.userId || '');
  const [canAi, setCanAi] = useState(position?.canUseAiSummary || false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { toast.error('Nhập tên vị trí'); return; }
    setSaving(true);
    const payload = { title: title.trim(), parentId: parentId || null, userId: assignedUserId || null, canUseAiSummary: canAi };
    const url = position ? `/api/admin/operations/positions/${position.id}` : '/api/admin/operations/positions';
    const method = position ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { toast.success(position ? 'Đã cập nhật' : 'Đã thêm vị trí'); onSaved(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Lưu thất bại'); }
  };

  return (
    <Modal title={position ? 'Sửa vị trí' : 'Thêm vị trí'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Tên vị trí *</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Giám đốc, Trưởng phòng Kinh doanh..." />
        </div>
        <div>
          <label className={labelCls}>Cấp trên trực tiếp</label>
          <select className={inputCls} value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— Không (cấp cao nhất) —</option>
            {positions.filter((p) => p.id !== position?.id).map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Nhân sự đảm nhiệm</label>
          <StaffSelect value={assignedUserId} onChange={setAssignedUserId} staff={staff} placeholder="— Chưa gán —" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={canAi} onChange={(e) => setCanAi(e.target.checked)} className="rounded border-gray-300 text-orange-500 focus:ring-orange-400" />
          <span className="inline-flex items-center gap-1"><Sparkles className="w-4 h-4 text-purple-500" /> Cho phép dùng AI tóm tắt báo cáo cấp dưới</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Lưu
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* SETTINGS TAB */
export function SettingsTab() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/operations/positions')
      .then((r) => r.json())
      .then((d) => setPositions(d.positions || []))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (p: Position) => {
    setSavingId(p.id);
    const res = await fetch(`/api/admin/operations/positions/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canUseAiSummary: !p.canUseAiSummary }),
    });
    setSavingId(null);
    if (res.ok) setPositions((prev) => prev.map((x) => x.id === p.id ? { ...x, canUseAiSummary: !x.canUseAiSummary } : x));
    else toast.error('Cập nhật thất bại');
  };

  return (
    <div>
      <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
        <div className="text-sm text-purple-900">
          <p className="font-medium">Phân quyền dùng AI tóm tắt</p>
          <p className="text-purple-700 mt-0.5">Bật cho các vị trí lãnh đạo để họ có thể dùng AI tóm tắt nội dung báo cáo/đề xuất của cấp dưới, bao gồm cả file đính kèm. Quản trị viên luôn có quyền này.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : positions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">Chưa có vị trí nào. Hãy tạo sơ đồ tổ chức trước.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {positions.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{p.title}</div>
                <div className="text-sm text-gray-500 truncate">{p.user ? (p.user.name || p.user.email) : 'Chưa gán nhân sự'}</div>
              </div>
              <button onClick={() => toggle(p)} disabled={savingId === p.id}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${p.canUseAiSummary ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${p.canUseAiSummary ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
