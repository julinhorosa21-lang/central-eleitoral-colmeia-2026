#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/central-eleitoral"

if [ "${EUID}" -ne 0 ]; then
  echo "Execute com sudo: sudo $0"
  exit 1
fi

git -C "$APP_DIR" fetch origin main
git -C "$APP_DIR" reset --hard origin/main
cd "$APP_DIR/deploy/oracle"

if docker compose version >/dev/null 2>&1; then
  docker compose build --pull
  docker compose up -d --remove-orphans
  docker compose ps
else
  docker-compose build --pull
  docker-compose up -d --remove-orphans
  docker-compose ps
fi
