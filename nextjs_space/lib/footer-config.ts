// Shared definitions for the editable site footer.
// The whole config is stored as a JSON string in SiteSetting under key 'footer_config'.

export interface FooterLink {
  label: string;
  labelEn?: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  titleEn?: string;
  links: FooterLink[];
}

export interface FooterConfig {
  description: string;
  descriptionEn?: string;
  columns: FooterColumn[];
  contactTitle: string;
  contactTitleEn?: string;
  email: string;
  phone: string;
  address: string;
  addressEn?: string;
  copyright: string;
  copyrightEn?: string;
}

export const FOOTER_SETTING_KEY = 'footer_config';

export function defaultFooterConfig(): FooterConfig {
  return {
    description:
      'CÔNG TY CỔ PHẦN ORION QUỐC TẾ - Giải pháp phần mềm & AI thông minh cho doanh nghiệp.',
    descriptionEn:
      'Orion International JSC - Smart software & AI solutions for businesses.',
    columns: [
      {
        title: 'Liên kết nhanh',
        titleEn: 'Quick links',
        links: [
          { label: 'Sản phẩm', labelEn: 'Products', url: '/products' },
          { label: 'Tin tức', labelEn: 'News', url: '/tin-tuc' },
          { label: 'Giỏ hàng', labelEn: 'Cart', url: '/cart' },
        ],
      },
    ],
    contactTitle: 'Liên hệ',
    contactTitleEn: 'Contact',
    email: 'info@orion.vn',
    phone: '024 3795 7788',
    address: 'Tầng 6, Tòa nhà HH4, Khu đô thị Linh Đàm, Hoàng Mai, Hà Nội',
    addressEn: '6th Floor, HH4 Building, Linh Dam, Hoang Mai, Hanoi',
    copyright: '© 2026 CÔNG TY CỔ PHẦN ORION QUỐC TẾ. Đã đăng ký bản quyền.',
    copyrightEn: '© 2026 Orion International JSC. All rights reserved.',
  };
}

export function parseFooterConfig(raw?: string | null): FooterConfig {
  const def = defaultFooterConfig();
  if (!raw) return def;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return def;
    return {
      description: typeof parsed.description === 'string' ? parsed.description : def.description,
      descriptionEn: typeof parsed.descriptionEn === 'string' ? parsed.descriptionEn : def.descriptionEn,
      columns: Array.isArray(parsed.columns) ? parsed.columns : def.columns,
      contactTitle: typeof parsed.contactTitle === 'string' ? parsed.contactTitle : def.contactTitle,
      contactTitleEn: typeof parsed.contactTitleEn === 'string' ? parsed.contactTitleEn : def.contactTitleEn,
      email: typeof parsed.email === 'string' ? parsed.email : def.email,
      phone: typeof parsed.phone === 'string' ? parsed.phone : def.phone,
      address: typeof parsed.address === 'string' ? parsed.address : def.address,
      addressEn: typeof parsed.addressEn === 'string' ? parsed.addressEn : def.addressEn,
      copyright: typeof parsed.copyright === 'string' ? parsed.copyright : def.copyright,
      copyrightEn: typeof parsed.copyrightEn === 'string' ? parsed.copyrightEn : def.copyrightEn,
    };
  } catch {
    return def;
  }
}
