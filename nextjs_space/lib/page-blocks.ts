// Shared definitions for the page builder block system.
// Blocks are stored as a JSON string in Page.blocks.

export type BlockType =
  | 'hero'
  | 'heading'
  | 'richtext'
  | 'image'
  | 'products'
  | 'categories'
  | 'cta'
  | 'posts'
  | 'video'
  | 'embed'
  | 'contact'
  | 'columns'
  | 'features'
  | 'stats'
  | 'testimonial'
  | 'accordion'
  | 'button'
  | 'gallery'
  | 'mediatext'
  | 'html'
  | 'css'
  | 'header'
  | 'footer'
  | 'spacer';

export interface PageBlock {
  id: string;
  type: BlockType;
  // Flexible props bag; each block type reads the keys it needs.
  [key: string]: any;
}

export const BLOCK_LABELS: Record<BlockType, { vi: string; en: string; icon: string }> = {
  hero: { vi: 'Banner (Hero)', en: 'Hero', icon: 'Sparkles' },
  heading: { vi: 'Tiêu đề mục', en: 'Heading', icon: 'Heading' },
  richtext: { vi: 'Nội dung văn bản', en: 'Rich text', icon: 'FileText' },
  image: { vi: 'Hình ảnh', en: 'Image', icon: 'Image' },
  products: { vi: 'Lưới sản phẩm', en: 'Product grid', icon: 'ShoppingBag' },
  categories: { vi: 'Danh mục sản phẩm', en: 'Categories', icon: 'Grid' },
  cta: { vi: 'Kêu gọi hành động (CTA)', en: 'Call to action', icon: 'Megaphone' },
  posts: { vi: 'Bài viết / Tin tức', en: 'Latest posts', icon: 'Newspaper' },
  video: { vi: 'Video (YouTube/Vimeo)', en: 'Video', icon: 'Video' },
  embed: { vi: 'Mã nhúng (Embed)', en: 'Embed code', icon: 'Code' },
  contact: { vi: 'Biểu mẫu liên hệ (Contact)', en: 'Contact form', icon: 'Mail' },
  columns: { vi: 'Cột văn bản (2-4 cột)', en: 'Text columns', icon: 'Columns' },
  features: { vi: 'Tính năng (icon + mô tả)', en: 'Features', icon: 'Grid' },
  stats: { vi: 'Số liệu nổi bật', en: 'Stats / counters', icon: 'BarChart' },
  testimonial: { vi: 'Nhận xét khách hàng', en: 'Testimonials', icon: 'Quote' },
  accordion: { vi: 'Câu hỏi thường gặp (FAQ)', en: 'Accordion / FAQ', icon: 'ListCollapse' },
  button: { vi: 'Nút bấm', en: 'Button', icon: 'MousePointerClick' },
  gallery: { vi: 'Thư viện ảnh', en: 'Image gallery', icon: 'Images' },
  mediatext: { vi: 'Ảnh + Nội dung', en: 'Image + text', icon: 'GalleryHorizontalEnd' },
  html: { vi: 'Mã HTML tùy chỉnh', en: 'Custom HTML', icon: 'Code2' },
  css: { vi: 'CSS tùy chỉnh', en: 'Custom CSS', icon: 'Palette' },
  header: { vi: 'Header tùy chỉnh', en: 'Custom header', icon: 'PanelTop' },
  footer: { vi: 'Footer tùy chỉnh', en: 'Custom footer', icon: 'PanelBottom' },
  spacer: { vi: 'Khoảng cách', en: 'Spacer', icon: 'Minus' },
};

export const BLOCK_ORDER: BlockType[] = [
  'hero',
  'heading',
  'richtext',
  'image',
  'products',
  'categories',
  'cta',
  'posts',
  'video',
  'embed',
  'contact',
  'columns',
  'features',
  'stats',
  'testimonial',
  'accordion',
  'button',
  'gallery',
  'mediatext',
  'html',
  'css',
  'header',
  'footer',
  'spacer',
];

// Grouped palette (Odoo-style) for the drag-and-drop builder.
export interface BlockCategory {
  vi: string;
  en: string;
  types: BlockType[];
}

