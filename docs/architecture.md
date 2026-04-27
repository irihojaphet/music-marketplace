# Architecture

Music Marketplace is a compact full-stack application with a deliberately simple shape: FastAPI owns the business rules, PostgreSQL owns the relational constraints, and React acts as a focused client for marketplace, library, and admin workflows.

## Backend

The backend is organized around thin routes and service-layer behavior:

```text
routes -> services -> SQLAlchemy models
          schemas validate input/output
```

- `app/api/routes/` contains FastAPI route handlers, request parsing, and dependency wiring.
- `app/services/` owns business rules such as purchase uniqueness and rating eligibility.
- `app/db/models.py` defines the relational model with SQLAlchemy 2.0 typed mappings.
- `app/schemas/` contains Pydantic request and response models.
- `app/api/deps.py` centralizes database sessions, current-user lookup, and admin authorization.

JWT access tokens are signed with HS256. Passwords are hashed with `bcrypt` directly. The app intentionally skips refresh tokens for this demo, using a short-lived access token instead.

## Data Model

Core tables:

- `users`
- `artists`
- `albums`
- `purchases`
- `ratings`

Important constraints:

- `purchases` has a unique `(user_id, album_id)` constraint.
- `ratings` has a unique `(user_id, album_id)` constraint.
- albums belong to exactly one artist.
- artist deletion cascades through albums, purchases, and ratings.

Album rating is computed from live `AVG()` queries over rating rows. This avoids stale denormalized values and keeps rating updates straightforward.

## Frontend

React Query owns server state. The frontend API layer is split by resource under `src/api/`, while route-level pages compose queries, mutations, auth state, and shared UI components.

Main flows:

- marketplace browsing, search, sorting, filters, and purchases
- personal library with rating controls
- admin artist management
- admin album management

`AuthContext` stores the current user and access token in local storage. Protected routes redirect guests to login, and admin routes additionally check `user.is_admin`.

## Testing

Backend tests run against in-memory SQLite with foreign key enforcement enabled. This keeps the suite fast while still exercising service rules and API authorization paths.

The test suite covers:

- registration and login
- admin-only catalog writes
- duplicate purchase prevention
- rating only after purchase
- one rating per user per album
- rating updates
- user library isolation
- album sorting and rating filters

## Deployment

The project includes a Render Blueprint that provisions:

- a Python FastAPI web service
- a static React site
- a managed PostgreSQL database

Render free-tier services do not support separate pre-deploy commands, so the backend start command runs migrations, seeds demo data, then starts Uvicorn:

```bash
python -m alembic upgrade head && python -m app.db.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Render database URLs are normalized to use SQLAlchemy's `postgresql+psycopg` driver because the project depends on modern `psycopg`, not `psycopg2`.

## Tradeoffs

- Sync SQLAlchemy keeps the backend easy to reason about for a compact CRUD-heavy app.
- SQLite is used for tests so reviewers can run them without a local database.
- Payment processing, carts, email flows, and refresh tokens are intentionally out of scope.
- Frontend tests are not included yet; the current quality bar is backend automated tests plus manual product-flow verification.
