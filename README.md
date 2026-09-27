# 🛡️ Production-Ready Node.js Auth & RESTful API Starter

A production-ready, reusable **Authentication & Authorization (RBAC)** backend starter template built with **Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL, Zod, and Swagger UI**. Designed using **Clean Layered Architecture** for maximum reusability across web apps, mobile backends, and microservices.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey.svg?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Key Features

- 🔒 **Dual-Token JWT Authentication**:
  - **Access Token** (short-lived, 15m) + **Refresh Token** (long-lived, 7d, persisted in database).
  - **Token Rotation & Reuse Detection**: Rotates the refresh token upon every renewal. Detects and revokes all active sessions immediately if token reuse occurs.
  - **Session Management**: Supports single-device logout (`/auth/logout`) and global logout across all devices (`/auth/logout-all`).
- 🌐 **Hybrid Token Transport**:
  - Supports **`Authorization: Bearer <token>`** header (ideal for Mobile Apps, Microservices, Postman).
  - Supports **`HttpOnly` Secure Cookies** (ideal for Web SPAs like Next.js, React, Vue to prevent XSS token theft).
- 👥 **Role-Based Access Control (RBAC)**:
  - Default Roles: `USER`, `ADMIN`, `SUPERADMIN`.
  - Simple, reusable middleware guards: `requireRoles(...)` and `requireMinRole(...)`.
- 🔑 **Password Recovery & Email Service**:
  - Secure Forgot Password & Reset Password flow using SHA-256 hashed cryptographic tokens.
  - Transactional email service with Nodemailer (supports real SMTP and automatic console Mock mode in development).
- 🛡️ **Security & Validation**:
  - **Zod**: Strict, type-safe schema validation for request bodies, query params, and URL params.
  - **Helmet**: Essential HTTP security headers.
  - **CORS**: Configurable cross-origin resource sharing with credentials support.
  - **Rate Limiting**: Brute-force attack prevention on sensitive auth endpoints using `express-rate-limit`.
  - **Bcrypt**: Salted password hashing with 12 rounds.
- 📚 **Interactive Swagger / OpenAPI 3.0 Docs**:
  - Live interactive API documentation and testing playground at `/api-docs`.
- 🐳 **Docker & Container Ready**:
  - Includes multi-stage `Dockerfile` and `docker-compose.yml` for zero-configuration PostgreSQL + App deployment.

---

## 📁 Project Architecture & Directory Structure

```text
auth/
├── .env.example              # Environment variables template
├── .env                      # Local development environment config
├── Dockerfile                # Multi-stage production Dockerfile
├── docker-compose.yml        # PostgreSQL + Node.js application service
├── package.json              # Project dependencies and npm scripts
├── tsconfig.json             # TypeScript compiler settings
├── prisma/
│   ├── schema.prisma         # Database schema (User, RefreshToken, PasswordResetToken)
│   └── seed.ts               # Database seeder (Superadmin, Admin, User)
└── src/
    ├── app.ts                # Express application setup, middlewares, and router mounts
    ├── server.ts             # Server entry point with graceful shutdown handling
    ├── config/
    │   ├── env.ts            # Environment variable validation with Zod (fail-fast)
    │   ├── prisma.ts         # Prisma client singleton
    │   └── swagger.ts        # OpenAPI 3.0 / Swagger JSDoc configuration
    ├── constants/
    │   └── roles.ts          # Role constants and hierarchy definitions
    ├── errors/
    │   └── app-error.ts      # Custom HTTP error classes (400, 401, 403, 404, 409, 429)
    ├── middlewares/
    │   ├── auth.middleware.ts       # Hybrid JWT verification & RBAC authorization guards
    │   ├── error.middleware.ts      # Centralized global error handling middleware
    │   ├── rate-limiter.middleware.ts # API and Auth rate limiters
    │   └── validate.middleware.ts   # Zod request validation middleware
    ├── schemas/
    │   ├── auth.schema.ts    # Zod validation schemas for auth endpoints
    │   └── user.schema.ts    # Zod validation schemas for user management
    ├── services/
    │   ├── auth.service.ts   # Business logic for auth, tokens, sessions, password reset
    │   ├── user.service.ts   # Business logic for user profiles, password, and RBAC
    │   └── email.service.ts  # Transactional email service (SMTP / Mock)
    ├── controllers/
    │   ├── auth.controller.ts # Request handlers for authentication
    │   └── user.controller.ts # Request handlers for user operations
    ├── routes/
    │   ├── index.ts          # Master API router with health check endpoint
    │   ├── auth.routes.ts    # Auth endpoints with Swagger OpenAPI annotations
    │   └── user.routes.ts    # RBAC-protected user management routes
    ├── types/
    │   └── express.d.ts      # Extended Express Request types (req.user, req.token)
    └── utils/
        ├── hash.util.ts      # Bcrypt and cryptographic token hashing helpers
        ├── jwt.util.ts       # JWT generation, verification, and cookie utilities
        ├── logger.util.ts    # Structured logger
        └── response.util.ts  # Standardized API response formatters
```

