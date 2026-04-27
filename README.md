# Music Marketplace

A full-stack album marketplace where listeners discover artists, buy albums, and rate the music they own. Admins get a focused catalog workspace for managing artists and releases, while guests can browse the marketplace before creating an account.

The project is built as a practical hiring exercise submission: small enough to review quickly, but complete enough to show backend judgment, relational modeling, API design, and a usable React product flow.

## Live Demo

Try the deployed application: https://music-marketplace-web.onrender.com

## Product Experience

- Guests can browse albums and artists, search the catalog, sort by price or rating, and filter highly rated albums.
- Listeners can register, purchase albums once, view a personal library, and rate purchased albums.
- Admins can create, edit, search, and delete artists and albums from dedicated dashboard views.
- Album ratings are calculated from real user ratings, not stored as stale counters.
- The UI includes loading, empty, error, confirmation, and success states for the main workflows.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7 |
| Server state | TanStack React Query 5 |
| Backend | FastAPI, Pydantic v2 |
| Data access | SQLAlchemy 2 |
| Database | PostgreSQL 16 locally and on Render |
| Migrations | Alembic |
| Auth | JWT access tokens + bcrypt password hashing |
| Local infra | Docker Compose |
| Deployment | Render Blueprint |

## Quick Start

Run the whole application from the repository root:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5433`

On startup, the backend runs database migrations and seeds demo data automatically.

## Demo Accounts

- Admin: `admin@musicmarket.com` / `admin123`
- Listener: `alice@example.com` / `password123`
- Listener: `bob@example.com` / `password123`

You can also create a fresh listener account from the registration page.

## Manual Setup

Backend:

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

Frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Key Workflows

### Marketplace

The landing view is the product itself: searchable albums, artist discovery, sorting, rating filters, pagination, purchase actions, and ownership badges. Guests can explore freely and are routed to sign in when they try to purchase.

### Library

Authenticated listeners see purchased albums in their library. Rating controls are shown only for owned albums, and updates refresh both the personal library and marketplace rating averages.

### Admin

Admin users get separate artist and album management screens. The backend enforces admin-only writes, so protected actions are not dependent on frontend routing alone.

## API Surface

```text
GET  /health

POST /auth/register
POST /auth/login
GET  /auth/me

GET    /artists
GET    /artists/{id}
POST   /artists        admin
PATCH  /artists/{id}   admin
DELETE /artists/{id}   admin

GET    /albums
GET    /albums/{id}
POST   /albums         admin
PATCH  /albums/{id}    admin
DELETE /albums/{id}    admin

POST  /albums/{id}/purchase
POST  /albums/{id}/rating
PATCH /albums/{id}/rating

GET /me/library
```

Album listing supports `search`, `skip`, `limit`, `sort_by`, and `min_rating`.

## Backend Design

The backend keeps route handlers thin and moves business behavior into service modules. SQLAlchemy models encode the relational structure and uniqueness constraints:

- one album belongs to one artist
- one purchase per user per album
- one rating per user per album
- ratings are allowed only after purchase
- album averages are computed from rating rows

Pydantic schemas validate input and shape API responses. JWT auth is handled through FastAPI dependencies, with admin-only dependencies used on protected catalog mutations.

More detail is available in [docs/architecture.md](docs/architecture.md).

## Testing

Run backend tests:

```bash
cd backend
.venv\Scripts\python -m pytest tests -q
```

The test suite uses in-memory SQLite for speed and covers:

- registration and login
- admin authorization
- purchase rules
- rating rules
- library behavior
- album sorting and rating filters

## Deployment

The repository includes a Render Blueprint at [render.yaml](render.yaml). It provisions:

- a FastAPI web service
- a static React site
- a managed PostgreSQL database

Deployment notes are in [docs/render-deployment.md](docs/render-deployment.md).

## Product Scope

This version intentionally focuses on the core marketplace loop: browse, purchase, own, rate, and administer catalog data.

Included:

- complete guest, listener, and admin flows
- PostgreSQL via Docker Compose
- Render deployment configuration
- seeded demo users and catalog data
- backend tests for the highest-risk business rules

Deferred:

- real payment processing
- cart and checkout orchestration
- refresh tokens
- password reset and email verification
- frontend test automation

Those omissions keep the project centered on the requested product behavior while leaving clear next steps for production hardening.
