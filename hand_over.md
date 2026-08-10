# HAND_OVER — Dự án ORION

> Tài liệu bàn giao để **clone / dựng lại dự án Orion 100%** ở lần sau (trên Abacus hoặc nền tảng AI khác).
> Nguyên tắc vàng: **luôn kèm file mã nguồn .zip gốc + file hand_over.md này** thì bản clone mới chính xác, không sót.

---

## 1. Tổng quan

- **Tên dự án:** Orion (clone rebrand từ dự án gốc "ADT").
- **Loại:** Web app full-stack thương mại điện tử + AI + CRM (song ngữ Việt/Anh).
- **Công nghệ:** Next.js 14 (App Router) · TypeScript · Prisma · PostgreSQL · TailwindCSS · NextAuth · S3-compatible storage · LLM API.
- **Ngôn ngữ giao diện chính:** Tiếng Việt.

---

## 2. Cấu trúc chính

```
nextjs_space/
├── app/
│   ├── admin/            # Trang quản trị (RBAC) + _components (CRM, AI agent, payment, training...)
│   ├── api/              # ~80 API route (xem mục 5)
│   ├── auth/             # Đăng nhập / đăng ký
│   ├── cart/ checkout/   # Giỏ hàng, thanh toán
│   ├── cong-cu-ai/       # Công cụ AI
│   ├── embed/agent/[id]/ # Nhúng AI agent (iframe)
│   ├── orion/            # Trang giới thiệu thương hiệu
│   ├── products/         # Sản phẩm + chi tiết
│   ├── tai-khoan/        # Tài khoản người dùng
│   ├── thanh-toan/       # Kết quả đơn hàng theo mã
│   ├── tin-tuc/          # Tin tức / blog
│   ├── trang/[slug]/     # Trang tĩnh động (CMS)
│   ├── vnpay-ket-qua/    # Kết quả thanh toán VNPay
│   ├── layout.tsx        # Root layout (metadata, script chatbot)
│   └── page.tsx          # Trang chủ
├── components/           # navbar, footer, ui/ (shadcn), theme...
├── lib/                  # db, s3, aws-config, footer-config, payment-config, operations...
├── prisma/schema.prisma  # 35 model dữ liệu
├── scripts/seed.ts       # Dữ liệu mẫu (chỉ dùng upsert, KHÔNG delete)
└── scripts/safe-seed.ts  # Bọc bảo vệ, chặn delete trong seed
```

---

## 3. Cơ sở dữ liệu — 35 model (prisma/schema.prisma)

User, Account, Session, VerificationToken, Category, Product, Order, OrderItem, CartItem, Post, PostCategory, Page, SiteSetting, AiConfig, AiUsageLog, KnowledgeDoc, Review, ChatSession, ChatLog, AiAgent, AiAgentDoc, CrmNote, CrmTag, CrmContactTag, CrmTask, Project, ProjectMember, ProjectUpdate, Campaign, Coupon, Lead, OrgPosition, OpTask, OpReport, OpProposal.

---

## 4. Phân quyền (RBAC)

Các vai trò: `admin`, `web_designer`, `sales`, `marketing`, `accountant`, `dev_partner`, `customer`.
Các vai trò nhân viên (STAFF_ROLES) được vào trang `/admin`; `customer` là khách hàng thường.

---

## 5. Nhóm API chính (thư mục app/api)

- `admin/*` — ai-agents, ai-config, ai-usage, categories, chat-sessions, crm (contacts/notes/tags/tasks), knowledge, marketing (campaigns/coupons), operations (positions/reports/proposals/tasks/upload/download).
- `ai/*` — chat, agents.
- `auth/*` — NextAuth (login, callback, session...).
- `signup` — đăng ký (`/api/signup`).
- `products`, `categories`, `posts`, `pages`, `orders`, `leads`, `chat-sessions`.
- `payment-config`, `vnpay/*` (create-payment, ipn, return), `upload/presigned`, `embed/agent/[id]/chat`.

---

## 6. Tài khoản dữ liệu mẫu (sau khi seed)

| Vai trò        | Email                | Mật khẩu     |
|----------------|----------------------|--------------|
| Quản trị viên  | admin@orion.vn       | Admin@2026   |
| Thiết kế web   | designer@orion.vn    | Staff@2026   |
| Chăm sóc KH    | sales@orion.vn       | Staff@2026   |
| Marketing      | marketing@orion.vn   | Staff@2026   |
| Kế toán        | ketoan@orion.vn      | Staff@2026   |
| Khách hàng demo| customer@orion.vn    | Staff@2026   |

> Ngoài ra có 1 tài khoản admin kỹ thuật ẩn do nền tảng sinh ra (dạng `abacus-xxxx@example.com`) — không dùng cho người dùng cuối.

---

## 7. Biến môi trường (.env)

| Biến               | Vai trò                                              |
|--------------------|------------------------------------------------------|
| DATABASE_URL       | Chuỗi kết nối PostgreSQL                              |
| NEXTAUTH_SECRET    | Khóa mã hóa phiên đăng nhập (chuỗi ngẫu nhiên dài)    |
| NEXTAUTH_URL       | URL gốc của app (chỉ cần khi self-host)              |
| ABACUSAI_API_KEY   | Khóa gọi LLM API (chat AI, tạo nội dung)             |
| AWS_REGION         | Vùng của bucket lưu trữ                               |
| AWS_BUCKET_NAME    | Tên bucket S3                                        |
| AWS_FOLDER_PREFIX  | Tiền tố thư mục trong bucket                          |
| AWS_PROFILE        | (Abacus hosting) profile credential                  |
| AWS_ENDPOINT       | (Self-host) endpoint S3-compatible / MinIO           |
| AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY | (Self-host) khóa S3           |

---

## 8. Các bước clone lại (đã kiểm chứng)

1. Giải nén mã nguồn .zip gốc; nguồn thật nằm ở `.../nextjs_space/`.
2. Copy code vào dự án đích (loại trừ: `node_modules`, `package.json`, `yarn.lock`, `.env`, `.next`, `.build`, `Dockerfile`, `docker-compose.yml`).
3. Sửa đường dẫn `output` của Prisma generator trong `schema.prisma` cho khớp dự án đích.
4. Khởi tạo LLM API + Cloud storage (điền các biến `.env`).
5. `yarn add` các gói còn thiếu (Orion cần thêm: **mammoth**, **xlsx**).
6. `yarn prisma generate` → `yarn prisma db push` để tạo bảng.
7. Đổi thương hiệu: **ADT → Orion** trong toàn bộ .ts/.tsx (tên công ty, email `@orion.vn`, slug `orion-*`, URL fallback). Kiểm tra `grep -ri adt` phải trả về rỗng.
8. Cập nhật tài khoản test ẩn trong `seed.ts` theo giá trị nền tảng cấp.
9. `yarn prisma db seed` → build → test → checkpoint.

---

## 9. Lưu ý quan trọng

- `scripts/seed.ts` **chỉ dùng `upsert`, tuyệt đối không `delete/deleteMany`** (bị `safe-seed.ts` chặn để tránh mất dữ liệu production).
- Logo (`public/logo.png`, `og-image.png`) hiện vẫn là ảnh gốc — chỉ đổi phần chữ, chưa vẽ lại logo Orion.
- Layout đã có sẵn thẻ script chatbot `apps.abacus.ai/chatllm/appllm-lib.js`.
- `lib/aws-config.ts` đã hỗ trợ cả AWS S3 lẫn MinIO (self-host) qua biến `AWS_ENDPOINT`.