# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A family World Cup prediction game. Users predict match scores, earn points, and compete on a leaderboard.
Admin approves players, manages matches, imports fixtures from TheSportsDB, and enters final results which auto-trigger scoring.

## Commands

### Development (Docker)
```bash
docker compose up --build          # Start all services (backend :8000, frontend :3000)
docker compose logs -f backend     # Watch backend logs
docker compose exec backend bash   # Shell into backend container
```

### Backend
```bash
cd backend
pip install -r requirements.txt
pytest                            # All tests
pytest tests/test_scoring.py -v   # Single test file
alembic upgrade head              # Apply migrations
alembic revision --autogenerate -m "description"  # New migration
python -m app.db.init_db          # Seed admin user
uvicorn app.main:app --reload     # Run dev server (outside Docker)
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # Dev server on :3000
npm run build   # Production build
npm test        # Vitest
```

## Architecture

**Backend** (`backend/app/`):
- `api/v1/` — FastAPI routers: `auth`, `matches`, `predictions`, `leaderboard`, `admin`
- `core/` — `config.py` (Pydantic Settings from env), `security.py` (JWT + bcrypt), `logging_config.py` (Loguru)
- `crud/` — Thin DB operations (no business logic)
- `services/` — Business logic: `scoring_service.py` (point calculation), `leaderboard_service.py` (ranking), `sportsdb_service.py` (TheSportsDB fixture import)
- `models/` — SQLAlchemy 2.0 mapped models (`User`, `Match`, `Prediction`)
- `schemas/` — Pydantic v2 request/response schemas
- `db/` — `session.py` (engine + SessionLocal + Base), `init_db.py` (admin seed), `base.py` (imports all models for Alembic)

**Frontend** (`frontend/src/`):
- `api/` — Axios clients (`client.ts` has interceptors for JWT + 401 handling)
- `store/authStore.ts` — Zustand store for auth state (persists to localStorage)
- `pages/` — Route-level components; `pages/admin/` for admin-only pages
- `components/` — `MatchCard`, `PredictionForm` (modal), `TopThree` (podium), `LeaderboardTable`
- `utils/dates.ts` — All date formatting. Backend returns naive UTC strings; append `Z` before parsing.

## Key Business Rules

- **Match visibility**: Users see a match only if `match_datetime ≤ now + 240h` OR status is `live`/`finished`. Draft and cancelled matches are always hidden from regular users. Admin sees all.
- **Match statuses**: `draft` → `scheduled` → `live` → `finished` (also `cancelled`). Draft matches are imported from the API and must be approved by admin before becoming visible.
- **Prediction lock**: Server-side check — `now >= match.match_datetime` blocks submission. Users can create or update predictions up until kickoff.
- **Score consistency**: `predicted_winner` must match the predicted scores (validated in `PredictionCreate` schema and enforced in `PredictionForm` by deriving winner from score inputs).
- **Scoring trigger**: `POST /api/v1/admin/matches/{id}/result` sets scores + status=finished, then immediately calls `score_match()` to update all `prediction.points_earned`. Blocked for draft and cancelled matches.
- **Points**: correct winner = 1pt; correct winner + exact score = 3pts; wrong = 0.
- **Leaderboard tiebreaker**: total_points DESC → earliest prediction created_at ASC (NULL last) → nickname ASC. Applied in Python after SQL aggregation.
- **Titles**: rank 1 = "El Magnifico"; last rank (when ≥2 players) = "Abou sha7ata".

## Match Import (TheSportsDB)

Fixtures are fetched from `https://www.thesportsdb.com/api/v1/json/{key}/eventsseason.php?id={league}&s={season}`.

- Default league: `4429` (FIFA World Cup), default season: `2026`
- Free tier key: `3`. Premium key configured via `SPORTSDB_API_KEY` in `.env`
- Each fixture gets an `external_id` (TheSportsDB `idEvent`) stored on the Match model to prevent duplicate imports
- Imported matches land as `draft`; admin approves individually or in bulk
- Service: `app/services/sportsdb_service.py`, raises `SportsDbError` on failure

## Database

MySQL 8 with naive UTC datetimes (no timezone column type). Always use `datetime.now(timezone.utc).replace(tzinfo=None)` for UTC comparisons in Python.

Migrations are in `alembic/versions/`. Run `alembic upgrade head` before starting the server (done automatically in Docker CMD).

Current migrations:
- `001_initial_schema` — users, matches, predictions tables
- `002_add_draft_status_and_external_id` — adds `draft` to MatchStatus enum, adds `external_id` column + index on matches

## Auth

JWT Bearer token, 7-day expiry, stored in `localStorage`. The `http_bearer` dependency in `api/deps.py` handles extraction. Three dependency levels: `get_current_user` → `get_current_approved_user` → `get_current_admin`.

Admin role can be granted/revoked by any admin via `PATCH /api/v1/admin/users/{id}` with `{"role": "admin"}`. Admins cannot modify their own account via this endpoint.

## Logging

Loguru is configured in `core/logging_config.py`. Logs write to `/app/logs/app.log` (INFO+, rotating daily, 30-day retention) and `/app/logs/error.log` (ERROR+). Console gets colored DEBUG output. Request timing is logged via FastAPI middleware in `main.py`.
