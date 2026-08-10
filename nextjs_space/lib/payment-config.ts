// Cấu hình cổng thanh toán trong nước (VietQR / Napas 24/7 / chuyển khoản).
// VietQR là chuẩn của Napas nên 1 mã QR phục vụ cả chuyển khoản, ví Napas và VietQR.
// Cấu hình do quản trị viên khai báo trong trang quản trị và lưu ở SiteSetting.

export const PAYMENT_SETTING_KEY = 'payment_config';

export interface PaymentConfig {
  enabled: boolean;
  bankBin: string;        // Mã BIN Napas của ngân hàng (dùng cho VietQR)
  accountNumber: string;  // Số tài khoản nhận tiền
  accountName: string;    // Tên chủ tài khoản (hiển thị, có dấu)
  prefix: string;         // Tiền tố nội dung chuyển khoản để đối soát
}

// Danh sách ngân hàng hỗ trợ VietQR (mã BIN Napas). Nguồn: Napas / VietQR.
export interface BankInfo { bin: string; short: string; name: string }
export const VIETQR_BANKS: BankInfo[] = [
  { bin: '970407', short: 'Techcombank', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)' },
  { bin: '970436', short: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)' },
  { bin: '970415', short: 'VietinBank', name: 'Ngân hàng TMCP Công Thương Việt Nam (VietinBank)' },
  { bin: '970418', short: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)' },
  { bin: '970405', short: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)' },
  { bin: '970422', short: 'MB Bank', name: 'Ngân hàng TMCP Quân Đội (MB Bank)' },
  { bin: '970416', short: 'ACB', name: 'Ngân hàng TMCP Á Châu (ACB)' },
  { bin: '970432', short: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)' },
  { bin: '970423', short: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong (TPBank)' },
  { bin: '970403', short: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)' },
  { bin: '970437', short: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM (HDBank)' },
  { bin: '970441', short: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)' },
  { bin: '970443', short: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)' },
  { bin: '970431', short: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam (Eximbank)' },
  { bin: '970426', short: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam (MSB)' },
  { bin: '970448', short: 'OCB', name: 'Ngân hàng TMCP Phương Đông (OCB)' },
  { bin: '970468', short: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á (SeABank)' },
  { bin: '970449', short: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam (LPBank)' },
  { bin: '970412', short: 'PVcomBank', name: 'Ngân hàng TMCP Đại Chúng Việt Nam (PVcomBank)' },
  { bin: '970409', short: 'BacABank', name: 'Ngân hàng TMCP Bắc Á (BacABank)' },
  { bin: '970427', short: 'VietABank', name: 'Ngân hàng TMCP Việt Á (VietABank)' },
  { bin: '970428', short: 'NamABank', name: 'Ngân hàng TMCP Nam Á (NamABank)' },
  { bin: '970425', short: 'ABBANK', name: 'Ngân hàng TMCP An Bình (ABBANK)' },
  { bin: '970452', short: 'KienLongBank', name: 'Ngân hàng TMCP Kiên Long (KienLongBank)' },
  { bin: '970454', short: 'BVBank', name: 'Ngân hàng TMCP Bản Việt (BVBank)' },
  { bin: '970429', short: 'SCB', name: 'Ngân hàng TMCP Sài Gòn (SCB)' },
  { bin: '970419', short: 'NCB', name: 'Ngân hàng TMCP Quốc Dân (NCB)' },
  { bin: '970430', short: 'PGBank', name: 'Ngân hàng TMCP Thịnh Vượng và Phát triển (PGBank)' },
  { bin: '970433', short: 'VietBank', name: 'Ngân hàng TMCP Việt Nam Thương Tín (VietBank)' },
  { bin: '970438', short: 'BaoVietBank', name: 'Ngân hàng TMCP Bảo Việt (BaoVietBank)' },
  { bin: '970400', short: 'SaigonBank', name: 'Ngân hàng TMCP Sài Gòn Công Thương (SaigonBank)' },
  { bin: '970424', short: 'Shinhan Bank', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam (Shinhan Bank)' },
  { bin: '970457', short: 'Woori Bank', name: 'Ngân hàng TNHH MTV Woori Việt Nam (Woori Bank)' },
  { bin: '970434', short: 'Indovina Bank', name: 'Ngân hàng TNHH Indovina (IVB)' },
  { bin: '970439', short: 'Public Bank', name: 'Ngân hàng TNHH MTV Public Việt Nam (Public Bank)' },
  { bin: '546034', short: 'Cake by VPBank', name: 'Ngân hàng số Cake by VPBank' },
  { bin: '963388', short: 'Timo', name: 'Ngân hàng số Timo by Ban Viet Bank' },
];

export function bankByBin(bin: string): BankInfo | undefined {
  return VIETQR_BANKS.find((b) => b.bin === bin);
}

// Cấu hình mặc định (giữ nguyên tài khoản Techcombank hiện tại của Orion).
export function defaultPaymentConfig(): PaymentConfig {
  return {
    enabled: true,
    bankBin: '970407',
    accountNumber: '19036730021017',
    accountName: 'CÔNG TY CỔ PHẦN ORION QUỐC TẾ',
    prefix: 'ORION',
  };
}

export function parsePaymentConfig(raw?: string | null): PaymentConfig {
  const def = defaultPaymentConfig();
  if (!raw) return def;
  try {
    const p = JSON.parse(raw);
    return {
      enabled: typeof p.enabled === 'boolean' ? p.enabled : def.enabled,
      bankBin: String(p.bankBin || def.bankBin),
      accountNumber: String(p.accountNumber || def.accountNumber),
      accountName: String(p.accountName || def.accountName),
      prefix: String(p.prefix ?? def.prefix),
    };
  } catch {
    return def;
  }
}

// Chuyển tên có dấu -> ASCII in hoa (VietQR yêu cầu tên tài khoản không dấu).
export function toAsciiName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Nội dung chuyển khoản: tiền tố + mã đơn để đối soát. Chỉ giữ ký tự an toàn.
export function paymentDescription(prefix: string, orderNumber: string) {
  return `${prefix} ${orderNumber}`.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

// Sinh URL ảnh QR động từ dịch vụ công khai img.vietqr.io (miễn phí, không cần khóa).
// template compact2 hiển thị kèm số tiền và nội dung.
export function buildVietQrUrl(cfg: PaymentConfig, amount: number, orderNumber: string) {
  const info = paymentDescription(cfg.prefix, orderNumber);
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: info,
    accountName: toAsciiName(cfg.accountName),
  });
  return `https://img.vietqr.io/image/${cfg.bankBin}-${cfg.accountNumber}-compact2.png?${params.toString()}`;
}
