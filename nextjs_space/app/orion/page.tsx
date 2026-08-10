export const dynamic = 'force-dynamic';

import { OrionClient } from './_components/orion-client';

export const metadata = {
  title: 'Orion – Nền tảng AI Agent quản trị doanh nghiệp | Orion',
  description: 'Orion chắt lọc tinh hoa của ERP, Multi-Model AI và nền tảng xây dựng AI Agent để tạo thành một hệ điều hành quản trị thông minh dành cho doanh nghiệp.',
};

export default function OrionPage() {
  return <OrionClient />;
}
