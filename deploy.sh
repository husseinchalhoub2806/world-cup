#!/bin/bash
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "──────────────────────────────────────"
echo " World Cup — Deploy"
echo "──────────────────────────────────────"

echo ""
echo "[1/3] Pulling latest code..."
git fetch origin master
git pull origin master

echo ""
echo "[2/3] Rebuilding and restarting containers..."
$COMPOSE down
$COMPOSE up --build -d

echo ""
echo "[3/3] Status:"
$COMPOSE ps

echo ""
echo "Done."
