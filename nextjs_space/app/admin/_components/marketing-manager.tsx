'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Loader2, Trash2, Megaphone, Ticket, TrendingUp, DollarSign,
  Target, MousePointerClick, Users, Percent, Power, PowerOff, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/* ── types ── */
interface Campaign {
  id: string; name: string; channel: string; objective: string | null;
  budget: number; status: string; startDate: string | null; endDate: string | null;
  reach: number; clicks: number; conversions: number; revenue: number; createdAt: string;
}
interface Coupon {
  id: string; code: string; description: string | null; discountType: string;
  discountValue: number; usageLimit: number | null; usageCount: number;
  active: boolean; expiresAt: string | null; createdAt: string;
}

const CHANNELS: Record<string, string> = {
  email: 'Email', facebook: 'Facebook', google: 'Google Ads',
  tiktok: 'TikTok', sms: 'SMS', zalo: 'Zalo', other: 'Khác',
};
const CAMPAIGN_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Nháp', cls: 'bg-gray-100 text-gray-700' },
  active: { label: 'Đang chạy', cls: 'bg-blue-100 text-blue-800' },
  paused: { label: 'Tạm dừng', cls: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Kết thúc', cls: 'bg-green-100 text-green-800' },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
}
function roi(revenue: number, budget: number) {
  if (!budget || budget <= 0) return null;
  return ((revenue - budget) / budget) * 100;
}

