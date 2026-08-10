'use client';

import { motion } from 'framer-motion';
import { Bot, Brain, Users, ShoppingCart, BarChart3, FolderKanban, Shield, Globe, Zap, MessageSquare, FileText, Target, Settings, BookOpen, PenTool, Headphones, UserCog, Layout, CreditCard, TrendingUp, ClipboardList, Lock, Monitor, Sparkles, ChevronRight, Cpu, Network, Database, Layers } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section {...fadeUp} className={`max-w-[900px] mx-auto px-4 ${className}`}>
      {children}
    </motion.section>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-foreground mt-16 mb-6">
      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </span>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">{children}</h3>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 my-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-muted-foreground">
          <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-1" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>;
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-card border rounded-xl p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

export function OrionClient() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-20 pb-16">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/50 rounded-full blur-3xl" />
        </div>
        <div className="max-w-[900px] mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Cpu className="h-4 w-4" />
                Nền tảng AI Agent
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-primary">Orion</span>
              <br />
              <span className="text-foreground">Nền tảng AI Agent quản trị doanh nghiệp toàn diện</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-8">
              Orion chắt lọc tinh hoa của ERP, Multi‑Model AI và nền tảng xây dựng AI Agent để tạo thành một hệ điều hành quản trị thông minh dành cho doanh nghiệp.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Khám phá sản phẩm
                </Button>
              </Link>
              <Link href="/#lien-he">
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Liên hệ tư vấn
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Intro */}
      <Section className="pt-12">
        <Para>
          Trong kỷ nguyên AI, doanh nghiệp không chỉ cần một phần mềm quản lý mà cần một nền tảng thông minh có khả năng hiểu dữ liệu, tự động hỗ trợ công việc và kết nối toàn bộ hoạt động vận hành.
        </Para>
        <Para>
          Orion được phát triển theo định hướng <strong className="text-primary">AI-first</strong>, lấy Trung tâm AI và hệ thống AI Agent làm lõi, đồng thời hợp nhất cửa hàng trực tuyến, CRM, marketing, quản lý dự án, điều hành và chăm sóc khách hàng trên cùng một nền tảng.
        </Para>
        <Para>
          Thay vì sử dụng nhiều phần mềm rời rạc, doanh nghiệp có thể quản lý dữ liệu, nhân sự, khách hàng, đơn hàng, nội dung và các AI Agent ngay trên Orion. Hệ thống hỗ trợ giao diện song ngữ Việt – Anh, phân quyền đa vai trò, triển khai trên VPS riêng hoặc nền tảng đám mây và có khả năng mở rộng theo nhu cầu thực tế.
        </Para>
      </Section>

      {/* Trung tâm AI */}
      <Section>
        <SectionTitle icon={Brain}>Trung tâm AI – Bộ não thông minh của Orion</SectionTitle>
        <Para>
          Trung tâm AI là thành phần cốt lõi của Orion, giúp doanh nghiệp quản lý tập trung các mô hình AI, kho tri thức, AI Agent, prompt, lịch sử sử dụng và chi phí vận hành AI.
        </Para>

        <SubTitle>Kết nối nhiều nhà cung cấp AI</SubTitle>
        <Para>
          Orion có thể kết nối với nhiều nhà cung cấp và mô hình AI phổ biến như:
        </Para>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-4">
          {['OpenAI', 'Google Gemini', 'Anthropic Claude', 'DeepSeek', 'OpenRouter', 'Abacus AI'].map((p) => (
            <div key={p} className="flex items-center gap-2 px-4 py-3 bg-card border rounded-lg text-sm font-medium">
              <Network className="h-4 w-4 text-primary" />
              {p}
            </div>
          ))}
        </div>
        <Para>
          Doanh nghiệp có thể lựa chọn mô hình phù hợp với từng nhiệm vụ thay vì phụ thuộc vào một nhà cung cấp duy nhất.
        </Para>

        <SubTitle>AI Router tối ưu chất lượng và chi phí</SubTitle>
        <Para>
          AI Router có khả năng phân loại yêu cầu theo mức độ đơn giản, trung bình hoặc phức tạp. Sau khi phân loại, hệ thống lựa chọn mô hình AI phù hợp để xử lý.
        </Para>
        <Para>
          Cơ chế này giúp doanh nghiệp cân bằng giữa chất lượng phản hồi, tốc độ và chi phí sử dụng AI. Những yêu cầu đơn giản có thể được chuyển tới mô hình tiết kiệm, trong khi các nhiệm vụ phân tích chuyên sâu được giao cho mô hình mạnh hơn.
        </Para>

        <SubTitle>Quản lý prompt tập trung</SubTitle>
        <Para>
          Quản trị viên có thể thiết lập và điều chỉnh prompt cho từng chức năng hoặc từng AI Agent, bao gồm:
        </Para>
        <BulletList items={[
          'Vai trò của AI',
          'Phạm vi kiến thức',
          'Phong cách trả lời',
          'Ngôn ngữ sử dụng',
          'Quy tắc bảo mật',
          'Giới hạn nội dung',
          'Độ sáng tạo',
          'Giới hạn token',
        ]} />
        <Para>
          Nhờ đó, AI có thể phản hồi theo đúng đặc điểm thương hiệu, quy trình nội bộ và mục tiêu sử dụng của từng doanh nghiệp.
        </Para>

        <SubTitle>Theo dõi lịch sử và chi phí AI</SubTitle>
        <Para>
          Trung tâm AI cho phép theo dõi lịch sử sử dụng, số lượng yêu cầu, mô hình được lựa chọn và chi phí ước tính. Thông tin này giúp doanh nghiệp kiểm soát ngân sách, đánh giá hiệu quả và tối ưu việc sử dụng AI theo từng phòng ban hoặc nghiệp vụ.
        </Para>
      </Section>

      {/* Multi-AI Agent */}
      <Section>
        <SectionTitle icon={Bot}>Hệ thống Multi-AI Agent cho doanh nghiệp</SectionTitle>
        <Para>
          Orion cho phép doanh nghiệp xây dựng và vận hành nhiều AI Agent chuyên biệt trên cùng một nền tảng. Mỗi AI Agent được thiết kế để đảm nhiệm một vai trò riêng, sử dụng prompt, mô hình và kho tài liệu phù hợp với nhiệm vụ được giao.
        </Para>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <FeatureCard icon={ShoppingCart} title="AI Agent tư vấn bán hàng" desc="Giới thiệu sản phẩm, phân tích nhu cầu, so sánh lựa chọn và cung cấp đường dẫn trực tiếp tới sản phẩm phù hợp. Hoạt động liên tục 24/7." />
          <FeatureCard icon={Headphones} title="AI Agent chăm sóc khách hàng" desc="Trả lời các câu hỏi về đơn hàng, thanh toán, vận chuyển, bảo hành và chính sách dịch vụ. Lịch sử hội thoại được lưu lại." />
          <FeatureCard icon={TrendingUp} title="AI Agent hỗ trợ marketing" desc="Xây dựng ý tưởng, viết bài blog, tạo nội dung sản phẩm, đề xuất tiêu đề, từ khóa và meta description bằng tiếng Việt và tiếng Anh." />
          <FeatureCard icon={UserCog} title="AI Agent hỗ trợ nhân sự nội bộ" desc="Tra cứu tài liệu, quy trình làm việc, chính sách doanh nghiệp, hướng dẫn nghiệp vụ bằng ngôn ngữ tự nhiên." />
          <FeatureCard icon={BarChart3} title="AI Agent hỗ trợ lãnh đạo" desc="Đọc và tóm tắt báo cáo hoạt động: kết quả công việc, nhiệm vụ hoàn thành, vấn đề tồn tại, đề xuất và ưu tiên tiếp theo." />
        </div>

        <SubTitle>Nhúng AI Agent vào nhiều nền tảng</SubTitle>
        <Para>
          Mỗi AI Agent có thể được cung cấp liên kết hoặc mã nhúng để tích hợp vào:
        </Para>
        <BulletList items={[
          'Website doanh nghiệp',
          'Website bán hàng',
          'Landing page',
          'Cổng thông tin nội bộ',
          'Trang thành viên',
          'Các nền tảng bên ngoài được hỗ trợ',
        ]} />
      </Section>

      {/* Knowledge Base */}
      <Section>
        <SectionTitle icon={BookOpen}>Knowledge Base – Kho tri thức dành riêng cho AI</SectionTitle>
        <Para>
          Knowledge Base giúp AI Agent hiểu sâu hơn về sản phẩm, dịch vụ và hoạt động của doanh nghiệp.
        </Para>

        <SubTitle>Tải tài liệu lên hệ thống</SubTitle>
        <Para>Doanh nghiệp có thể đưa vào kho tri thức các loại nội dung như:</Para>
        <BulletList items={[
          'Tài liệu giới thiệu doanh nghiệp',
          'Danh mục và hướng dẫn sử dụng sản phẩm',
          'Chính sách bán hàng',
          'Quy trình nghiệp vụ',
          'Câu hỏi thường gặp',
          'Tài liệu đào tạo',
          'Báo cáo và văn bản nội bộ',
          'Chính sách bảo hành, đổi trả và vận chuyển',
        ]} />
        <Para>AI sử dụng nguồn tài liệu đã được cung cấp để trả lời sát với dữ liệu thực tế của doanh nghiệp.</Para>

        <SubTitle>Kho tri thức riêng cho từng AI Agent</SubTitle>
        <Para>
          Mỗi AI Agent có thể được gắn với một bộ tài liệu riêng. AI Agent bán hàng chỉ sử dụng tài liệu sản phẩm, trong khi AI Agent nội bộ có thể truy cập quy trình vận hành hoặc tài liệu đào tạo. Việc phân tách kho tri thức giúp tăng độ chính xác và hạn chế AI sử dụng thông tin không thuộc phạm vi nhiệm vụ.
        </Para>
      </Section>

      {/* Chatbot AI */}
      <Section>
        <SectionTitle icon={MessageSquare}>Chatbot AI tư vấn khách hàng 24/7</SectionTitle>
        <Para>
          Orion tích hợp chatbot AI dưới dạng tiện ích nổi trên website, giúp khách hàng dễ dàng trò chuyện từ bất kỳ trang nào.
        </Para>

        <SubTitle>Tư vấn sản phẩm thông minh</SubTitle>
        <Para>
          Chatbot có thể tìm hiểu nhu cầu, đề xuất sản phẩm và cung cấp liên kết trực tiếp tới trang mua hàng. Thay vì chỉ trả lời theo kịch bản cố định, chatbot sử dụng AI và kho tri thức để đưa ra phản hồi phù hợp với câu hỏi của từng khách hàng.
        </Para>

        <SubTitle>Thu thập dữ liệu khách hàng tiềm năng</SubTitle>
        <Para>Chatbot có thể thu thập những thông tin cần thiết như:</Para>
        <BulletList items={['Họ và tên', 'Số điện thoại', 'Email', 'Nhu cầu quan tâm', 'Sản phẩm muốn tìm hiểu']} />
        <Para>Dữ liệu này có thể được chuyển vào CRM để nhân viên kinh doanh tiếp tục chăm sóc.</Para>

        <SubTitle>Quản lý lịch sử hội thoại</SubTitle>
        <Para>
          Toàn bộ lịch sử trao đổi giữa chatbot và khách hàng được lưu trong hệ thống. Doanh nghiệp có thể phân tích câu hỏi phổ biến, nhận diện nhu cầu mới, phát hiện vấn đề trong quá trình tư vấn và cải thiện nội dung sản phẩm.
        </Para>
      </Section>

      {/* AI viết nội dung */}
      <Section>
        <SectionTitle icon={PenTool}>AI hỗ trợ viết nội dung chuẩn SEO</SectionTitle>
        <Para>Orion tích hợp AI trực tiếp vào module sản phẩm và quản lý bài viết.</Para>

        <SubTitle>Viết mô tả sản phẩm bằng AI</SubTitle>
        <Para>Người quản trị chỉ cần nhập tên sản phẩm, thông tin chính và từ khóa. AI sẽ đề xuất:</Para>
        <BulletList items={[
          'Tiêu đề hấp dẫn',
          'Mô tả ngắn',
          'Nội dung giới thiệu chi tiết',
          'Các điểm nổi bật',
          'Từ khóa SEO',
          'Meta description',
          'Phiên bản tiếng Việt và tiếng Anh',
        ]} />
        <Para>Tính năng này giúp doanh nghiệp chuẩn hóa nội dung sản phẩm và giảm thời gian nhập liệu.</Para>

        <SubTitle>Viết bài blog chuẩn SEO</SubTitle>
        <Para>
          Đội ngũ marketing có thể nhập chủ đề, từ khóa và yêu cầu nội dung để AI hỗ trợ xây dựng bài viết có cấu trúc H1, H2 và H3. Nội dung AI tạo ra có thể được chỉnh sửa trong trình soạn thảo trước khi xuất bản.
        </Para>
      </Section>

      {/* CRM */}
      <Section>
        <SectionTitle icon={Users}>CRM – Quản lý khách hàng tập trung</SectionTitle>
        <Para>
          CRM của Orion tự động tổng hợp dữ liệu từ tài khoản đăng ký, đơn hàng, chatbot và hoạt động chăm sóc khách hàng.
        </Para>

        <SubTitle>Hồ sơ khách hàng toàn diện</SubTitle>
        <Para>Mỗi khách hàng có một hồ sơ riêng, bao gồm:</Para>
        <BulletList items={[
          'Thông tin liên hệ',
          'Địa chỉ giao hàng',
          'Lịch sử mua hàng',
          'Tổng doanh thu',
          'Nội dung trao đổi',
          'Ghi chú nội bộ',
          'Thẻ phân loại',
          'Công việc chăm sóc',
        ]} />
        <Para>
          Doanh nghiệp có thể gắn thẻ như khách hàng VIP, khách hàng tiềm năng, cần chăm sóc hoặc lâu chưa quay lại.
        </Para>

        <SubTitle>Giao việc chăm sóc khách hàng</SubTitle>
        <Para>
          Người quản lý có thể tạo nhiệm vụ, giao cho nhân viên, đặt thời hạn và theo dõi tiến độ. Việc kết nối CRM với dữ liệu bán hàng và chatbot giúp doanh nghiệp giảm nguy cơ bỏ sót khách hàng tiềm năng.
        </Para>
      </Section>

      {/* Cửa hàng trực tuyến */}
      <Section>
        <SectionTitle icon={ShoppingCart}>Cửa hàng trực tuyến hiện đại</SectionTitle>
        <Para>Orion cung cấp hệ thống cửa hàng trực tuyến tối ưu cho điện thoại, máy tính bảng và máy tính để bàn.</Para>

        <SubTitle>Trang chủ linh hoạt</SubTitle>
        <Para>Doanh nghiệp có thể quản lý:</Para>
        <BulletList items={[
          'Banner chính',
          'Nội dung khuyến mãi',
          'Sản phẩm nổi bật',
          'Danh mục sản phẩm',
          'Bài viết mới',
          'Nội dung tiếng Việt và tiếng Anh',
        ]} />
        <Para>Mọi thay đổi được thực hiện trong bảng quản trị mà không cần chỉnh sửa trực tiếp mã nguồn.</Para>

        <SubTitle>Quản lý sản phẩm chuyên nghiệp</SubTitle>
        <Para>
          Hệ thống hỗ trợ danh mục đa cấp, tìm kiếm, lọc theo từ khóa, giá và nhóm sản phẩm. Trang sản phẩm có thể hiển thị hình ảnh, mô tả, giá bán, tồn kho, đánh giá, sản phẩm liên quan và thông tin SEO.
        </Para>

        <SubTitle>Giỏ hàng và thanh toán đa kênh</SubTitle>
        <Para>Orion hỗ trợ:</Para>
        <BulletList items={[
          'Thanh toán khi nhận hàng – COD',
          'Chuyển khoản ngân hàng',
          'Mã QR VietQR',
          'Thanh toán qua VNPay',
          'Thẻ nội địa',
          'Visa và Mastercard',
        ]} />
        <Para>Hệ thống có thể tự động tạo mã QR thanh toán cho từng đơn hàng và hỗ trợ nhiều ngân hàng tại Việt Nam.</Para>

        <SubTitle>Tài khoản khách hàng</SubTitle>
        <Para>
          Khách hàng có thể đăng ký, đăng nhập, cập nhật thông tin, xem lịch sử mua hàng và theo dõi trạng thái đơn hàng. Thông tin tài khoản được bảo vệ bằng cơ chế xác thực phiên và mã hóa mật khẩu.
        </Para>
      </Section>

      {/* Dashboard */}
      <Section>
        <SectionTitle icon={Layout}>Bảng quản trị tập trung</SectionTitle>
        <Para>Dashboard cung cấp cái nhìn tổng quan về hoạt động doanh nghiệp.</Para>

        <SubTitle>Theo dõi chỉ số kinh doanh</SubTitle>
        <BulletList items={[
          'Doanh thu',
          'Số lượng đơn hàng',
          'Số lượng sản phẩm',
          'Số lượng khách hàng',
          'Đơn hàng mới',
          'Biểu đồ hoạt động theo thời gian',
        ]} />

        <SubTitle>Quản lý đơn hàng</SubTitle>
        <Para>Đơn hàng được quản lý theo các trạng thái:</Para>
        <BulletList items={['Chờ xử lý', 'Đang xác nhận', 'Đang giao hàng', 'Hoàn thành', 'Đã hủy']} />
        <Para>Mỗi đơn hàng có thông tin về sản phẩm, số lượng, tổng tiền, phương thức thanh toán và địa chỉ giao hàng.</Para>
      </Section>

      {/* Marketing */}
      <Section>
        <SectionTitle icon={Target}>Marketing đa kênh và đo lường ROI</SectionTitle>
        <Para>Orion hỗ trợ quản lý chiến dịch trên nhiều kênh như Email, Facebook, Google Ads, TikTok, Zalo và SMS.</Para>

        <SubTitle>Theo dõi hiệu quả chiến dịch</SubTitle>
        <BulletList items={[
          'Lượt tiếp cận',
          'Lượt nhấp',
          'Số lượt chuyển đổi',
          'Doanh thu',
          'Chi phí',
          'Tỷ suất hoàn vốn – ROI',
        ]} />
        <Para>Dữ liệu tập trung giúp doanh nghiệp đánh giá hiệu quả từng kênh và phân bổ ngân sách phù hợp.</Para>

        <SubTitle>Quản lý mã giảm giá</SubTitle>
        <Para>
          Hệ thống cho phép tạo mã giảm giá, thiết lập thời hạn, giới hạn lượt sử dụng và bật hoặc tắt theo từng chương trình.
        </Para>
      </Section>

      {/* Quản lý dự án */}
      <Section>
        <SectionTitle icon={FolderKanban}>Quản lý dự án và vận hành doanh nghiệp</SectionTitle>
        <Para>Orion hỗ trợ quản lý dự án, công việc, cơ cấu tổ chức và báo cáo nội bộ.</Para>

        <SubTitle>Quản lý dự án</SubTitle>
        <Para>Mỗi dự án có thể được thiết lập với:</Para>
        <BulletList items={[
          'Người phụ trách',
          'Thành viên tham gia',
          'Vai trò của từng thành viên',
          'Tiến độ hoàn thành',
          'Doanh thu kỳ vọng',
          'Nhật ký cập nhật',
        ]} />

        <SubTitle>Quản lý công việc</SubTitle>
        <Para>Công việc được quản lý theo quy trình:</Para>
        <BulletList items={['Cần thực hiện', 'Đang xử lý', 'Hoàn thành']} />
        <Para>Người quản lý có thể giao việc, đặt thời hạn và theo dõi tiến độ của từng cá nhân hoặc bộ phận.</Para>

        <SubTitle>Báo cáo hoạt động</SubTitle>
        <Para>
          Nhân viên có thể tạo báo cáo, đính kèm tài liệu và trao đổi trực tiếp trên hệ thống. AI hỗ trợ tóm tắt nội dung để lãnh đạo nắm bắt thông tin nhanh hơn.
        </Para>
      </Section>

      {/* Phân quyền */}
      <Section>
        <SectionTitle icon={Shield}>Phân quyền người dùng linh hoạt</SectionTitle>
        <Para>Orion hỗ trợ bảy nhóm vai trò chính:</Para>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <FeatureCard icon={Settings} title="Quản trị viên" desc="Có toàn quyền quản lý tất cả module, người dùng và cấu hình hệ thống." />
          <FeatureCard icon={UserCog} title="Nhân sự chuyên môn" desc="Các vai trò thiết kế, kinh doanh, chăm sóc KH, marketing và kế toán chỉ truy cập chức năng cần thiết." />
          <FeatureCard icon={Users} title="Đối tác phát triển" desc="Đối tác có thể được giới hạn trong phạm vi AI Agent riêng, không truy cập CRM hoặc đơn hàng." />
          <FeatureCard icon={Globe} title="Khách hàng" desc="Khách hàng chỉ có thể truy cập tài khoản và xem đơn hàng của mình." />
        </div>
        <Para>
          Cơ chế phân quyền giúp doanh nghiệp bảo vệ dữ liệu và hạn chế truy cập sai phạm vi.
        </Para>
      </Section>

      {/* Công nghệ */}
      <Section>
        <SectionTitle icon={Lock}>Công nghệ, bảo mật và khả năng triển khai</SectionTitle>
        <Para>Orion được xây dựng theo kiến trúc module, cho phép bổ sung tính năng mới mà không ảnh hưởng đến toàn bộ hệ thống.</Para>

        <SubTitle>Bảo mật dữ liệu</SubTitle>
        <BulletList items={[
          'Xác thực phiên đăng nhập',
          'Mã hóa mật khẩu',
          'Kiểm tra quyền tại từng API',
          'Phân quyền theo vai trò',
          'Tách lớp AI khỏi phần mã nguồn thuê ngoài',
        ]} />

        <SubTitle>Chủ động mã nguồn và hạ tầng</SubTitle>
        <Para>Doanh nghiệp có thể sở hữu mã nguồn và triển khai Orion trên VPS riêng hoặc nền tảng đám mây.</Para>

        <SubTitle>Giao diện hiện đại</SubTitle>
        <BulletList items={[
          'Responsive trên nhiều thiết bị',
          'Giao diện song ngữ Việt – Anh',
          'Chuyển đổi ngôn ngữ với một thao tác',
          'Chế độ sáng và tối',
          'Hiệu ứng chuyển động mượt mà',
          'Thông báo theo thời gian thực',
        ]} />
      </Section>

      {/* Giá trị */}
      <Section>
        <SectionTitle icon={Sparkles}>Giá trị Orion mang lại cho doanh nghiệp</SectionTitle>
        <Para>
          Orion giúp doanh nghiệp xây dựng một hệ thống quản trị thống nhất với AI là năng lực cốt lõi. Những giá trị nổi bật gồm:
        </Para>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
          {[
            'Xây dựng nhiều AI Agent chuyên biệt',
            'Tự động tư vấn và chăm sóc khách hàng 24/7',
            'Khai thác kho tri thức riêng của doanh nghiệp',
            'Hỗ trợ viết nội dung và mô tả sản phẩm chuẩn SEO',
            'Tóm tắt báo cáo cho lãnh đạo',
            'Tập trung dữ liệu bán hàng, khách hàng và vận hành',
            'Quản lý marketing và đo lường ROI',
            'Phân quyền truy cập theo từng vị trí',
            'Chủ động mã nguồn và hạ tầng',
            'Sẵn sàng mở rộng theo quy mô doanh nghiệp',
          ].map((v, i) => (
            <div key={i} className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/10 rounded-lg">
              <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="pb-20">
        <div className="mt-16 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Orion – Đưa AI vào trung tâm hoạt động doanh nghiệp
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Orion không chỉ là phần mềm bán hàng, CRM hay chatbot riêng lẻ. Đây là nền tảng quản trị doanh nghiệp lấy AI làm trung tâm, kết nối AI Agent, kho tri thức, khách hàng, bán hàng, marketing, dự án và điều hành trên cùng một hệ thống.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Với kiến trúc Multi-AI Agent, khả năng kết nối nhiều nhà cung cấp AI, triển khai trên hạ tầng riêng và quản lý dữ liệu tập trung, Orion giúp doanh nghiệp từng bước tự động hóa quy trình, nâng cao năng suất và chủ động phát triển trong kỷ nguyên AI.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/products">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Xem sản phẩm
              </Button>
            </Link>
            <Link href="/#lien-he">
              <Button size="lg" variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Liên hệ ngay
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
