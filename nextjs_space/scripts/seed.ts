import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Orion database...');

  // ---- Users ----
  const users = [
    { email: 'abacus-5ee0f2f9@example.com', password: 'u60r4Dy#Qf', name: 'System Admin', role: 'admin' },
    { email: 'admin@orion.vn', password: 'Admin@2026', name: 'Quản trị viên', role: 'admin' },
    { email: 'designer@orion.vn', password: 'Staff@2026', name: 'Thiết kế web', role: 'web_designer' },
    { email: 'sales@orion.vn', password: 'Staff@2026', name: 'Chăm sóc khách hàng', role: 'sales' },
    { email: 'marketing@orion.vn', password: 'Staff@2026', name: 'Marketing', role: 'marketing' },
    { email: 'ketoan@orion.vn', password: 'Staff@2026', name: 'Kế toán', role: 'accountant' },
    { email: 'customer@orion.vn', password: 'Staff@2026', name: 'Khách hàng demo', role: 'customer' },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashed },
      create: { email: u.email, password: hashed, name: u.name, role: u.role },
    });
  }
  console.log('Users seeded.');

  // ---- Categories ----
  const categories = [
    { name: 'Phần mềm ERP', nameEn: 'ERP Software', slug: 'erp', icon: 'LayoutDashboard', description: 'Hệ thống quản trị doanh nghiệp toàn diện', descriptionEn: 'Comprehensive enterprise resource planning systems' },
    { name: 'Dịch vụ AI', nameEn: 'AI Services', slug: 'ai-services', icon: 'Bot', description: 'Giải pháp trí tuệ nhân tạo cho doanh nghiệp', descriptionEn: 'Artificial intelligence solutions for businesses' },
    { name: 'Giải pháp Cloud', nameEn: 'Cloud Solutions', slug: 'cloud', icon: 'Cloud', description: 'Dịch vụ điện toán đám mây', descriptionEn: 'Cloud computing services' },
    { name: 'Bảo mật & An ninh', nameEn: 'Security & Cybersecurity', slug: 'security', icon: 'Shield', description: 'Giải pháp bảo mật thông tin', descriptionEn: 'Information security solutions' },
    { name: 'Tư vấn & Triển khai', nameEn: 'Consulting & Implementation', slug: 'consulting', icon: 'Users', description: 'Dịch vụ tư vấn và triển khai công nghệ', descriptionEn: 'Technology consulting and implementation services' },
    { name: 'Đào tạo & Hỗ trợ', nameEn: 'Training & Support', slug: 'training', icon: 'GraduationCap', description: 'Đào tạo nhân sự và hỗ trợ kỹ thuật', descriptionEn: 'Staff training and technical support' },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameEn: c.nameEn, icon: c.icon, description: c.description, descriptionEn: c.descriptionEn },
      create: c,
    });
    catMap[c.slug] = cat.id;
  }
  console.log('Categories seeded.');

  // ---- Products ----
  const products = [
    {
      name: 'Orion ERP Pro',
      nameEn: 'Orion ERP Pro',
      slug: 'orion-erp-pro',
      description: 'Hệ thống quản trị doanh nghiệp toàn diện Orion ERP Pro. Tích hợp quản lý tài chính, kho hàng, nhân sự, sản xuất và bán hàng. Giao diện thân thiện, dễ sử dụng, tùy biến linh hoạt theo nhu cầu doanh nghiệp.',
      descriptionEn: 'Comprehensive enterprise management system Orion ERP Pro. Integrates financial management, inventory, HR, production and sales. User-friendly interface with flexible customization.',
      price: 45000000,
      originalPrice: 55000000,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      categorySlug: 'erp',
      featured: true,
      specs: JSON.stringify({ 'Giấy phép': 'Năm', 'Người dùng': 'Không giới hạn', 'Hỗ trợ': '24/7', 'Cập nhật': 'Miễn phí' }),
    },
    {
      name: 'Orion AI Assistant',
      nameEn: 'Orion AI Assistant',
      slug: 'orion-ai-assistant',
      description: 'Trợ lý AI thông minh cho doanh nghiệp. Tự động hóa chăm sóc khách hàng, phân tích dữ liệu, tạo nội dung và hỗ trợ ra quyết định. Được huấn luyện riêng cho từng doanh nghiệp.',
      descriptionEn: 'Smart AI assistant for businesses. Automates customer care, data analysis, content creation and decision support. Custom-trained for each business.',
      price: 12000000,
      originalPrice: 15000000,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
      categorySlug: 'ai-services',
      featured: true,
      specs: JSON.stringify({ 'Model': 'GPT-4 / Claude', 'Ngôn ngữ': 'Đa ngôn ngữ', 'Tùy chỉnh': 'Có', 'API': 'RESTful' }),
    },
    {
      name: 'Orion Cloud Storage',
      nameEn: 'Orion Cloud Storage',
      slug: 'orion-cloud-storage',
      description: 'Giải pháp lưu trữ đám mây doanh nghiệp. Bảo mật cao, sao lưu tự động, truy cập mọi lúc mọi nơi. Tích hợp với hệ sinh thái Orion.',
      descriptionEn: 'Enterprise cloud storage solution. High security, automatic backup, access anywhere. Integrated with Orion ecosystem.',
      price: 3600000,
      originalPrice: 4800000,
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=400&fit=crop',
      categorySlug: 'cloud',
      featured: true,
      specs: JSON.stringify({ 'Dung lượng': '1TB', 'Backup': 'Hàng ngày', 'SLA': '99.9%', 'Mã hóa': 'AES-256' }),
    },
    {
      name: 'Orion Security Suite',
      nameEn: 'Orion Security Suite',
      slug: 'orion-security-suite',
      description: 'Bộ giải pháp bảo mật toàn diện cho doanh nghiệp. Bao gồm tường lửa, chống virus, phát hiện xâm nhập, quản lý truy cập và giám sát an ninh mạng.',
      descriptionEn: 'Comprehensive security suite for enterprises. Includes firewall, antivirus, intrusion detection, access management and network security monitoring.',
      price: 18000000,
      originalPrice: 22000000,
      image: 'https://www.extnoc.com/learn/wp-content/uploads/2022/02/Network-Security.jpg',
      categorySlug: 'security',
      featured: true,
      specs: JSON.stringify({ 'Firewall': 'Next-Gen', 'Endpoint': 'Có', 'SIEM': 'Có', 'SOC': '24/7' }),
    },
    {
      name: 'Orion Business Analytics',
      nameEn: 'Orion Business Analytics',
      slug: 'orion-business-analytics',
      description: 'Nền tảng phân tích dữ liệu kinh doanh. Dashboard trực quan, báo cáo tự động, dự báo xu hướng và phân tích hành vi khách hàng bằng AI.',
      descriptionEn: 'Business data analytics platform. Visual dashboards, automated reports, trend forecasting and AI-powered customer behavior analysis.',
      price: 24000000,
      originalPrice: 30000000,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
      categorySlug: 'ai-services',
      featured: true,
      specs: JSON.stringify({ 'Dashboard': 'Real-time', 'Báo cáo': 'Tự động', 'AI': 'Machine Learning', 'Tích hợp': 'API mở' }),
    },
    {
      name: 'Orion Consulting Package',
      nameEn: 'Orion Consulting Package',
      slug: 'orion-consulting-package',
      description: 'Gói tư vấn chuyển đổi số toàn diện. Đánh giá hiện trạng, lập kế hoạch, triển khai và đào tạo. Đội ngũ chuyên gia giàu kinh nghiệm.',
      descriptionEn: 'Comprehensive digital transformation consulting package. Assessment, planning, implementation and training. Experienced expert team.',
      price: 35000000,
      originalPrice: 40000000,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      categorySlug: 'consulting',
      featured: true,
      specs: JSON.stringify({ 'Thời gian': '3-6 tháng', 'Chuyên gia': 'Senior', 'Báo cáo': 'Hàng tuần', 'Hỗ trợ': 'Toàn diện' }),
    },
    {
      name: 'Orion Training Pro',
      nameEn: 'Orion Training Pro',
      slug: 'orion-training-pro',
      description: 'Chương trình đào tạo CNTT cho doanh nghiệp. Các khóa học về ERP, AI, Cloud, Security. Giảng viên chuyên gia, chứng chỉ quốc tế.',
      descriptionEn: 'IT training program for enterprises. Courses on ERP, AI, Cloud, Security. Expert instructors, international certificates.',
      price: 8000000,
      originalPrice: 10000000,
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
      categorySlug: 'training',
      featured: false,
      specs: JSON.stringify({ 'Hình thức': 'Online/Offline', 'Chứng chỉ': 'Quốc tế', 'Học viên': '≤20/lớp', 'Thời lượng': '40 giờ' }),
    },
  ];

  for (const p of products) {
    const { categorySlug, ...rest } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...rest, categoryId: catMap[categorySlug] },
      create: { ...rest, categoryId: catMap[categorySlug] },
    });
  }
  console.log('Products seeded.');

  // ---- Site Settings ----
  const settings: Record<string, string> = {
    site_name: 'Orion',
    site_tagline: 'Giải pháp phần mềm & AI thông minh',
    hero_title: 'Giải pháp công nghệ',
    hero_title_highlight: 'cho doanh nghiệp',
    hero_subtitle: 'Orion cung cấp phần mềm ERP, dịch vụ AI và giải pháp cloud giúp doanh nghiệp tăng trưởng mạnh mẽ trong kỷ nguyên số.',
    hero_title_en: 'Technology Solutions',
    hero_title_highlight_en: 'for Enterprises',
    hero_subtitle_en: 'Orion provides ERP software, AI services, and cloud solutions to help businesses grow in the digital era.',
    footer_email: 'info@orion.vn',
    footer_phone: '024 3795 7788',
    footer_address: 'Tầng 6, Tòa nhà HH4, Khu đô thị Linh Đàm, Hoàng Mai, Hà Nội',
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log('Site settings seeded.');

  // ---- AI Config ----
  await prisma.aiConfig.upsert({
    where: { key: 'default' },
    update: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      systemPrompt: 'Bạn là trợ lý AI của Orion - CÔNG TY CỔ PHẦN ORION QUỐC TẾ. Bạn hỗ trợ khách hàng tìm hiểu về các giải pháp phần mềm ERP, dịch vụ AI, cloud và tư vấn triển khai. Hãy trả lời bằng tiếng Việt, chuyên nghiệp và thân thiện. Khi khách hỏi về giá, hãy hướng dẫn liên hệ sales để được báo giá chi tiết.',
      useWebsiteData: true,
    },
    create: {
      key: 'default',
      provider: 'openai',
      model: 'gpt-4o-mini',
      systemPrompt: 'Bạn là trợ lý AI của Orion - CÔNG TY CỔ PHẦN ORION QUỐC TẾ. Bạn hỗ trợ khách hàng tìm hiểu về các giải pháp phần mềm ERP, dịch vụ AI, cloud và tư vấn triển khai. Hãy trả lời bằng tiếng Việt, chuyên nghiệp và thân thiện. Khi khách hỏi về giá, hãy hướng dẫn liên hệ sales để được báo giá chi tiết.',
      useWebsiteData: true,
    },
  });
  console.log('AI Config seeded.');

  // ---- Post Categories ----
  const postCats = [
    { name: 'Tin công nghệ', nameEn: 'Tech News', slug: 'tin-cong-nghe', order: 0 },
    { name: 'Hướng dẫn', nameEn: 'Tutorials', slug: 'huong-dan', order: 1 },
    { name: 'Sự kiện', nameEn: 'Events', slug: 'su-kien', order: 2 },
  ];
  for (const pc of postCats) {
    await prisma.postCategory.upsert({
      where: { slug: pc.slug },
      update: { name: pc.name, nameEn: pc.nameEn, order: pc.order },
      create: pc,
    });
  }
  console.log('Post categories seeded.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
