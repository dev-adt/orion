import crypto from 'crypto';

const VNP_URL = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_TMN_CODE = process.env.VNP_TMN_CODE || '';
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || '';

export function isVnpayConfigured(): boolean {
  return !!(VNP_TMN_CODE && VNP_HASH_SECRET && VNP_TMN_CODE !== 'YOUR_TMN_CODE_HERE' && VNP_HASH_SECRET !== 'YOUR_HASH_SECRET_HERE');
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export interface VnpayPaymentParams {
  amount: number; // VND (will be multiplied by 100)
  orderNumber: string;
  orderInfo: string;
  ipAddr: string;
  returnUrl: string;
  locale?: string;
}

export function buildVnpayPaymentUrl(params: VnpayPaymentParams): string {
  const { amount, orderNumber, orderInfo, ipAddr, returnUrl, locale = 'vn' } = params;

  const now = new Date();
  // VNPay uses Indochina Time (UTC+7)
  const vnDate = new Date(now.getTime() + 7 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60 * 1000);

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderNumber,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: (amount * 100).toString(),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: formatDate(vnDate),
  };

  const sorted = sortObject(vnpParams);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const finalParams = new URLSearchParams(sorted);
  finalParams.append('vnp_SecureHash', secureHash);

  return `${VNP_URL}?${finalParams.toString()}`;
}

export function verifyVnpayReturn(query: Record<string, string>): {
  isValid: boolean;
  responseCode: string;
  orderNumber: string;
  amount: number;
  transactionNo: string;
} {
  const secureHash = query['vnp_SecureHash'] || '';
  const params: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && key.startsWith('vnp_')) {
      params[key] = value;
    }
  }

  const sorted = sortObject(params);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return {
    isValid: secureHash === checkHash,
    responseCode: query['vnp_ResponseCode'] || '',
    orderNumber: query['vnp_TxnRef'] || '',
    amount: parseInt(query['vnp_Amount'] || '0', 10) / 100,
    transactionNo: query['vnp_TransactionNo'] || '',
  };
}
