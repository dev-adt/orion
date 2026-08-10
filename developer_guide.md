# DEVELOPER_GUIDE — Hướng dẫn phát triển & nâng cấp Orion

> Dành cho lập trình viên tiếp nhận, chỉnh sửa và nâng cấp dự án Orion.

---

## 1. Ngăn xếp công nghệ

| Lớp | Công nghệ |
|---|---|
| Framework | **Next.js 14** (App Router) — **không nâng lên Next 15** |
| Ngôn ngữ | TypeScript 5 |
| UI | TailwindCSS 3 + shadcn/ui (Radix) |
| ORM / DB | Prisma 6 + PostgreSQL |
| Auth | NextAuth v4 + Prisma adapter (CredentialsProvider) |
| Lưu trữ | S3-compatible (AWS S3 hoặc MinIO) qua `@aws-sdk/client-s3` |
| AI | LLM API qua `ABACUSAI_API_KEY` (RouteLLM, chuẩn OpenAI) |
| Quản lý gói | **yarn** (không dùng npm/npx) |

---

## 2. Chạy môi trường dev

```bash
cd nextjs_space
yarn install
yarn prisma generate
yarn prisma db push        # đồng bộ schema
yarn prisma db seed        # nạp dữ liệu mẫu (an toàn, chỉ upsert)
yarn dev                   # http://localhost:3000
```

Build kiểm tra: `yarn build` · Kiểm tra kiểu: `yarn tsc --noEmit`

---

## 3. Cấu trúc thư mục quan trọng

```
app/            # Route + trang (App Router). Mỗi thư mục = 1 route.
  api/         # API route (route.ts). Có 'export const dynamic' khi cần runtime.
  admin/       # Trang quản trị + _components/ (UI đặc thù admin)
components/     # navbar, footer, theme, ui/ (shadcn tái sử dụng)
lib/            # Logic dùng chung:
  db.ts        # PrismaClient singleton (tái dùng kết nối)
  s3.ts        # Presigned URL, getFileUrl, deleteFile
  aws-config.ts# Tạo S3 client (hỗ trợ MinIO qua AWS_ENDPOINT)
  footer-config.ts / payment-config.ts / operations.ts
prisma/schema.prisma  # 35 model — nguồn chân lý của DB
scripts/seed.ts       # Dữ liệu mẫu (CHỈ upsert)
scripts/safe-seed.ts  # Bọc chặn delete trong seed
```

---

## 4. Quy tắc bắt buộc

### Database / Prisma
- Thay đổi schema phải **tương thích ngược** (thêm cột nullable/mặc định). Tránh `db push --force-reset`/`--accept-data-loss` trên production → mất dữ liệu.
- Luôn qua `lib/db.ts` (singleton). DB có giới hạn kết nối và timeout ngắn — không giữ kết nối lâu.
- Sau đổi schema: `yarn prisma generate` rồi cập nhật code liên quan.

### Seed
- `scripts/seed.ts` **chỉ được dùng `upsert`**, không `delete/deleteMany` (bị `safe-seed.ts` chặn).

### Auth & bảo mật
- Mọi API đọc/ghi dữ liệu theo người dùng phải gọi `getServerSession(authOptions)`, trả 401 nếu chưa đăng nhập; lấy `userId` từ session, **không** từ URL.
- Không lộ khóa/bí mật ra client. Bí mật chỉ đọc từ `.env` phía server.
- Signup ở `/api/signup`; các route auth khác dưới `/api/auth/...`.

### SSR / Hydration
- Không để `Math.random()`, `Date.now()`, `new Date()` chạy khi render SSR — đưa vào `useEffect` hoặc component client-only.
- Định dạng ngày/số phải truyền locale + timeZone rõ ràng để server và client khớp nhau.

### Ảnh
- Dùng `next/image`, đặt container `relative` + tỉ lệ cố định khi dùng `fill`, luôn có `alt` mô tả.

---

## 5. Thêm tính năng — quy trình mẫu

**Thêm một thực thể mới (ví dụ "Banner"):**
1. Thêm `model Banner` vào `prisma/schema.prisma` → `yarn prisma generate` → `yarn prisma db push`.
2. Tạo API `app/api/admin/banners/route.ts` (GET/POST) + `[id]/route.ts` (PUT/DELETE), bảo vệ bằng session + kiểm tra vai trò.
3. Tạo UI quản trị trong `app/admin/_components/banner-manager.tsx`, gắn vào trang `/admin`.
4. Nếu cần hiển thị công khai: thêm truy vấn ở trang tương ứng.
5. (Tuỳ chọn) Thêm dữ liệu mẫu vào `seed.ts` bằng `upsert`.
6. `yarn build` + `yarn tsc --noEmit` trước khi giao.

---

## 6. Tích hợp AI (LLM API)

- Endpoint chuẩn OpenAI: `https://routellm.abacus.ai/v1/chat/completions`, header `Authorization: Bearer ${ABACUSAI_API_KEY}`.
- Xem mẫu tại `app/api/ai/chat/route.ts` và `app/api/embed/agent/[id]/chat/route.ts`.
- Sinh ảnh: thêm `modalities: ["image"]` trong payload.
- Cấu hình model/hệ thống prompt lưu ở model `AiConfig` (key `default`).

---

## 7. Thanh toán VNPay

- Cấu hình lưu ở `SiteSetting`/`payment-config.ts`; route xử lý ở `app/api/vnpay/*` (create-payment, ipn, return).
- Có hỗ trợ VietQR (`buildVietQrUrl` trong `payment-config.ts`).

---

## 8. Lưu trữ file

- Upload qua presigned URL: xem `lib/s3.ts` (`generatePresignedUploadUrl`) và `app/api/upload/presigned`.
- Chỉ lưu **cloud_storage_path** trong DB, không lưu đường dẫn local.
- Self-host: đặt `AWS_ENDPOINT` (MinIO) + `AWS_ACCESS_KEY_ID/SECRET`; `aws-config.ts` tự bật path-style.

---

## 9. Checklist trước khi phát hành

- [ ] `yarn tsc --noEmit` không lỗi
- [ ] `yarn build` thành công
- [ ] Thay đổi schema tương thích ngược, đã `prisma generate`
- [ ] API mới có bảo vệ session/phân quyền
- [ ] Không lộ bí mật ra client
- [ ] Kiểm tra thủ công tính năng vừa sửa trên trình duyệt
- [ ] Sao lưu DB trước khi deploy production

---

## 10. Không nên làm

- ❌ Nâng Next.js lên 15 / dùng API chỉ có ở React 19.
- ❌ `prisma db push --force-reset` / `--accept-data-loss` trên production.
- ❌ `delete/deleteMany` trong seed.
- ❌ Hardcode khóa API trong code hoặc client.
- ❌ Đổi cấu trúc thư mục gốc (`nextjs_space/`) một cách tùy tiện.