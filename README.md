# 🛡️ Production-Ready Node.js Auth & RESTful API Starter

ชุด **Starter Boilerplate / Microservice Backend** สำหรับระบบ **Authentication & Authorization (RBAC)** พร้อมใช้งาน พัฒนาด้วย **Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL, Zod, และ Swagger UI** ออกแบบตามสถาปัตยกรรมแบบ Clean Layered Architecture เพื่อให้นำไปต่อยอดใช้กับโปรเจกต์ใหม่ๆ หรือ Microservices ได้ทันที

---

## 🌟 จุดเด่นและฟีเจอร์หลัก (Key Features)

- 🔒 **Dual-Token JWT Authentication**: 
  - **Access Token** (อายุสั้น ปลอดภัยสูง) + **Refresh Token** (อายุยาว บันทึกใน Database)
  - **Token Rotation & Reuse Detection**: หมุนเวียน Refresh Token ทุกครั้งที่ขอ Token ใหม่ พร้อมตรวจจับการนำ Token เดิมมาใช้ซ้ำ (หากพบจะตัดสิทธิ์ทุก Session ทันที)
  - **Session Management**: รองรับการ Logout เฉพาะเครื่อง หรือ Logout All Devices (ออกจากระบบทุกอุปกรณ์)
- 🌐 **Hybrid Token Transport**:
  - รองรับทั้ง **Authorization: Bearer `<token>`** (สำหรับ Mobile App, Microservices, Postman)
  - รองรับ **HttpOnly Cookies** (สำหรับ Web App เช่น Next.js, React, Vue เพื่อป้องกันการโจมตี XSS)
- 👥 **Role-Based Access Control (RBAC)**:
  - กำหนด Role: `USER`, `ADMIN`, `SUPERADMIN`
  - มี Middleware `requireRoles(...)` และ `requireMinRole(...)` ใช้งานง่าย
- 🔑 **Password Recovery**:
  - ลืมรหัสผ่าน (Forgot Password) / ตั้งรหัสใหม่ (Reset Password) ผ่าน Cryptographic Token ส่งทาง Email (Nodemailer)
  - รองรับ **Mock Mode** แสดง Token ทาง Console ในช่วง Development โดยไม่ต้องตั้งค่า SMTP
- 🛡️ **Security & Validation**:
  - **Zod**: Type-safe Schema Validation ตรวจสอบ Request Body/Query/Params แบบเข้มงวด
  - **Helmet**: ป้องกัน HTTP Header ช่องโหว่ยอดนิยม
  - **CORS**: รองรับ Cross-Origin Resource Sharing พร้อม Credentials/Cookies
  - **Rate Limiting**: ป้องกันการ Brute Force ล็อกอินด้วย `express-rate-limit`
  - **Bcrypt**: เข้ารหัส Password ด้วย Salt Rounds มาตรฐาน
- 📚 **Interactive Swagger / OpenAPI 3.0**:
  - ดูคู่มือและทดสอบ API ผ่าน Web Browser ได้ทันทีที่ `/api-docs`
