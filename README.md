# 🚀 VivuChat Backend

Đây là dự án backend của ứng dụng chat **VivuChat**, được phát triển bằng [NestJS](https://nestjs.com/) – một framework mạnh mẽ và hiện đại cho Node.js. Dự án tích hợp nhiều công nghệ tiên tiến như xác thực JWT, Redis cache, gửi email, lưu trữ file với AWS S3, WebSocket real-time và BullMQ để xử lý job nền.

---

## 📚 Mục Lục

- [🚀 Giới thiệu](#-vivuChat-backend)
- [📦 Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [⚙️ Cài đặt](#️-cài-đặt)
- [🔐 Thiết lập môi trường](#-thiết-lập-môi-trường)
- [📁 Cấu trúc dự án](#-cấu-trúc-dự-án)
- [🧪 Swagger API](#-swagger-api)
- [🛠 Scripts hữu ích](#-scripts-hữu-ích)
- [📧 Liên hệ](#-liên-hệ)
- [📄 License](#-license)

---

## 📦 Công Nghệ Sử Dụng

- ⚙️ **NestJS** - Framework backend chính
- 🗄️ **TypeORM + MySQL** - ORM & cơ sở dữ liệu quan hệ
- 🔒 **Passport + JWT** - Xác thực người dùng
- 🧠 **Redis** - Caching & Pub/Sub
- ☁️ **AWS S3** - Lưu trữ file
- 📩 **Nodemailer** - Gửi email
- 🧵 **Bull + BullMQ** - Hàng đợi xử lý công việc
- 🌐 **Swagger** - Tài liệu API
- 💬 **Socket.IO** - Giao tiếp thời gian thực (WebSocket)

---

## ⚙️ Cài Đặt

### 1. Clone và cài đặt dependencies

```bash
git clone https://github.com/DaoNguyen2941/app-chat-nestjs.git
cd app-chat-nestjs
npm install
```

### 2. Build và chạy ứng dụng

```bash
# Chạy dev
npm run start:dev

# Build production
npm run build

# Chạy production
npm run start:prod
```

---

## 🔐 Thiết Lập Môi Trường

Tạo file `.env` trong thư mục gốc với nội dung như sau:

```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=yourpassword
DATABASE_NAME=yourdatabasename

EMAIL_SERVICE=gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_email_app_password
MAIL_FROM=your-email@gmail.com

SECRET_JWT=your_jwt_secret
JWT_REFRESH_TOKEN_SECRET=your_jwt_secret_refresh_token
JWT_RESET_PASSWORD=Password
JWT_REFRESH_TOKEN_EXPIRATION_TIME=606800 //7day
JWT_EXPIRATION_TIME_DEAULT=900 //15p

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=my_redis

CLOUDFLARE_ACCESS_KEY_ID=you_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=you_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=you_bucket_name
CLOUDFLARE_ACCOUNT_ID=you_account_id
R2_PUBLIC_URL=you_public_url
ENDPOINT=you_endpoint

```

---

## 📁 Cấu Trúc Dự Án

```
src/
├── common/               # 🌐 Các thành phần dùng chung (DTOs, decorators, guards, pipes, filters, helpers, constants)
├── core/                 # ⚙️ Cấu hình toàn cục (database, config module, global interceptors, middleware, logging...)
├── gateways/             # 📡 Xử lý WebSocket real-time (chat, notification...)
├── mailer/               # 📧 Dịch vụ gửi email (xác thực, thông báo, quên mật khẩu...)
├── modules/              # 🧩 Các module chính (auth, user, chat, message, group, friend...)
│   ├── auth/
│   ├── users/
│   ├── chat/
│   └── ...
├── object-storage/       # ☁️ Quản lý upload file với R2/S3 (service chuẩn hóa, adapter R2)
├── redis/                # 🧠 Redis client và các dịch vụ pub/sub (chat socket, cache session, queue)
├── app.module.ts         # 📦 Module gốc – tập hợp các module chính
└── main.ts               # 🚀 Entry point – nơi bootstrap ứng dụng


```

---

## 🧪 Swagger API

> 🔗 Truy cập: [http://localhost:3001/api](http://localhost:3001/api)

Swagger được cấu hình tự động để hiển thị toàn bộ tài liệu REST API.

---

## 🛠 Scripts Hữu Ích

| Lệnh                          | Mô tả                                               |
|-------------------------------|------------------------------------------------------|
| `npm run start:dev`           | Chạy app ở chế độ phát triển                       |
| `npm run build`               | Biên dịch source TypeScript                        |
| `npm run start:prod`          | Chạy bản build                                      |
| `npm run test`                | Chạy toàn bộ unit test                             |
| `npm run test:e2e`            | Chạy end-to-end test                               |
| `npm run typeorm:run-migrations`     | Chạy migration                            |
| `npm run typeorm:generate-migration --name=xyz` | Tạo migration từ schema |

---

## ✅ TODO Features

🔐 Authentication & Authorization
- [x] Đăng ký / đăng nhập bằng JWT (Passport Local + JWT Strategy)
- [x] Middleware bảo vệ route (Passport Guard)
- [x] Gửi mail xác thực tài khoản
- [x] Refresh Token 
- [x] Quên mật khẩu
- [ ] 2FA (xác thực 2 bước)

🧑‍🤝‍🧑 Kết bạn & Quản lý bạn bè
- [x] Gửi / chấp nhận / từ chối lời mời kết bạn
- [x] Hủy kết bạn
- [x] Xem danh sách / thông tin bạn bè
- [x] Bắt đầu trò chuyện 1-1 với bạn

💬 Nhắn tin & Chat
- [x] Chat real-time bằng WebSocket (Socket.IO Gateway)
- [x] Chat nhóm (tạo nhóm, thêm/xóa thành viên)
- [ ] Tin nhắn thoại / ảnh / video (media message)
- [ ] Đánh dấu đã xem, gỡ hoặc sửa tin nhắn
- [ ] Thông báo đang nhập / đang gõ
- [ ] Mã hóa tin nhắn đầu cuối E2EE

---

## 📧 Liên Hệ

> 📬 Email: [daonguyen2941@gmail.com](mailto:daonguyen2941@gmail.com)  
> 👥 GitHub: [@DaoNguyen2941](https://github.com/DaoNguyen2941)

---

## 📜 Giấy Phép

Dự án được phát hành theo giấy phép MIT. Bạn được phép sử dụng, sửa đổi và triển khai ứng dụng với mục đích tham khảo.

> 💡 **VivuChat** là dự án cá nhân học tập và nghiên cứu, rất vui nếu bạn thấy hữu ích và đóng góp!