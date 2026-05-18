# ⚽ World Cup Predictions

A family World Cup prediction game. Users predict match outcomes, earn points, and compete on a live leaderboard.

## Quick Start (Local Development)

```bash
# 1. Copy env file and set your values
cp .env.example .env

# 2. Start everything
docker compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API docs: http://localhost:8000/docs (dev only)
```

The admin user is created automatically on first startup using the `ADMIN_NICKNAME` and `ADMIN_PASSWORD` env variables.

**Change the default admin password in `.env` before deploying.**

---

## Scoring Rules

| Outcome | Points |
|---|---|
| Correct winner or tie | 1 |
| Exact final score | 3 (1 + 2 bonus) |
| Wrong prediction | 0 |

**Leaderboard tiebreakers:** total points → earliest prediction submitted → nickname alphabetically.

**Special titles:** Rank #1 = "El Magnifico" · Last place = "Abou sha7ata"

---

## Project Structure

```
world-cup/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # FastAPI routers
│   │   ├── core/          # Config, security, logging
│   │   ├── crud/          # DB operations
│   │   ├── db/            # Session, base, init_db
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Scoring + leaderboard logic
│   ├── alembic/           # Database migrations
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/           # Axios API clients
│       ├── components/    # Reusable React components
│       ├── pages/         # Route-level pages
│       ├── store/         # Zustand state (auth)
│       └── types/         # TypeScript types
├── nginx/                 # Nginx configs
├── docker-compose.yml     # Development
└── docker-compose.prod.yml
```

---

## Backend Commands

```bash
# Run tests
cd backend && pytest

# Run a single test file
pytest tests/test_scoring.py -v

# Create a new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head

# View logs
docker compose logs -f backend
tail -f logs/app.log
tail -f logs/error.log
```

## Frontend Commands

```bash
cd frontend
npm install
npm run dev      # Dev server on :3000
npm run build    # Production build
npm test         # Run tests
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `SECRET_KEY` | JWT signing key (change in production!) |
| `ACCESS_TOKEN_EXPIRE_DAYS` | Token lifetime (default: 7) |
| `ADMIN_NICKNAME` | Admin username |
| `ADMIN_PASSWORD` | Admin password |
| `ADMIN_REAL_NAME` | Admin display name |
| `CORS_ORIGINS` | Comma-separated allowed origins |

---

## API Overview

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/matches
GET    /api/v1/matches/{id}

GET    /api/v1/predictions
POST   /api/v1/predictions/{match_id}

GET    /api/v1/leaderboard
GET    /api/v1/leaderboard/public   ← no auth, for landing page

# Admin
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/{id}
DELETE /api/v1/admin/users/{id}
GET    /api/v1/admin/matches
POST   /api/v1/admin/matches
PATCH  /api/v1/admin/matches/{id}
DELETE /api/v1/admin/matches/{id}
POST   /api/v1/admin/matches/{id}/result   ← triggers auto-scoring
GET    /api/v1/admin/predictions
GET    /api/v1/admin/leaderboard
```

---

## Production Deployment

See [docs/deployment.md](docs/deployment.md) for:
- VPS (Ubuntu) setup
- HTTPS / domain configuration
- Backup recommendations
- Log access
