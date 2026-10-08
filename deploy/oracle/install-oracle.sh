#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/julinhorosa21-lang/central-eleitoral-colmeia-2026.git"
APP_DIR="/opt/central-eleitoral"

if [ "${EUID}" -ne 0 ]; then
  echo "Execute com sudo: sudo bash deploy/oracle/install-oracle.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io git curl ca-certificates
systemctl enable --now docker

if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-v2 2>/dev/null ||   apt-get install -y docker-compose-plugin 2>/dev/null ||   apt-get install -y docker-compose
fi

if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin main
  git -C "$APP_DIR" reset --hard origin/main
else
  rm -rf "$APP_DIR"
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

mkdir -p "$APP_DIR/deploy/oracle/data"
chmod 700 "$APP_DIR/deploy/oracle/data"

PUBLIC_IP="$(curl -4fsS --max-time 10 https://api.ipify.org)"
if ! [[ "$PUBLIC_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Não foi possível detectar o IPv4 público da VM."
  exit 1
fi

CENTRAL_HOST="${PUBLIC_IP}.nip.io"
cat > "$APP_DIR/deploy/oracle/.env" <<EOF
CENTRAL_HOST=$CENTRAL_HOST
EOF
chmod 600 "$APP_DIR/deploy/oracle/.env"

cd "$APP_DIR/deploy/oracle"

if docker compose version >/dev/null 2>&1; then
  docker compose build --pull
  docker compose up -d
else
  docker-compose build --pull
  docker-compose up -d
fi

echo
echo "Central Eleitoral implantada."
echo "URL prevista: https://$CENTRAL_HOST/"
echo "Saúde: https://$CENTRAL_HOST/api/health"
echo
echo "Atenção: as regras de entrada da OCI precisam liberar TCP 80 e 443."
