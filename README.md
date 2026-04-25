# Music Marketplace

A full-stack music marketplace where users can browse, purchase, and rate albums. Built as a portfolio-grade project demonstrating clean architecture, business rule enforcement, and modern tooling.

## Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI + Pydantic v2 |
| ORM | SQLAlchemy 2.0 (sync) |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose) + bcrypt |
| Frontend | React 19 + Vite 8 |
| Data fetching | TanStack React Query 5 |
| Styling | Tailwind CSS 4 |
| HTTP client | Axios |
| Infra | Docker Compose |

## Quick Start

### Prerequisites

- Docker Desktop running
- Python 3.11+ with a virtual environment (`backend/.venv`)
- Node.js 18+

### 1. Start the database

```bash
docker compose up -d
```

### 2. Run backend

```bash
cd backend

# Copy env (already done if repo was cloned fresh)
cp .env.example .env

# Apply migrations
python -m alembic upgrade head

# Seed demo data
python -m app.db.seed

# Start API
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Run frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

## Features

**Guests**
- Browse and search the album catalog
- View artist and album details with community ratings

**Authenticated users**
- Register and log in
- Purchase albums
- Rate owned albums (1–5 stars)
- View personal library with rating history

**Admins**
- Create, edit, and delete artists
- Create, edit, and delete albums

## API Overview

```
GET  /health
POST /auth/register
POST /auth/login
GET  /auth/me

GET  /artists
POST /artists            (admin)
GET  /artists/{id}
PATCH /artists/{id}      (admin)
DELETE /artists/{id}     (admin)

GET  /albums
POST /albums             (admin)
GET  /albums/{id}
PATCH /albums/{id}       (admin)
DELETE /albums/{id}      (admin)

POST /albums/{id}/purchase
POST /albums/{id}/rating
PATCH /albums/{id}/rating

GET  /me/library
```

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

Tests use an in-memory SQLite database — no running Postgres required.

## Project Structure

```
music-marketplace/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py          # Auth dependencies, type aliases
│   │   │   └── routes/          # Thin route handlers
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic Settings
│   │   │   └── security.py      # JWT + password hashing
│   │   ├── db/
│   │   │   ├── base.py          # SQLAlchemy Base
│   │   │   ├── models.py        # ORM models
│   │   │   ├── session.py       # Engine + SessionLocal
│   │   │   └── seed.py          # Demo data seed script
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic
│   │   └── main.py              # FastAPI app + CORS
│   ├── alembic/                 # Migrations
│   ├── tests/                   # Pytest test suite
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/                 # Axios API functions
│       ├── app/                 # AuthContext
│       ├── components/          # Shared UI components
│       ├── hooks/               # Custom hooks
│       └── pages/               # Route-level pages
├── docs/
│   └── architecture.md
└── docker-compose.yml
```

## Business Rules

Enforced at the service layer and verified by tests:

- Users cannot purchase the same album twice
- Users can only rate albums they have purchased
- One rating per user per album (PATCH to update)
- Album rating is the SQL-computed average of all user ratings
- Artist and album management is admin-only