export const BLOCK_CATEGORIES: BlockCategory[] = [
  { vi: 'Cấu trúc', en: 'Structure', types: ['hero', 'heading', 'columns', 'spacer'] },
  { vi: 'Nội dung', en: 'Content', types: ['mediatext', 'richtext', 'image', 'gallery', 'video', 'button', 'accordion'] },
  { vi: 'Tính năng', en: 'Features', types: ['features', 'stats', 'testimonial', 'cta'] },
  { vi: 'Thương mại & Dữ liệu', en: 'Commerce & Data', types: ['products', 'categories', 'posts', 'contact'] },
  { vi: 'Nâng cao', en: 'Advanced', types: ['embed', 'html', 'css', 'header', 'footer'] },
];

// A single field in a contact form block.
export interface ContactField {
  key: string;
  label: string;
  labelEn?: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export function defaultContactFields(): ContactField[] {
  return [
    { key: 'name', label: 'Tên', labelEn: 'Name', type: 'text', required: true },
    { key: 'phone', label: 'Số điện thoại', labelEn: 'Phone', type: 'tel', required: false, placeholder: '+84' },
    { key: 'email', label: 'Email', labelEn: 'Email', type: 'email', required: true },
    { key: 'company', label: 'Công ty', labelEn: 'Company', type: 'text', required: true },
    { key: 'industry', label: 'Lĩnh vực hoạt động', labelEn: 'Industry', type: 'text', required: true },
    { key: 'message', label: 'Câu hỏi của bạn', labelEn: 'Your question', type: 'textarea', required: false },
  ];
}

let counter = 0;
export function genBlockId(): string {
  counter += 1;
  return 'b_' + Date.now().toString(36) + '_' + counter.toString(36);
}

export function defaultBlock(type: BlockType): PageBlock {
  const id = genBlockId();
  switch (type) {
    case 'hero':
      return {
        id,
        type,
        title: 'Tiêu đề nổi bật',
        titleEn: 'Headline',
        subtitle: 'Mô tả ngắn gọn cho banner của bạn.',
        subtitleEn: 'A short description for your banner.',
        image: '',
        buttonText: 'Mua ngay',
        buttonTextEn: 'Shop now',
        buttonLink: '/products',
        align: 'center',
      };
    case 'heading':
      return { id, type, text: 'Tiêu đề mục', textEn: 'Section heading', level: 'h2', align: 'center' };
    case 'richtext':
      return { id, type, html: '<p>Nhập nội dung tại đây...</p>', htmlEn: '' };
    case 'image':
      return { id, type, url: '', alt: '', caption: '', captionEn: '' };
    case 'products':
      return { id, type, title: 'Sản phẩm nổi bật', titleEn: 'Featured products', source: 'featured', categorySlug: '', limit: 8 };
    case 'categories':
      return { id, type, title: 'Danh mục', titleEn: 'Categories' };
    case 'cta':
      return {
        id,
        type,
        title: 'Sẵn sàng bắt đầu?',
        titleEn: 'Ready to get started?',
        subtitle: 'Liên hệ với chúng tôi ngay hôm nay.',
        subtitleEn: 'Contact us today.',
        buttonText: 'Liên hệ',
        buttonTextEn: 'Contact',
        buttonLink: '/products',
      };
    case 'posts':
      return { id, type, title: 'Tin tức mới nhất', titleEn: 'Latest News', limit: 3 };
    case 'video':
      return { id, type, url: '', title: '', titleEn: '', caption: '', captionEn: '' };
    case 'embed':
      return { id, type, code: '', title: '', titleEn: '', caption: '', captionEn: '' };
    case 'contact':
      return {
        id,
        type,
        title: 'Liên hệ với chúng tôi',
        titleEn: 'Contact us',
        subtitle: 'Để lại thông tin, chúng tôi sẽ liên hệ lại sớm nhất.',
        subtitleEn: 'Leave your details and we will get back to you shortly.',
        submitText: 'Gửi',
        submitTextEn: 'Send',
        successText: 'Cảm ơn bạn! Chúng tôi đã nhận được thông tin và sẽ liên hệ sớm.',
        successTextEn: 'Thank you! We have received your details and will contact you soon.',
        showRequired: true,
        thankYouUrl: '',
        fields: defaultContactFields(),
      };
    case 'columns':
      return {
        id,
        type,
        cols: 3,
        items: [
          { title: 'Cột 1', titleEn: 'Column 1', html: '<p>Nội dung cột 1...</p>', htmlEn: '' },
          { title: 'Cột 2', titleEn: 'Column 2', html: '<p>Nội dung cột 2...</p>', htmlEn: '' },
          { title: 'Cột 3', titleEn: 'Column 3', html: '<p>Nội dung cột 3...</p>', htmlEn: '' },
        ],
      };
    case 'features':
      return {
        id,
        type,
        title: 'Tính năng nổi bật',
        titleEn: 'Key features',
        cols: 3,
        items: [
          { icon: '⭐', title: 'Chất lượng', titleEn: 'Quality', text: 'Mô tả ngắn về tính năng.', textEn: 'A short description.' },
          { icon: '🚀', title: 'Nhanh chóng', titleEn: 'Fast', text: 'Mô tả ngắn về tính năng.', textEn: 'A short description.' },
          { icon: '🛡️', title: 'An toàn', titleEn: 'Secure', text: 'Mô tả ngắn về tính năng.', textEn: 'A short description.' },
        ],
      };
    case 'stats':
      return {
        id,
        type,
        title: '',
        titleEn: '',
        items: [
          { value: '1000+', label: 'Khách hàng', labelEn: 'Customers' },
          { value: '50+', label: 'Dự án', labelEn: 'Projects' },
          { value: '10', label: 'Năm kinh nghiệm', labelEn: 'Years' },
          { value: '99%', label: 'Hài lòng', labelEn: 'Satisfaction' },
        ],
      };
    case 'testimonial':
      return {
        id,
        type,
        title: 'Khách hàng nói gì',
        titleEn: 'What clients say',
        items: [
          { quote: 'Dịch vụ tuyệt vời, tôi rất hài lòng!', quoteEn: 'Excellent service, highly satisfied!', author: 'Nguyễn Văn A', role: 'Giám đốc' },
          { quote: 'Sản phẩm chất lượng, đội ngũ chuyên nghiệp.', quoteEn: 'Quality products, professional team.', author: 'Trần Thị B', role: 'Quản lý' },
        ],
      };
    case 'accordion':
      return {
        id,
        type,
        title: 'Câu hỏi thường gặp',
        titleEn: 'Frequently asked questions',
        items: [
          { q: 'Câu hỏi 1?', qEn: 'Question 1?', a: 'Trả lời cho câu hỏi 1.', aEn: 'Answer to question 1.' },
          { q: 'Câu hỏi 2?', qEn: 'Question 2?', a: 'Trả lời cho câu hỏi 2.', aEn: 'Answer to question 2.' },
        ],
      };
    case 'button':
      return { id, type, text: 'Bấm vào đây', textEn: 'Click here', link: '/products', align: 'center', variant: 'primary' };
    case 'gallery':
      return { id, type, cols: 3, images: [] };
    case 'mediatext':
      return {
        id,
        type,
        layout: 'image-left',
        image: '',
        imageAlt: '',
        ratio: 'landscape',
        title: 'Tiêu đề nội dung',
        titleEn: 'Content title',
        html: '<p>Viết một hoặc hai đoạn mô tả về sản phẩm, dịch vụ hoặc chủ đề của bạn.</p>',
        htmlEn: '',
        buttonText: 'Tìm hiểu thêm',
        buttonTextEn: 'Learn more',
        buttonLink: '',
        buttonVariant: 'primary',
        background: '',
      };
    case 'html':
      return { id, type, code: '<div class="my-html">\n  <!-- Nhập mã HTML tại đây -->\n</div>' };
    case 'css':
      return { id, type, css: '/* Nhập CSS tùy chỉnh tại đây */\n' };
    case 'header':
      return { id, type, code: '<div style="padding:16px 0;">\n  <h2>Header tùy chỉnh</h2>\n</div>', fullWidth: true, background: '' };
    case 'footer':
      return { id, type, code: '<div style="padding:16px 0;">\n  <p>Footer tùy chỉnh</p>\n</div>', fullWidth: true, background: '' };
    case 'spacer':
      return { id, type, height: 48 };
    default:
      return { id, type: 'richtext', html: '' };
  }
}

export function parseBlocks(raw?: string | null): PageBlock[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as PageBlock[];
    return [];
  } catch {
    return [];
  }
}