export function MarketingManager() {
  const [sub, setSub] = useState<'campaigns' | 'coupons'>('campaigns');

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSub('campaigns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${sub === 'campaigns' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          <Megaphone className="h-4 w-4" /> Chiến dịch
        </button>
        <button
          onClick={() => setSub('coupons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${sub === 'coupons' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          <Ticket className="h-4 w-4" /> Mã giảm giá
        </button>
      </div>

      {sub === 'campaigns' ? <CampaignsPanel /> : <CouponsPanel />}
    </div>
  );
}

/* ══════════════ CAMPAIGNS ══════════════ */
function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns${statusFilter ? `?status=${statusFilter}` : ''}`);
      const data = await res.json();
      if (res.ok) setCampaigns(data.campaigns || []);
    } catch { toast.error('Không tải được chiến dịch'); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const avgRoi = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : null;

  return (
    <div>
      {/* summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng ngân sách', value: formatPrice(totalBudget), icon: DollarSign, color: 'text-blue-500' },
          { label: 'Tổng doanh thu', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'text-green-500' },
          { label: 'ROI trung bình', value: avgRoi === null ? '—' : `${avgRoi.toFixed(0)}%`, icon: Percent, color: avgRoi !== null && avgRoi < 0 ? 'text-red-500' : 'text-purple-500' },
          { label: 'Đang chạy', value: activeCount, icon: Megaphone, color: 'text-amber-500' },
        ].map((s, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="active">Đang chạy</option>
          <option value="paused">Tạm dừng</option>
          <option value="completed">Kết thúc</option>
        </select>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Tạo chiến dịch</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Chưa có chiến dịch nào.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map(c => {
            const r = roi(c.revenue, c.budget);
            return (
              <div key={c.id} className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{CHANNELS[c.channel] || c.channel}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CAMPAIGN_STATUS[c.status]?.cls || 'bg-gray-100'}`}>{CAMPAIGN_STATUS[c.status]?.label || c.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setEditing(c)} className="text-muted-foreground hover:text-primary p-1" title="Sửa / cập nhật kết quả"><Pencil className="h-4 w-4" /></button>
                </div>

                {c.objective && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.objective}</p>}

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Ngân sách</p><p className="font-medium">{formatPrice(c.budget)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Doanh thu</p><p className="font-medium">{formatPrice(c.revenue)}</p></div>
                  <div><p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Tiếp cận</p><p className="font-medium">{c.reach.toLocaleString('vi-VN')}</p></div>
                  <div><p className="text-xs text-muted-foreground flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> Lượt nhấp</p><p className="font-medium">{c.clicks.toLocaleString('vi-VN')}</p></div>
                  <div><p className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> Chuyển đổi</p><p className="font-medium">{c.conversions.toLocaleString('vi-VN')}</p></div>
                  <div><p className="text-xs text-muted-foreground">ROI</p><p className={`font-semibold ${r === null ? '' : r < 0 ? 'text-red-500' : 'text-green-600'}`}>{r === null ? '—' : `${r.toFixed(0)}%`}</p></div>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span>{formatDate(c.startDate)} – {formatDate(c.endDate)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CampaignModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} />}
      {editing && <CampaignModal campaign={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function CampaignModal({ campaign, onClose, onSaved }: { campaign?: Campaign; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!campaign;
  const [name, setName] = useState(campaign?.name || '');
  const [channel, setChannel] = useState(campaign?.channel || 'email');
  const [objective, setObjective] = useState(campaign?.objective || '');
  const [budget, setBudget] = useState(String(campaign?.budget ?? ''));
  const [status, setStatus] = useState(campaign?.status || 'draft');
  const [startDate, setStartDate] = useState(campaign?.startDate ? campaign.startDate.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(campaign?.endDate ? campaign.endDate.slice(0, 10) : '');
  const [reach, setReach] = useState(String(campaign?.reach ?? ''));
  const [clicks, setClicks] = useState(String(campaign?.clicks ?? ''));
  const [conversions, setConversions] = useState(String(campaign?.conversions ?? ''));
  const [revenue, setRevenue] = useState(String(campaign?.revenue ?? ''));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error('Nhập tên chiến dịch'); return; }
    setSaving(true);
    try {
      const payload: any = { name, channel, objective, budget, status, startDate: startDate || null, endDate: endDate || null };
      if (isEdit) { payload.reach = reach; payload.clicks = clicks; payload.conversions = conversions; payload.revenue = revenue; }
      const res = await fetch(isEdit ? `/api/admin/marketing/campaigns/${campaign!.id}` : '/api/admin/marketing/campaigns', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { toast.success(isEdit ? 'Đã cập nhật' : 'Đã tạo chiến dịch'); onSaved(); }
      else { const d = await res.json(); toast.error(d.error || 'Lỗi'); }
    } catch { toast.error('Lỗi kết nối'); }
    setSaving(false);
  };

  const del = async () => {
    if (!campaign || !confirm('Xóa chiến dịch này?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${campaign.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Đã xóa'); onSaved(); } else toast.error('Không xóa được');
    } catch { toast.error('Lỗi kết nối'); }
    setSaving(false);
  };

  const field = 'w-full border rounded-lg px-3 py-2 text-sm bg-background';

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{isEdit ? 'Cập nhật chiến dịch' : 'Tạo chiến dịch'}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>

          <div className="space-y-3">
            <div><label className="text-sm font-medium">Tên chiến dịch *</label><input className={field} value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Kênh</label><select className={field} value={channel} onChange={e => setChannel(e.target.value)}>{Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="text-sm font-medium">Trạng thái</label><select className={field} value={status} onChange={e => setStatus(e.target.value)}><option value="draft">Nháp</option><option value="active">Đang chạy</option><option value="paused">Tạm dừng</option><option value="completed">Kết thúc</option></select></div>
            </div>
            <div><label className="text-sm font-medium">Mục tiêu</label><textarea className={field} rows={2} value={objective} onChange={e => setObjective(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Ngân sách (đ)</label><input type="number" className={field} value={budget} onChange={e => setBudget(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Bắt đầu</label><input type="date" className={field} value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><label className="text-sm font-medium">Kết thúc</label><input type="date" className={field} value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>

            {isEdit && (
              <div className="pt-3 border-t">
                <p className="text-sm font-semibold mb-2">Kết quả thực tế</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm">Tiếp cận</label><input type="number" className={field} value={reach} onChange={e => setReach(e.target.value)} /></div>
                  <div><label className="text-sm">Lượt nhấp</label><input type="number" className={field} value={clicks} onChange={e => setClicks(e.target.value)} /></div>
                  <div><label className="text-sm">Chuyển đổi</label><input type="number" className={field} value={conversions} onChange={e => setConversions(e.target.value)} /></div>
                  <div><label className="text-sm">Doanh thu (đ)</label><input type="number" className={field} value={revenue} onChange={e => setRevenue(e.target.value)} /></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            {isEdit ? <Button variant="ghost" onClick={del} disabled={saving} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4 mr-1" /> Xóa</Button> : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
              <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{isEdit ? 'Lưu' : 'Tạo'}</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ══════════════ COUPONS ══════════════ */
function CouponsPanel() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/coupons');
      const data = await res.json();
      if (res.ok) setCoupons(data.coupons || []);
    } catch { toast.error('Không tải được mã giảm giá'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/admin/marketing/coupons/${c.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active }),
      });
      if (res.ok) { load(); } else toast.error('Lỗi');
    } catch { toast.error('Lỗi kết nối'); }
  };

  const del = async (c: Coupon) => {
    if (!confirm(`Xóa mã ${c.code}?`)) return;
    try {
      const res = await fetch(`/api/admin/marketing/coupons/${c.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Đã xóa'); load(); } else toast.error('Không xóa được');
    } catch { toast.error('Lỗi kết nối'); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Tạo mã giảm giá</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Ticket className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Chưa có mã giảm giá nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Giảm</th>
                <th className="px-4 py-3 font-medium">Sử dụng</th>
                <th className="px-4 py-3 font-medium">Hết hạn</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold">{c.code}</span>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">{c.discountType === 'percent' ? `${c.discountValue}%` : formatPrice(c.discountValue)}</td>
                  <td className="px-4 py-3">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="px-4 py-3">{formatDate(c.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{c.active ? 'Đang bật' : 'Tắt'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleActive(c)} className="text-muted-foreground hover:text-primary p-1" title={c.active ? 'Tắt' : 'Bật'}>{c.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</button>
                      <button onClick={() => del(c)} className="text-muted-foreground hover:text-red-500 p-1" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CouponModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function CouponModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!code.trim()) { toast.error('Nhập mã'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/marketing/coupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, description, discountType, discountValue, usageLimit: usageLimit || null, expiresAt: expiresAt || null }),
      });
      if (res.ok) { toast.success('Đã tạo mã'); onSaved(); }
      else { const d = await res.json(); toast.error(d.error || 'Lỗi'); }
    } catch { toast.error('Lỗi kết nối'); }
    setSaving(false);
  };

  const field = 'w-full border rounded-lg px-3 py-2 text-sm bg-background';

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="bg-card rounded-2xl w-full max-w-md p-6" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tạo mã giảm giá</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Mã (VD: SALE2026) *</label><input className={`${field} font-mono uppercase`} value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></div>
            <div><label className="text-sm font-medium">Mô tả</label><input className={field} value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Loại giảm</label><select className={field} value={discountType} onChange={e => setDiscountType(e.target.value)}><option value="percent">Theo %</option><option value="fixed">Số tiền</option></select></div>
              <div><label className="text-sm font-medium">Giá trị</label><input type="number" className={field} value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === 'percent' ? '%' : 'đ'} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Giới hạn lượt</label><input type="number" className={field} value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="Không giới hạn" /></div>
              <div><label className="text-sm font-medium">Hết hạn</label><input type="date" className={field} value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Tạo</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
