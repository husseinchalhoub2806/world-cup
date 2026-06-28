#!/bin/bash
set -e

COMPOSE="docker compose"

echo "──────────────────────────────────────"
echo " World Cup — Run Tests"
echo "──────────────────────────────────────"

# Ensure containers are up (build only if needed)
if ! $COMPOSE ps --services --filter status=running | grep -q "^backend$"; then
  echo ""
  echo "[1/2] Starting containers..."
  $COMPOSE up --build -d
  echo "      Waiting for backend to be ready..."
  sleep 3
else
  echo ""
  echo "[1/2] Containers already running."
fi

echo ""
echo "[2/2] Running tests..."
echo ""
$COMPOSE exec backend pytest "$@"
