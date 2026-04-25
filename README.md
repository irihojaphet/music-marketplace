# Music Marketplace

A production-minded full-stack music marketplace for discovering, purchasing, and rating albums.

Admins manage artists and albums. Listeners browse the catalog, purchase albums, rate owned releases, and build a personal library.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7 |
| Server state | TanStack React Query 5 |
| Backend | FastAPI, Pydantic v2 |
| ORM | SQLAlchemy 2 |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Auth | JWT + bcrypt |
| Local infra | Docker Compose |
| Deployment | Render Blueprint (`render.yaml`) |

## What This Submission Covers

### Core requirements

- REST API for auth, artists, albums, purchases, ratings, and user library
- Backend-enforced authorization and business rules
- React marketplace UI for listeners and administrators
- Search across albums/artists and marketplace artist discovery
- Personal library with purchase and rating flow
- Admin CRUD for artists and albums
- Seed data and registration path
- Automated backend tests

### Bonus points included

- PostgreSQL in Docker
- Single `docker compose up --build` flow for frontend, backend, and database
- Pagination and sorting/filtering on the album marketplace
- Loading, empty, error, and confirmation states throughout the UI
- Render deployment blueprint and production deployment notes

## Quick Start

### Option 1: Run the full stack with Docker

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Postgres: `localhost:5433`

The backend container runs migrations and seeds demo data automatically on startup.

### Option 2: Run services manually

#### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Demo Credentials

Seeded users:

- Admin: `admin@musicmarket.com` / `admin123`
- User: `alice@example.com` / `password123`
- User: `bob@example.com` / `password123`

You can also register a fresh account from the UI.

## Feature Walkthrough

### Guest

- Browse the marketplace
- Search albums and artists
- View artist metadata, pricing, and community ratings

### Authenticated user

- Register and log in
- Purchase an album once
- View purchased albums in a personal library
- Rate owned albums from 1 to 5 stars
- Update a previous rating

### Admin

- Create, edit, search, and delete artists
- Create, edit, search, and delete albums

## API Overview

```text
GET  /health

POST /auth/register
POST /auth/login
GET  /auth/me

GET  /artists
GET  /artists/{id}
POST /artists            (admin)
PATCH /artists/{id}      (admin)
DELETE /artists/{id}     (admin)

GET  /albums
GET  /albums/{id}
POST /albums             (admin)
PATCH /albums/{id}       (admin)
DELETE /albums/{id}      (admin)

POST  /albums/{id}/purchase
POST  /albums/{id}/rating
PATCH /albums/{id}/rating

GET /me/library
```

Album listing supports:

- `search`
- `skip`
- `limit`
- `sort_by`
- `min_rating`

## Business Rules

The backend enforces these rules in the service layer and validates them with automated tests:

- Each album belongs to exactly one artist
- Users cannot purchase the same album more than once
- Users can only rate albums they have purchased
- One rating per user per album
- Users can update an existing rating
- Album rating is calculated as the average of submitted user ratings
- Artist and album management is admin-only

## Testing

Run backend tests:

```bash
cd backend
.venv\Scripts\python -m pytest tests -q
```

The suite uses in-memory SQLite for fast repeatable tests and currently covers:

- auth registration and login
- admin authorization
- purchase rules
- rating rules
- library behavior

## Architecture and Tradeoffs

High-level notes are in [docs/architecture.md](/c:/music-marketplace/docs/architecture.md:1).

Key decisions:

- FastAPI route handlers stay thin; service modules own business logic
- SQLAlchemy models encode the relational structure and uniqueness constraints
- Ratings are computed from live SQL aggregates instead of denormalized counters
- React Query handles server state; AuthContext handles local auth state
- PostgreSQL is used for the main app, while SQLite keeps tests fast and isolated

## Render Deployment

This repo includes a Render Blueprint at `render.yaml`.

Relevant Render docs used for the setup:

- FastAPI web services: https://render.com/docs/deploy-fastapi
- Static sites: https://render.com/docs/static-sites
- Render Postgres and internal connection URLs: https://render.com/docs/databases
- Blueprint spec: https://render.com/docs/blueprint-spec

Deployment steps are documented in [docs/render-deployment.md](/c:/music-marketplace/docs/render-deployment.md:1).

## Complete / Partial / Omitted

### Complete

- Core marketplace flows
- Admin management flows
- Backend rule enforcement
- Automated tests for key rules and endpoints
- One-command local stack
- Render deployment configuration

### Partial

- No frontend test suite yet; quality is currently enforced through backend tests plus manual UI verification

### Intentionally omitted

- Payment processing
- shopping cart / checkout
- user management beyond auth
- refresh tokens
- email verification / password reset

Those were intentionally left out to keep the challenge focused on the required product scope and to finish the core flows to a higher standard.