---

## 🚀 Getting Started

### Option 1: Run with Docker Compose (Recommended)

Start the PostgreSQL database and Node.js backend with one command:

```bash
docker-compose up -d
```

- **Health Check:** `http://localhost:5000/api/v1/health`
- **Swagger UI:** `http://localhost:5000/api-docs`

---

### Option 2: Run Locally (Development)

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your database connection string:
```bash
cp .env.example .env
```

#### 3. Run Prisma Migrations & Seed Database
```bash
# Run database migrations
npm run prisma:migrate

# Seed initial admin & user accounts
npm run prisma:seed
```

#### 4. Start Development Server
```bash
npm run dev
```

---

## 👥 Default Seed Accounts

The default password for all seed accounts is: **`Password123!`**

| Email | Role | Access Permissions |
|---|---|---|
| `superadmin@example.com` | `SUPERADMIN` | Full access, manage all users and promote to Superadmin |
| `admin@example.com` | `ADMIN` | Manage standard users and view user list |
| `user@example.com` | `USER` | Manage personal profile and credentials |

---

## 📌 API Endpoints Reference

Base API Path: `/api/v1`

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user account | Public |
| `POST` | `/auth/login` | Log in with email & password (returns tokens & sets cookies) | Public |
| `POST` | `/auth/refresh` | Obtain new access token via refresh token | Public / Cookie |
| `POST` | `/auth/logout` | Log out from current session | Public / Cookie |
| `POST` | `/auth/logout-all` | Log out from all devices (revokes all active sessions) | 🔒 Authenticated |
| `POST` | `/auth/forgot-password` | Request password reset email | Public |
| `POST` | `/auth/reset-password` | Reset password using received token | Public |
| `GET`  | `/auth/me` | Fetch authenticated user summary | 🔒 Authenticated |

### 2. User & RBAC Management (`/api/v1/users`)

| Method | Endpoint | Description | Required Role |
|---|---|---|---|
| `GET`   | `/users/profile` | Get current user's profile | 🔒 Any Authenticated User |
| `PUT`   | `/users/profile` | Update current user's name/details | 🔒 Any Authenticated User |
| `POST`  | `/users/change-password` | Change current user's password | 🔒 Any Authenticated User |
| `GET`   | `/users` | List all users with pagination and search | 🔒 `ADMIN`, `SUPERADMIN` |
| `GET`   | `/users/:id` | Get user profile by ID | 🔒 `ADMIN`, `SUPERADMIN` |
| `PATCH` | `/users/:id/role` | Update user role | 🔒 `ADMIN`, `SUPERADMIN` |

---

## 💡 Frontend Integration Guide

### Method A: Using Authorization Header (Mobile App / React Native / SPA)

1. When calling `POST /api/v1/auth/login`, extract `accessToken` and `refreshToken` from the JSON response:
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
2. Attach header to all protected requests: `Authorization: Bearer <accessToken>`.
3. If an API returns `401 Unauthorized`, send `POST /api/v1/auth/refresh` with `{ "refreshToken": "<refreshToken>" }` in the body to obtain new tokens.

### Method B: Using HttpOnly Cookies (Web App: Next.js / React / Vue)

1. When calling `POST /api/v1/auth/login`, the server automatically attaches `access_token` and `refresh_token` as secure `HttpOnly` cookies.
2. In your frontend HTTP client, simply enable credentials:
   - **fetch**: `{ credentials: 'include' }`
   - **axios**: `axios.defaults.withCredentials = true;`
3. The browser automatically sends cookies on every request. Tokens cannot be accessed via client-side JavaScript, fully mitigating XSS token theft.

---

## 🛠️ Useful Scripts

```bash
# Run development server with hot-reload
npm run dev

# Compile TypeScript to production JavaScript (dist/)
npm run build

# Start production server
npm start

# Launch Prisma Studio GUI
npm run prisma:studio

# Run TypeScript type check
npm run lint
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