- 🐳 **Docker & Container Ready**:
  - มี `Dockerfile` (Multi-stage build) และ `docker-compose.yml` (PostgreSQL + App) รันได้ในคำสั่งเดียว

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
auth/
├── .env.example              # ตัวอย่าง Environment Variables
├── .env                      # ไฟล์ Environment สำหรับ Development
├── Dockerfile                # Docker Multi-stage build
├── docker-compose.yml        # PostgreSQL + Node.js App
├── package.json              # รายการ Dependencies และ Scripts
├── tsconfig.json             # การตั้งค่า TypeScript
├── prisma/
│   ├── schema.prisma         # Database Models (User, RefreshToken, PasswordResetToken)
│   └── seed.ts               # ข้อมูลเริ่มต้นสำหรับทดสอบ (Superadmin, Admin, User)
└── src/
    ├── app.ts                # การตั้งค่า Express App, Middlewares, และ Routes
    ├── server.ts             # Entry point ของ Server พร้อม Graceful Shutdown
    ├── config/
    │   ├── env.ts            # ตรวจสอบ Environment Variables ด้วย Zod
    │   ├── prisma.ts         # Prisma Client Singleton
    │   └── swagger.ts        # การตั้งค่า Swagger / OpenAPI
    ├── constants/
    │   └── roles.ts          # ค่าคงที่ Role และ Role Hierarchy
    ├── errors/
    │   └── app-error.ts      # Custom Error Classes (400, 401, 403, 404, 409, 429)
    ├── middlewares/
    │   ├── auth.middleware.ts       # ตรวจสอบ Hybrid Token & ตรวจสอบสิทธิ์ RBAC
    │   ├── error.middleware.ts      # Centralized Global Error Handler
    │   ├── rate-limiter.middleware.ts # Rate Limiting
    │   └── validate.middleware.ts   # Zod Validation Middleware
    ├── schemas/
    │   ├── auth.schema.ts    # Zod Schemas สำหรับ Auth
    │   └── user.schema.ts    # Zod Schemas สำหรับ User Management
    ├── services/
    │   ├── auth.service.ts   # Business Logic ด้าน Authentication & Token
    │   ├── user.service.ts   # Business Logic ด้าน User & RBAC
    │   └── email.service.ts  # บริการส่งอีเมล (SMTP / Mock Console)
    ├── controllers/
    │   ├── auth.controller.ts # Handlers สำหรับ Auth
    │   └── user.controller.ts # Handlers สำหรับ User
    ├── routes/
    │   ├── index.ts          # Master Router & Health check
    │   ├── auth.routes.ts    # เส้นทาง API สำหรับ Auth พร้อม Swagger Doc
    │   └── user.routes.ts    # เส้นทาง API สำหรับ User พร้อม RBAC
    ├── types/
    │   └── express.d.ts      # Type Definitions เสริมสำหรับ Express Request
    └── utils/
        ├── hash.util.ts      # ฟังก์ชัน Hash Password & Token
        ├── jwt.util.ts       # ฟังก์ชันสร้าง/ตรวจสอบ JWT และ Cookie Management
        ├── logger.util.ts    # Structured Logger
        └── response.util.ts  # ฟังก์ชันส่ง Response JSON แบบมาตรฐาน
```

---

## 🚀 เริ่มต้นใช้งาน (Quick Start)

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำ สะดวกที่สุด)

รัน Database PostgreSQL พร้อมกับ Backend Application ทันที:

```bash
docker-compose up -d
```

เข้าถึงระบบ:
- **API Health Check**: `http://localhost:5000/api/v1/health`
- **Swagger UI API Docs**: `http://localhost:5000/api-docs`

---

### วิธีที่ 2: รันบนเครื่อง Local (Development)

#### 1. ติดตั้ง Dependencies
```bash
npm install
```

#### 2. ตั้งค่าไฟล์ `.env`
คัดลอกไฟล์ `.env.example` เป็น `.env` และแก้ไขค่าเชื่อมต่อฐานข้อมูล:
```bash
cp .env.example .env
```

#### 3. สั่งรัน Prisma Migration & Seed ข้อมูลทดสอบ
```bash
# สร้าง Table ใน Database
npm run prisma:migrate

# Seed ข้อมูลผู้ใช้เริ่มต้น
npm run prisma:seed
```

#### 4. เริ่มต้นรันเซิร์ฟเวอร์ในโหมด Dev
```bash
npm run dev
```

---

## 👥 บัญชีผู้ใช้เริ่มต้นจาก Seeding (Default Accounts)

รหัสผ่านสำหรับทุกบัญชีคือ: **`Password123!`**

| Email | Role | สิทธิ์การเข้าถึง |
|---|---|---|
| `superadmin@example.com` | `SUPERADMIN` | จัดการผู้ใช้ทั้งหมด, เปลี่ยน Role เป็น Superadmin ได้ |
| `admin@example.com` | `ADMIN` | จัดการผู้ใช้ทั่วไป และดูรายการผู้ใช้ทั้งหมดได้ |
| `user@example.com` | `USER` | แก้ไขข้อมูลส่วนตัวของตนเอง |

---

## 📌 รายการ API Endpoints (API Specification)

