# Architecture

## Overview

Music Marketplace is a clean monolith. The backend is the authoritative source of all business logic. The frontend is a thin client that consumes the REST API.

## Backend

### Layer structure

```
routes → services → models/db
           ↑
        schemas (in/out)
```

**Routes** (`app/api/routes/`) — FastAPI route handlers. Kept thin: parse request, call service, return response. Authorization via `Depends(require_admin)` or `Depends(get_current_user)`.

**Services** (`app/services/`) — All business logic lives here. Services receive a `Session` and domain objects, enforce rules, and raise `HTTPException` when violated.

**Models** (`app/db/models.py`) — SQLAlchemy 2.0 ORM models with `Mapped` type annotations. Declarative Base. All constraints (`UniqueConstraint`) defined at the model level.

**Schemas** (`app/schemas/`) — Pydantic v2 request/response models. Input schemas validate and sanitize. Output schemas control what gets serialized.

**Dependencies** (`app/api/deps.py`) — Typed aliases `CurrentUser`, `AdminUser`, `DbSession` for DI. `require_admin` chains off `get_current_user` and raises 403.

### Auth

JWT HS256 tokens. `python-jose` for encoding/decoding. `bcrypt` for password hashing (used directly, not through passlib, to avoid the bcrypt 4+ compatibility issue with passlib 1.7.x).

Token stored in `Authorization: Bearer <token>` header. No refresh tokens — 60-minute expiry is fine for a demo.

### Database

PostgreSQL 16. Sync SQLAlchemy. Single `SessionLocal` created per request via FastAPI dependency injection, closed in `finally` block.

Schema enforces:
- `UNIQUE(user_id, album_id)` on `purchases`
- `UNIQUE(user_id, album_id)` on `ratings`
- `ON DELETE CASCADE` from artist → albums → purchases/ratings

Album `rating` is computed at query time via `AVG()` subquery. Not stored as a denormalized column — avoids cache invalidation complexity for a demo.

### Migrations

Alembic with autogenerate. `alembic/env.py` loads `DATABASE_URL` from `.env` via python-dotenv, then passes it to the engine. Run `alembic upgrade head` before `app.db.seed` on fresh setup.

## Frontend

### Data flow

```
Page → React Query hook → axios API call → FastAPI
                ↓
         cache / optimistic update → re-render
```

**AuthContext** — Stores `user` (JSON-parsed from localStorage) and `token`. Provides `login`, `register`, `logout`. On logout, calls `queryClient.clear()` to evict all cached queries.

**API layer** (`src/api/`) — Pure async functions that call axios. One file per resource. No business logic here.

**React Query** — All server state. `queryKey` conventions: `['albums', search, skip, sort, minRating]`, `['library']`, `['artists', search]`. Mutations call `invalidateQueries` on success to trigger refetch.

**Pages** — Route-level components. Compose hooks and shared components. No prop drilling — auth state comes from `useAuth()`, server state from React Query hooks.

### Route guards

`ProtectedRoute` — redirects unauthenticated users to `/login` with `state.from` for post-login redirect.

`AdminRoute` — additionally checks `user.is_admin`, redirects non-admins to `/`.

### Marketplace UX

The main marketplace now exposes two catalog views:

- `Albums` — searchable, paginated, sortable, and filterable catalog with purchase actions
- `Artists` — searchable artist discovery view so the reviewer can assess both sides of the domain from the main product UI

## Key design decisions

**Why sync SQLAlchemy?** — Simpler to reason about. FastAPI runs sync route handlers in a threadpool automatically. No `async with session` complexity.

**Why compute rating in SQL?** — The `AVG()` subquery approach avoids stale data and doesn't require a trigger or application-level update on every rating change. For the query volume of a demo app, the overhead is negligible.

**Why bcrypt directly (not passlib)?** — passlib 1.7.4 accesses `bcrypt.__about__.__version__` which was removed in bcrypt 4.0. Rather than pin bcrypt or monkey-patch passlib, we call bcrypt directly. The API is minimal and stable.

**Why no Redux?** — React Query handles all server state. `AuthContext` handles the one piece of client state (current user). Redux would be unnecessary complexity.

**Why SQLite for tests?** — Avoids requiring a running Postgres for `pytest`. The business rules under test don't use Postgres-specific SQL. `StaticPool` ensures all connections share one in-memory DB. Foreign key enforcement is enabled via `PRAGMA foreign_keys=ON`.

## Deployment notes

For a live deployment:
1. Set `SECRET_KEY` to a cryptographically random value
2. Set `DATABASE_URL` to the production Postgres URL
3. Set `FRONTEND_URLS` to a comma-separated list of allowed frontend domains (CORS)
4. Build frontend with `VITE_API_BASE_URL` pointing to the API
5. Run `alembic upgrade head` as a pre-deploy step
6. The backend Dockerfile exposes port 8000; use a reverse proxy (nginx, Caddy) in front
