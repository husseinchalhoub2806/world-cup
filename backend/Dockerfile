FROM python:3.11-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/logs

# ── Development stage ──────────────────────────────────────────────────────────
FROM base AS development
# Source is mounted as a volume in docker-compose.yml
CMD ["sh", "-c", "alembic upgrade head && python -m app.db.init_db && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]

# ── Production stage ───────────────────────────────────────────────────────────
FROM base AS production
COPY . .
CMD ["sh", "-c", "alembic upgrade head && python -m app.db.init_db && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"]
