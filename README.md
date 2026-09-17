# 🛡 CipherShield — Secure User Authentication System

A production-quality full-stack authentication system with **Zero-Trust JWT auth**, **refresh token rotation**, and **role-based access control** (RBAC).

![Stack](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![Stack](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb)
![Stack](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)
![Stack](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=json-web-tokens)

---

## 🚀 Features

| Feature | Details |
|---|---|
| User Registration | bcrypt (12 rounds), duplicate check, field validation |
| User Login | Password comparison, JWT issuance, httpOnly refresh cookie |
| JWT Access Token | 1-hour expiry, in-memory on client |
| Refresh Token | 7-day expiry, stored hashed in MongoDB, rotated on every use |
| Protected Routes | Bearer token middleware with 401/403 responses |
| RBAC | `user` and `admin` roles, route-level enforcement |
| Rate Limiting | 10 req/15 min on auth endpoints |
| NoSQL Injection | `express-mongo-sanitize` stripping `$` and `.` |
| Security Headers | `helmet` for HTTP security headers |
| CORS | Restricted to frontend origin |

---

## 📁 Project Structure

```
Prodigy_FS_01/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   ├── User.js                # User schema
│   │   └── Token.js               # Refresh token schema (hashed, TTL)
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT Bearer verification
│   │   ├── roleMiddleware.js      # RBAC factory middleware
│   │   └── rateLimiter.js        # express-rate-limit configs
│   ├── controllers/
│   │   ├── authController.js     # register, login, refresh, logout
│   │   ├── userController.js     # getProfile, updateProfile
│   │   └── adminController.js    # getDashboard, getAllUsers
│   ├── routes/
│   │   ├── authRoutes.js         # POST /api/auth/*
│   │   ├── userRoutes.js         # GET/PUT /api/user/*
│   │   └── adminRoutes.js        # GET /api/admin/*
│   ├── server.js                 # Express app entry point
│   ├── .env.example              # Environment variable template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx   # Auth state, session restore
    │   ├── services/
    │   │   └── api.js            # Axios instance + interceptors
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── AdminPage.jsx
    │   ├── App.jsx               # Router
    │   └── index.css             # Design system
    └── index.html
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally OR MongoDB Atlas URI

### 1. Clone & Enter Project

```bash
cd Prodigy_FS_01
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and strong JWT secrets
npm install
npm run dev
```

The API will start at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The UI will start at `http://localhost:5173`

---

## 🔐 API Documentation

### Base URL: `http://localhost:5000/api`

---

### Auth Endpoints

#### `POST /auth/register`
Register a new user.

**Request:**
```json
{
  "name": "Alex Vance",
  "email": "alex@example.com",
  "password": "SecurePass1"
}
```

**Response `201`:**
```json
{
  "success": true,
  "accessToken": "<jwt>",
  "user": { "id": "...", "name": "Alex Vance", "email": "...", "role": "user" }
}
```
> Also sets `refreshToken` as httpOnly cookie.

---

#### `POST /auth/login`
Authenticate and receive tokens.

**Request:**
```json
{ "email": "alex@example.com", "password": "SecurePass1" }
```

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "<jwt>",
  "user": { "id": "...", "name": "Alex Vance", "email": "...", "role": "user" }
}
```

---

#### `POST /auth/refresh`
Silently refresh the access token using the httpOnly cookie.

**Response `200`:**
```json
{ "success": true, "accessToken": "<new_jwt>" }
```

---

#### `POST /auth/logout`
Invalidate refresh token and clear cookie.

**Response `200`:**
```json
{ "success": true, "message": "Logged out successfully." }
```

---

### User Endpoints

#### `GET /user/profile` 🔒
Get logged-in user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "success": true,
  "user": { "id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "..." }
}
```

---

### Admin Endpoints (role: `admin` only)

#### `GET /admin/dashboard` 🔒👑
Returns system stats.

#### `GET /admin/users?page=1&limit=10` 🔒👑
Returns paginated user list.

---

## 🧪 Quick Test (curl)

```bash
# 1. Register
curl -c cookies.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass1"}'

# 2. Login
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass1"}'

# 3. Access profile (replace <token> with accessToken from login)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/user/profile

# 4. Refresh
curl -b cookies.txt -X POST http://localhost:5000/api/auth/refresh

# 5. Logout
curl -b cookies.txt -X POST http://localhost:5000/api/auth/logout
```

---

## 🔧 Environment Variables

See `backend/.env.example` for all required variables:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens (32+ chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (32+ chars) |
| `JWT_ACCESS_EXPIRES` | Access token expiry (default: `1h`) |
| `CLIENT_URL` | Frontend origin for CORS |

---

## 🛡 Security Design

- **Passwords** — Never stored in plain text. bcrypt with 12 salt rounds.
- **Tokens** — Access tokens are short-lived (1h) and kept in memory. Refresh tokens are hashed before DB storage.
- **Rotation** — Every `/auth/refresh` call issues a new refresh token and invalidates the previous one. Token theft detection is built in.
- **Rate limiting** — Auth endpoints: 10 req/15 min. All routes: 100 req/10 min.
- **NoSQL injection** — `express-mongo-sanitize` strips `$` operators from all inputs.
- **Headers** — `helmet` sets 15+ security HTTP headers automatically.

---

## 🏗 Creating an Admin User

After registering, manually update the role via MongoDB shell or Compass:

```js
db.users.updateOne({ email: "yourname@example.com" }, { $set: { role: "admin" } })
```

---

*Built with ❤ using Node.js, Express, MongoDB, and React.*
