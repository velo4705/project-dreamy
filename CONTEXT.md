# Project Context: Reddit Clone (DBMS Project)

## Overview

A Reddit-like web app built for a Database Management Systems university project. Full-stack with React frontend, Node.js backend, and PostgreSQL.

> **IMPORTANT**: The database has been migrated from Neon to **Supabase**. All connection strings should use Supabase's PostgreSQL details.

---

## Tech Stack

- **Frontend**: React 18 + Vite, React Router, Axios
- **Backend**: Node.js + Express (CommonJS)
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT + bcrypt
- **Deployment**: Vercel
- **Testing**: Vitest + fast-check (property-based)

---

## Project Structure

```
dbms-project/
├── client/                  # React/Vite frontend
├── server/                  # Node.js/Express backend (local dev)
│   ├── routes/              # auth.js, posts.js, comments.js
│   ├── middleware/          # auth.js (JWT verification)
│   ├── db/                  # pool.js, schema.sql, seed.sql
│   └── index.js             # Express app entry point
├── api/                     # Vercel serverless function bridge
│   └── index.js             # Bridge to Express app
├── vercel.json              # Vercel deployment + routing config
└── package.json             # Workspace root
```

---

## Environment Variables (.env)

Configured for Supabase:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
JWT_SECRET=dreamy_dbms_project_super_secret_jwt_key_2026_secure_random_string
```

---

## Database Migration: Supabase

To setup:

1. Create a new project at https://supabase.com
2. Go to **Settings → Database** to get the connection string
3. Run `server/db/schema.sql` in the Supabase SQL editor
4. Run `server/db/seed.sql` for sample data
5. Update `.env` with the new Supabase `DATABASE_URL`

---

## Current Status

| Area | Status |
|------|--------|
| Database schema + seed | ✅ Done (Ready for Supabase) |
| Backend routes (Express) | ✅ Done |
| Frontend (Synced with Express) | ✅ Done |
| Auth Stability | ✅ Fixed |
| Vercel Unified Backend | ✅ Done |

---

## Known Bugs to Fix

### Bug 1: AuthContext uses mock user on session restore

**File**: `client/src/context/AuthContext.jsx`

**Problem**: When the app loads and finds a token in localStorage, it sets a hardcoded mock user `{ username: "testuser" }` instead of fetching the real user from the API. This means `user.id` is `undefined`, causing post creation and other auth-dependent actions to fail with "Failed to create post".

**Fix**: Replace the mock with a real call to `GET /api/auth/me`:

```jsx
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    api.get("/auth/me")
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  } else {
    setLoading(false);
  }
}, []);
```

### Bug 2: API paths mismatch between frontend and backend

**File**: `client/src/context/AuthContext.jsx`

**Problem**: The login/register calls use `/auth-login` and `/auth-register` (old Vercel serverless paths) but the server routes are mounted at `/auth/login` and `/auth/register`.

**Fix**: Update the API calls:
```js
// Change this:
api.post("/auth-login", ...)
api.post("/auth-register", ...)

// To this:
api.post("/auth/login", ...)
api.post("/auth/register", ...)
```

---

## Vercel Deployment Notes

- `vercel.json` routes `/api/auth/register` → `/api/auth-register` (serverless functions in `/api` folder)
- There are **two backend implementations**:
  - `/api/` folder — Vercel serverless functions (used in production)
  - `/server/` folder — Express app (used for local development)
- Both need to be kept in sync when making backend changes
- Set `DATABASE_URL` and `JWT_SECRET` in Vercel project environment variables

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start backend (runs on port 5000)
cd server && npm run dev

# 3. Start frontend (runs on port 5173)
cd client && npm run dev

# 4. Open http://localhost:5173
```

The Vite dev server proxies `/api` requests to `localhost:5000` automatically.