Prefix ทั้งหมดอยู่ที่: `/api/v1`

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | คำอธิบาย | สิทธิ์ (Auth) |
|---|---|---|---|
| `POST` | `/auth/register` | ลงทะเบียนผู้ใช้ใหม่ | Public |
| `POST` | `/auth/login` | เข้าสู่ระบบ (รับ JWT + ตั้งค่า Cookie) | Public |
| `POST` | `/auth/refresh` | ขอ Access Token ใหม่ด้วย Refresh Token | Public / Cookie |
| `POST` | `/auth/logout` | ออกจากระบบเฉพาะเครื่องปัจจุบัน | Public / Cookie |
| `POST` | `/auth/logout-all` | ออกจากระบบทุกอุปกรณ์ (Revoke All Sessions) | 🔒 Authenticated |
| `POST` | `/auth/forgot-password` | ขอรับ Token รีเซ็ตรหัสผ่านทาง Email | Public |
| `POST` | `/auth/reset-password` | รีเซ็ตรหัสผ่านใหม่ด้วย Token | Public |
| `GET`  | `/auth/me` | ตรวจสอบข้อมูลผู้ใช้ที่กำลังล็อกอินอยู่ | 🔒 Authenticated |

### 2. User & RBAC Management (`/api/v1/users`)

| Method | Endpoint | คำอธิบาย | สิทธิ์ (Auth & RBAC) |
|---|---|---|---|
| `GET`   | `/users/profile` | ดูโปรไฟล์ตนเอง | 🔒 Authenticated |
| `PUT`   | `/users/profile` | แก้ไขข้อมูลตนเอง (ชื่อ-นามสกุล) | 🔒 Authenticated |
| `POST`  | `/users/change-password` | เปลี่ยนรหัสผ่านของตนเอง | 🔒 Authenticated |
| `GET`   | `/users` | ดูรายชื่อผู้ใช้ทั้งหมด (Pagination & Search) | 🔒 `ADMIN`, `SUPERADMIN` |
| `GET`   | `/users/:id` | ดูข้อมูลผู้ใช้ตาม ID | 🔒 `ADMIN`, `SUPERADMIN` |
| `PATCH` | `/users/:id/role` | ปรับเปลี่ยน Role ของผู้ใช้ | 🔒 `ADMIN`, `SUPERADMIN` |

---

## 💡 วิธีนำไปใช้กับ Frontend (Integration Guide)

### รูปแบบที่ 1: ใช้ Bearer Header (Mobile App / React Native / SPA ทั่วไป)

1. เมื่อเรียก `POST /api/v1/auth/login` สำเร็จ จะได้รับ Response:
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    }
  }
}
```
2. ส่ง `Authorization: Bearer <accessToken>` ใน Request Header ทุกครั้งที่เรียก Private API
3. หากได้ Response Status `401 Unauthorized` ให้ยิง `POST /api/v1/auth/refresh` โดยส่ง `{ "refreshToken": "<refreshToken>" }` ใน Body เพื่อรับ Token ชุดใหม่

### รูปแบบที่ 2: ใช้ HttpOnly Cookies (Web App เช่น Next.js / Nuxt / SPA)

1. เมื่อเรียก `POST /api/v1/auth/login` เซิร์ฟเวอร์จะแนบ `Set-Cookie` สำหรับ `access_token` และ `refresh_token` ให้โดยอัตโนมัติ
2. ในฝั่ง Frontend (เช่น `fetch` หรือ `axios`) เพียงแค่เปิด `credentials: 'include'` (fetch) หรือ `withCredentials: true` (axios)
3. Browser จะจัดการส่ง Cookie ให้เองโดยอัตโนมัติ ป้องกันการขโมย Token จากช่องโหว่ XSS ในฝั่ง JavaScript 100%

---

## 🛠️ คำสั่งที่ใช้บ่อย (Useful Scripts)

```bash
# รัน Development Server (พร้อม Hot-reload)
npm run dev

# Compile TypeScript เป็น JavaScript (โฟลเดอร์ dist/)
npm run build

# รัน Production Server
npm start

# เปิด Prisma Studio (GUI จัดการ Database บน Browser)
npm run prisma:studio

# ตรวจสอบ Type Checking
npm run lint
```
