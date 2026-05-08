# 🌌 Project Context: Project Dreamy

## 📝 Overview
**Project Dreamy** is a modern, media-centric social platform built as a DBMS course project. It has evolved from a simple post-feed into a highly aesthetic, customizable social experience with high-performance media handling and a dynamic theme engine.

---

## 🛠️ Tech Stack
- **Frontend**: React 19 + Vite, React Router 7, Axios
- **Backend**: Node.js + Express (Unified Vercel Serverless Architecture)
- **Database**: PostgreSQL (Supabase)
- **Media Storage**: Supabase Storage Buckets
- **Icons**: Lucide React
- **Theming**: CSS Variables + Custom Context Provider

---

## 📂 Project Structure
```
project-dreamy/
├── client/                  # React/Vite frontend
│   ├── src/
│   │   ├── components/      # MediaGallery, PostCard, StarryBackground
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── pages/           # Home, UserProfile, Settings, Messages
│   │   └── api.js           # Central API configuration (axios)
├── api/                     # Vercel unified backend
│   ├── routes/              # auth.js, posts.js, messages.js, friends.js
│   ├── middleware/          # auth.js (JWT verification)
│   ├── db/                  # pool.js (PostgreSQL pool)
│   └── index.js             # Express app entry point (Vercel Bridge)
├── vercel.json              # Vercel routing & environment config
└── package.json             # Workspace root
```

---

## 🌟 Dreamy Features (Phase 2+)

### 🎞️ Media Gallery 4.0
Uses a **Scroll-Snap Carousel** with an **Ambient Background Blur** effect. It duplicates the media in a blurred, scaled background layer to eliminate black bars for non-standard aspect ratios.

### 🎨 Rainbow Theme Engine
A custom `ThemeContext` that manages:
- **Base Theme**: Light, Dark, AMOLED (Pure Black).
- **Accent Color**: Real-time CSS variable updates (`--accent`) with a custom conic-gradient picker.
- **Global Background**: A `StarryBackground` component that renders 50+ animated particles with theme-aware colors.

---

## 🔧 Maintenance & Setup

### 1. Environment Variables
Ensure the following are set in Vercel and local `.env`:
- `DATABASE_URL`: Supabase PostgreSQL connection string.
- `JWT_SECRET`: Secure string for token signing.
- `VITE_SUPABASE_URL`: Public Supabase API URL.
- `VITE_SUPABASE_ANON_KEY`: Public Supabase Anon Key.

### 2. Renaming Precaution
The project was renamed from `dbms-project` to `project-dreamy`. Ensure all local git remotes are updated:
```bash
git remote set-url origin https://github.com/velo4705/project-dreamy
```

---

## 🚀 Running Locally
```bash
# Install everything
npm install

# Start both frontend and backend
npm run dev
```
- Frontend: `localhost:5173`
- Backend: Proxied via `/api`

---

## 👨‍💻 Roadmap
- [x] Phase 1: Core CRUD & Auth
- [x] Phase 2: Profiles & Media Polish
- [ ] Phase 3: Real-time Messages (WebSockets/Supabase Realtime)
- [ ] Phase 4: Friendship & Social Graph logic
