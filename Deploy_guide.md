# DEPLOY_GUIDE — Triển khai Orion lên server Ubuntu (Docker + aaPanel)

> Hướng dẫn từng bước đưa Orion lên server riêng Ubuntu đã cài sẵn **Docker** và **aaPanel**.
> Kết quả: app chạy trong container, PostgreSQL + MinIO chạy Docker, aaPanel làm reverse proxy + SSL.

---

## 0. Yêu cầu

- Ubuntu 20.04/22.04, đã cài Docker + Docker Compose + aaPanel.
- Tên miền đã trỏ về IP server (bản ghi A).
- Mã nguồn Orion (.zip export từ Abacus).

---

## 1. Chuẩn bị mã nguồn

```bash
mkdir -p /www/orion && cd /www/orion
# Tải và giải nén mã nguồn .zip vào đây; đảm bảo có thư mục nextjs_space/
unzip orion.zip -d .
ls nextjs_space   # phải thấy app/ prisma/ lib/ package.json ...
```

---

## 2. Chạy PostgreSQL + MinIO bằng Docker Compose

Tạo file `/www/orion/infra.yml`:

```yaml
version: "3.8"
services:
  db:
    image: postgres:16
    container_name: orion-db
    restart: always
    environment:
      POSTGRES_DB: orion
      POSTGRES_USER: orion
      POSTGRES_PASSWORD: CHANGE_ME_DB
    volumes:
      - orion_db:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  minio:
    image: minio/minio
    container_name: orion-minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: orionminio
      MINIO_ROOT_PASSWORD: CHANGE_ME_MINIO
    volumes:
      - orion_minio:/data
    ports:
      - "9000:9000"
      - "9001:9001"

volumes:
  orion_db:
  orion_minio:
```

```bash
cd /www/orion
docker compose -f infra.yml up -d
```

Tạo bucket trong MinIO: mở `http://IP_SERVER:9001` (đăng nhập bằng user/pass ở trên) → tạo bucket tên `orion` → đặt quyền **public** cho thư mục chứa ảnh công khai (hoặc để private nếu chỉ dùng URL ký).

---

## 3. Tạo file .env

Tạo `/www/orion/nextjs_space/.env`:

```env
DATABASE_URL=postgresql://orion:CHANGE_ME_DB@db:5432/orion?schema=public
NEXTAUTH_SECRET=DÁN_CHUỖI_NGẪU_NHIÊN_DÀI
NEXTAUTH_URL=https://orion.ten-mien-cua-ban.com
ABACUSAI_API_KEY=KHÓA_LLM_API_CỦA_BẠN

# Lưu trữ dùng MinIO (S3-compatible)
AWS_REGION=us-east-1
AWS_BUCKET_NAME=orion
AWS_FOLDER_PREFIX=uploads
AWS_ENDPOINT=http://minio:9000
AWS_PUBLIC_ENDPOINT=https://cdn.ten-mien-cua-ban.com
AWS_ACCESS_KEY_ID=orionminio
AWS_SECRET_ACCESS_KEY=CHANGE_ME_MINIO
S3_FORCE_PATH_STYLE=true
```

> Tạo `NEXTAUTH_SECRET` bằng: `openssl rand -base64 32`
> `ABACUSAI_API_KEY` lấy tại: https://apps.abacus.ai/chatllm/admin/api-keys
> Nếu chưa có CDN riêng, có thể để `AWS_PUBLIC_ENDPOINT=http://IP_SERVER:9000`.

---

## 4. Dockerfile cho app

Tạo `/www/orion/nextjs_space/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install

COPY . .
RUN yarn prisma generate && yarn build

EXPOSE 3000
CMD ["sh", "-c", "yarn prisma migrate deploy || yarn prisma db push; node_modules/.bin/tsx --require dotenv/config scripts/safe-seed.ts || true; yarn start"]
```

> Lệnh CMD: tự đồng bộ schema, seed dữ liệu mẫu (chỉ upsert nên an toàn), rồi khởi động.
> Nếu KHÔNG muốn seed mỗi lần khởi động, bỏ đoạn `tsx ... safe-seed.ts`.

---

## 5. Build & chạy app container

Thêm service app vào `infra.yml` (hoặc chạy riêng):

```bash
cd /www/orion/nextjs_space
docker build -t orion-app .
docker run -d --name orion-app --restart always \n  --network orion_default \n  --env-file .env \n  -p 3000:3000 \n  orion-app
```

> `--network orion_default` là mạng do docker compose tạo (kiểm tra bằng `docker network ls`).
> Nhờ chung mạng, app gọi `db:5432` và `minio:9000` theo tên service.

Kiểm tra: `docker logs -f orion-app` → thấy `Ready` và `curl http://localhost:3000` trả về HTML.

---

## 6. Reverse proxy + SSL bằng aaPanel

1. Vào aaPanel → **Website** → **Add site** → nhập tên miền (vd `orion.ten-mien-cua-ban.com`), không cần tạo thư mục PHP.
2. Mở site vừa tạo → **Reverse proxy** → **Add reverse proxy**:
   - Target URL: `http://127.0.0.1:3000`
   - Send domain: giữ mặc định
3. Vào tab **SSL** → chọn **Let's Encrypt** → cấp và bật **Force HTTPS**.
4. Lưu lại. Mở `https://orion.ten-mien-cua-ban.com` để kiểm tra.

> Nếu dùng CDN/subdomain cho MinIO, tạo thêm 1 site (vd `cdn.ten-mien-cua-ban.com`) reverse proxy về `http://127.0.0.1:9000`.

---

## 7. Cập nhật phiên bản mới

```bash
cd /www/orion/nextjs_space
# Cập nhật mã nguồn mới (giải nén đè hoặc git nội bộ)
docker build -t orion-app .
docker stop orion-app && docker rm orion-app
docker run -d --name orion-app --restart always \n  --network orion_default --env-file .env -p 3000:3000 orion-app
```

---

## 8. Sao lưu (khuyến nghị)

```bash
# Backup database
docker exec orion-db pg_dump -U orion orion > /www/backup/orion_$(date +%F).sql
# Backup dữ liệu MinIO
docker run --rm -v orion_minio:/data -v /www/backup:/backup alpine \n  tar czf /backup/minio_$(date +%F).tgz /data
```

---

## 9. Xử lý sự cố nhanh

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| App không lên, log báo DB | Sai `DATABASE_URL` / DB chưa chạy | Kiểm tra container `orion-db`, đúng host `db` |
| Upload ảnh lỗi | Sai endpoint/khóa MinIO, chưa tạo bucket | Kiểm tra `AWS_*`, tạo bucket `orion` |
| Đăng nhập lỗi vòng lặp | Sai `NEXTAUTH_URL` | Đặt đúng URL https đang dùng |
| Chat AI không trả lời | Thiếu/sai `ABACUSAI_API_KEY` | Kiểm tra khóa còn hiệu lực |
| 502 Bad Gateway | App chưa chạy / sai cổng proxy | `docker logs orion-app`, target `127.0.0.1:3000` |