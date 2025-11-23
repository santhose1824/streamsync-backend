# StreamSync Backend

Node.js + TypeScript + Express + Prisma + PostgreSQL

This backend powers the StreamSync mobile application. It provides all authentication and user management APIs with secure JWT access tokens, refresh token rotation, Zod validation, Prisma ORM, and PostgreSQL storage.

## 🚀 Tech Stack

- **Node.js + Express** - Server framework
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Database
- **Zod** - Schema validation
- **JWT** - Access tokens
- **bcrypt** - Password hashing

## 📦 Folder Structure

```
backend/
│
├── src/
│   ├── controllers/        # Route handlers
│   ├── services/           # Business logic
│   ├── routes/             # Route groups
│   ├── middleware/         # Auth & error middleware
│   ├── utils/              # JWT + hashing utilities
│   ├── validators/         # Zod schemas
│   ├── prisma.ts           # Prisma client
│   └── index.ts            # Server entry
│
├── prisma/
│   ├── schema.prisma       # DB Schema
│   └── migrations/         # Auto-generated
│
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## ⚙️ Environment Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd streamsync/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a file named `.env` inside `backend/`:

```env
DATABASE_URL="postgresql://<DB_USER>:<DB_PASS>@<DB_HOST>:5432/<DB_NAME>?schema=public"
JWT_SECRET="set_a_long_random_secret_here"
ACCESS_TOKEN_EXP="15m"
REFRESH_TOKEN_EXP_DAYS=30
PORT=4000
```

Create `.env.example` to commit:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
JWT_SECRET=""
ACCESS_TOKEN_EXP="15m"
REFRESH_TOKEN_EXP_DAYS=30
PORT=4000
```

### 4. Run Prisma Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at: **http://localhost:4000**

Health check: **http://localhost:4000/health**

## 🧪 Testing With Postman

This section explains how to test each API using Postman.

### 🧩 Create Postman Environment

Create a Postman environment with variables:

| Key | Value |
|-----|-------|
| `baseUrl` | `http://localhost:4000` |
| `accessToken` | (empty) |
| `refreshToken` | (empty) |
| `userId` | (empty) |

## 🔐 Authentication API Endpoints

All endpoints below use JSON.

### 1️⃣ Register — `POST /auth/register`

**URL**
```
{{baseUrl}}/auth/register
```

**Body**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "StrongPass123!"
}
```

**Response (201)**
- `user`
- `accessToken`
- `refreshToken`

Copy tokens into environment variables.

---

### 2️⃣ Login — `POST /auth/login`

**URL**
```
{{baseUrl}}/auth/login
```

**Body**
```json
{
  "email": "alice@example.com",
  "password": "StrongPass123!"
}
```

**Response (200)**

Same as register: save `accessToken`, `refreshToken`.

---

### 3️⃣ Get Profile — `GET /me`

**URL**
```
{{baseUrl}}/me
```

**Headers**
```
Authorization: Bearer {{accessToken}}
```

---

### 4️⃣ Update Profile — `PATCH /me`

**URL**
```
{{baseUrl}}/me
```

**Headers**
```
Authorization: Bearer {{accessToken}}
```

**Body**
```json
{
  "name": "Alice Updated"
}
```

---

### 5️⃣ Change Password — `POST /me/change-password`

**URL**
```
{{baseUrl}}/me/change-password
```

**Headers**
```
Authorization: Bearer {{accessToken}}
```

**Body**
```json
{
  "currentPassword": "StrongPass123!",
  "newPassword": "NewPass456!"
}
```

**Note:** After password changed, all refresh tokens are invalidated — login again afterward.

---

### 6️⃣ Logout — `POST /auth/logout`

**URL**
```
{{baseUrl}}/auth/logout
```

**Body**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

---

### 7️⃣ Refresh Token — `POST /auth/refresh`

**URL**
```
{{baseUrl}}/auth/refresh
```

**Body**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Response:**

New `accessToken` + new `refreshToken` → update Postman environment variables.

---

### 8️⃣ Delete Account — `DELETE /me`

**URL**
```
{{baseUrl}}/me
```

**Headers**
```
Authorization: Bearer {{accessToken}}
```

**Response:**
```
204 No Content
```

The user is soft-deleted.

---

## 🔍 Example Postman Test Script (optional)

Inside a Postman request "Tests" tab:

```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const data = pm.response.json();
    if (data.accessToken) pm.environment.set("accessToken", data.accessToken);
    if (data.refreshToken) pm.environment.set("refreshToken", data.refreshToken);
    if (data.user?.id) pm.environment.set("userId", data.user.id);
}
```

This automatically updates environment tokens after register/login.

## 🛠 Troubleshooting

| Issue | Fix |
|-------|-----|
| Prisma migrate fails | Check `DATABASE_URL` & DB permissions |
| Invalid token | Ensure `JWT_SECRET` is same across runs |
| Connection refused | Ensure PostgreSQL is running |
| 401 on `/me` | Check `Authorization: Bearer {{accessToken}}` |

## 📌 Next Steps

After authentication is fully tested you can proceed to build:

- FCM token APIs
- Notification queue + worker
- Video metadata APIs
- Offline sync flows

## 👥 Contributors

[Your Name/Team]
