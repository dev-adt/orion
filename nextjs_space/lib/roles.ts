// Central role & permission definitions for the whole app.
// Roles: admin (highest), web_designer, sales, marketing, accountant, dev_partner, customer.

export type Role =
  | 'admin'
  | 'web_designer'
  | 'sales'
  | 'marketing'
  | 'accountant'
  | 'dev_partner'
  | 'customer';

// Staff roles can access the admin panel (customer & dev_partner cannot).
export const STAFF_ROLES: Role[] = ['admin', 'web_designer', 'sales', 'marketing', 'accountant'];

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'posts'
  | 'pages'
  | 'homepage'
  | 'ai'
  | 'ai-agents'
  | 'chat'
  | 'crm'
  | 'projects'
  | 'marketing'
  | 'payment'
  | 'operations'
  | 'footer'
  | 'users';

// Which admin tabs each role may see/use.
export const ROLE_TABS: Record<Role, AdminTab[]> = {
  admin: ['dashboard', 'products', 'orders', 'posts', 'pages', 'homepage', 'ai', 'ai-agents', 'chat', 'crm', 'projects', 'marketing', 'payment', 'operations', 'footer', 'users'],
  web_designer: ['dashboard', 'products', 'posts', 'pages', 'homepage', 'footer', 'projects', 'operations'],
  sales: ['dashboard', 'orders', 'chat', 'crm', 'projects', 'operations'],
  marketing: ['dashboard', 'posts', 'ai', 'projects', 'marketing', 'operations'],
  accountant: ['dashboard', 'orders', 'projects', 'payment', 'operations'],
  dev_partner: [],
  customer: [],
};

export const ROLE_LABELS: Record<Role, { vi: string; en: string; desc: string }> = {
  admin: { vi: 'Quản trị viên', en: 'Admin', desc: 'Toàn quyền hệ thống' },
  web_designer: { vi: 'Thiết kế web', en: 'Web Designer', desc: 'Quản lý sản phẩm, bài viết, trang chủ' },
  sales: { vi: 'Kinh doanh / CSKH', en: 'Sales', desc: 'Chăm sóc khách hàng, đơn hàng' },
  marketing: { vi: 'Marketing', en: 'Marketing', desc: 'Bài viết, chiến dịch, huấn luyện AI' },
  accountant: { vi: 'Kế toán', en: 'Accountant', desc: 'Xem đơn hàng, doanh thu' },
  dev_partner: { vi: 'Đối tác phát triển', en: 'Development Partner', desc: 'Sử dụng AI Agent dành cho đối tác, không truy cập quản trị' },
  customer: { vi: 'Khách hàng', en: 'Customer', desc: 'Xem đơn hàng của mình' },
};

export const ASSIGNABLE_ROLES: Role[] = [
  'admin',
  'web_designer',
  'sales',
  'marketing',
  'accountant',
  'dev_partner',
  'customer',
];

export function canAccessAdmin(role?: string | null): boolean {
  return STAFF_ROLES.includes(role as Role);
}

// Roles selectable as "audience" for a page/post when visibility = 'roles'.
// Admin is intentionally excluded because admins can always view everything.
export const CONTENT_VIEW_ROLES: Role[] = [
  'web_designer',
  'sales',
  'marketing',
  'accountant',
  'dev_partner',
  'customer',
];

// Parse the stored viewRoles (comma-separated string) into an array of roles.
export function parseViewRoles(viewRoles?: string | null): Role[] {
  return (viewRoles || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as Role[];
}

// Server + client guard: can a viewer with `role` see content with this visibility?
// visibility === 'public'  -> everyone (public site)
// visibility === 'roles'   -> only admin or a role listed in viewRoles (must be logged in)
export function canViewContent(
  visibility: string | null | undefined,
  viewRoles: string | null | undefined,
  role: string | null | undefined,
): boolean {
  if (visibility !== 'roles') return true;
  if (role === 'admin') return true;
  if (!role) return false;
  return parseViewRoles(viewRoles).includes(role as Role);
}

// Roles allowed to use the AI Tools page (/cong-cu-ai): all staff plus dev_partner.
export function canUseAiTools(role?: string | null): boolean {
  return canAccessAdmin(role) || role === 'dev_partner';
}

export function tabsForRole(role?: string | null): AdminTab[] {
  return ROLE_TABS[(role as Role)] ?? [];
}

export function canAccessTab(role: string | null | undefined, tab: AdminTab): boolean {
  return tabsForRole(role).includes(tab);
}

// Server-side guard helper: returns true if the role is one of the allowed list.
export function roleAllowed(role: string | null | undefined, allowed: Role[]): boolean {
  return !!role && allowed.includes(role as Role);
}
