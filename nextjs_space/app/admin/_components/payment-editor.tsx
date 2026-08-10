'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Loader2, Save, QrCode, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  PAYMENT_SETTING_KEY,
  defaultPaymentConfig,
  parsePaymentConfig,
  buildVietQrUrl,
  paymentDescription,
  bankByBin,
  VIETQR_BANKS,
  type PaymentConfig,
} from '@/lib/payment-config';

const inputCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const lbl = 'block text-sm font-medium text-foreground mb-1.5';

const SAMPLE_AMOUNT = 100000;
const SAMPLE_ORDER = 'DEMO123';

export function PaymentEditor() {
  const [cfg, setCfg] = useState<PaymentConfig>(() => defaultPaymentConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const raw = d?.settings?.[PAYMENT_SETTING_KEY];
        if (raw) setCfg(parsePaymentConfig(raw));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (patch: Partial<PaymentConfig>) => setCfg((prev) => ({ ...prev, ...patch }));

  const bank = bankByBin(cfg.bankBin);
  const qrUrl = useMemo(
    () => buildVietQrUrl(cfg, SAMPLE_AMOUNT, SAMPLE_ORDER),
    [cfg.bankBin, cfg.accountNumber, cfg.accountName, cfg.prefix],
  );
  const sampleContent = paymentDescription(cfg.prefix, SAMPLE_ORDER);

  const save = async () => {
    if (cfg.enabled) {
      if (!cfg.accountNumber.trim()) { toast.error('Nhập số tài khoản'); return; }
      if (!cfg.accountName.trim()) { toast.error('Nhập tên chủ tài khoản'); return; }
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { [PAYMENT_SETTING_KEY]: JSON.stringify(cfg) } }),
      });
      if (res.ok) toast.success('Đã lưu cấu hình cổng thanh toán');
      else toast.error('Lưu thất bại');
    } catch { toast.error('Lỗi kết nối'); }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Cổng thanh toán</h2>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Lưu thay đổi
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Khai báo tài khoản nhận tiền. Hệ thống tự sinh mã QR chuyển khoản theo từng đơn hàng (đúng số tiền &amp; nội dung đối soát).
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          <label className="flex items-center gap-3 p-4 rounded-xl border bg-card cursor-pointer">
            <input
              type="checkbox"
              checked={cfg.enabled}
              onChange={(e) => set({ enabled: e.target.checked })}
              className="h-5 w-5 rounded accent-primary"
            />
            <span className="font-medium">Bật thanh toán chuyển khoản / VietQR</span>
          </label>

          <div>
            <label className={lbl}>Ngân hàng</label>
            <select
              value={cfg.bankBin}
              onChange={(e) => set({ bankBin: e.target.value })}
              className={inputCls}
            >
              {VIETQR_BANKS.map((b) => (
                <option key={b.bin} value={b.bin}>{b.short} — {b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={lbl}>Số tài khoản</label>
            <input
              value={cfg.accountNumber}
              onChange={(e) => set({ accountNumber: e.target.value.replace(/[^0-9]/g, '') })}
              className={inputCls}
              placeholder="Ví dụ: 19036730021017"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className={lbl}>Tên chủ tài khoản</label>
            <input
              value={cfg.accountName}
              onChange={(e) => set({ accountName: e.target.value })}
              className={inputCls}
              placeholder="Ví dụ: CÔNG TY CỔ PHẦN ORION QUỐC TẾ"
            />
            <p className="text-xs text-muted-foreground mt-1">Nhập đúng tên như trên tài khoản ngân hàng.</p>
          </div>

          <div>
            <label className={lbl}>Tiền tố nội dung chuyển khoản</label>
            <input
              value={cfg.prefix}
              onChange={(e) => set({ prefix: e.target.value.replace(/[^a-zA-Z0-9 ]/g, '') })}
              className={inputCls}
              placeholder="Ví dụ: Orion"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nội dung chuyển khoản sẽ là: <span className="font-mono font-medium">{cfg.prefix || '—'} &lt;mã đơn&gt;</span>. Giúp đối soát tự động.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border bg-muted/30 p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-1"><QrCode className="h-5 w-5 text-primary" /> Xem trước mã QR</h3>
          <p className="text-xs text-muted-foreground mb-4">Đơn mẫu 100.000đ · mã đơn {SAMPLE_ORDER}</p>

          {cfg.enabled ? (
            <>
              <div className="bg-white rounded-xl border p-4 max-w-[320px] mx-auto">
                <div className="relative w-full aspect-square">
                  <Image src={qrUrl} alt="Xem trước mã VietQR" fill className="object-contain" unoptimized />
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-bold text-foreground truncate">{bank?.short}</p>
                  <p className="text-xs font-semibold text-foreground break-words">{cfg.accountName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{cfg.accountNumber || '—'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <p><span className="text-muted-foreground">Ngân hàng:</span> <span className="font-medium">{bank?.name}</span></p>
                <p><span className="text-muted-foreground">Số TK:</span> <span className="font-semibold">{cfg.accountNumber || '—'}</span></p>
                <p><span className="text-muted-foreground">Chủ TK:</span> <span className="font-semibold">{cfg.accountName}</span></p>
                <p><span className="text-muted-foreground">Nội dung:</span> <span className="font-mono font-medium">{sampleContent}</span></p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-14 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Thanh toán chuyển khoản đang tắt.</p>
              <p className="text-xs">Bật lại để khách hàng thấy mã QR khi thanh toán.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
