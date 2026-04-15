# SmartOps — Team Task Management System

Full-stack app with Next.js (frontend) + Express (backend) + PostgreSQL.

---

## Project Structure

```
smartOperationSystem/
├── app/                        # Next.js App Router (frontend)
│   ├── (auth)/login            # Login page
│   ├── (auth)/signup           # Signup page
│   └── (dashboard)/            # Protected pages
│       ├── dashboard/          # Role-based dashboard
│       ├── employees/          # Employee management (admin)
│       ├── teams/              # Team management
│       ├── projects/           # Project management
│       ├── tasks/              # Task management
│       └── jobs/               # Job management
├── backend/
│   └── src/
│       ├── config/             # DB connection + migration
│       ├── controllers/        # Business logic
│       ├── middleware/         # Auth + error handling
│       ├── routes/             # Express routes
│       └── server.ts           # Entry point
├── components/                 # Reusable UI components
├── lib/                        # API client + Auth context
└── types/                      # Shared TypeScript types
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

---

## Setup & Run

### 1. PostgreSQL — Create Database

```sql
CREATE DATABASE smart_ops;
```

### 2. Backend

```bash
cd backend

# Configure environment
# Edit .env — set your DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

# Run DB migration
npm run db:migrate

# Start dev server (port 5000)
npm run dev
```

### 3. Frontend

```bash
# From project root
# Edit .env.local if backend runs on a different port

npm run dev   # starts on port 3000
```

Open http://localhost:3000

---

## API Routes

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/signup | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/refresh | Public |
| POST | /api/auth/logout | Public |
| GET/POST | /api/users | Admin/Manager |
| PUT/DELETE | /api/users/:id | Admin |
| GET/POST | /api/teams | Authenticated |
| PUT/DELETE | /api/teams/:id | Admin/Manager |
| GET/POST | /api/tasks | Authenticated |
| PUT/DELETE | /api/tasks/:id | Admin/Manager |
| GET/POST | /api/projects | Authenticated |
| PUT/DELETE | /api/projects/:id | Admin/Manager |
| GET/POST | /api/jobs | Authenticated |
| PUT/DELETE | /api/jobs/:id | Admin/Manager |
| GET | /api/dashboard | Authenticated |

---

## Roles & Permissions

| Feature | Admin | Manager | User |
|---------|-------|---------|------|
| Dashboard | System overview | Team/project overview | Personal tasks |
| Employees | Full CRUD | View | — |
| Teams | Full CRUD | Edit assigned | View |
| Projects | Full CRUD | Create/Edit | View |
| Tasks | Full CRUD | Create/Assign | View/Update status |
| Jobs | Full CRUD | Create/Edit | View assigned |

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_ops
JWT_SECRET=change_this_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
