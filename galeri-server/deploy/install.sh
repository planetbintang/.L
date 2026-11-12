#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/planetbintang/galeri-server}"
ENV_FILE="${ENV_FILE:-/etc/planetbintang/galeri.env}"
STORAGE_DIR="${STORAGE_DIR:-/srv/planetbintang/galeri-data}"
SERVICE_FILE="/etc/systemd/system/galeri.service"

if [[ $EUID -ne 0 ]]; then echo "Jalankan dengan sudo/root."; exit 1; fi
if [[ ! -f "$APP_DIR/package.json" ]]; then echo "Kode GALERI tidak ditemukan di $APP_DIR"; exit 1; fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Buat $ENV_FILE dari galeri-server/.env.example dan isi DATABASE_URL, ALLOWED_ORIGINS, serta secret server."
  exit 1
fi
if ! command -v node >/dev/null || ! node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)"; then
  echo "Node.js 20+ wajib dipasang terlebih dahulu."; exit 1
fi
if ! command -v psql >/dev/null; then echo "PostgreSQL client (psql) wajib dipasang."; exit 1; fi

id galeri >/dev/null 2>&1 || useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin galeri
install -d -o root -g galeri -m 0750 "$(dirname "$ENV_FILE")"
chown root:galeri "$ENV_FILE"; chmod 0640 "$ENV_FILE"
install -d -o galeri -g galeri -m 0750 "$STORAGE_DIR"
chown -R root:galeri "$APP_DIR"
cd "$APP_DIR"
npm install --omit=dev --ignore-scripts
set -a; source "$ENV_FILE"; set +a
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$APP_DIR/schema/galeri.reic"
install -m 0644 "$APP_DIR/deploy/galeri.service" "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable --now galeri.service
systemctl --no-pager --full status galeri.service
echo "GALERI service terpasang. Uji GET /api/v1/health melalui HTTPS setelah reverse proxy disiapkan."
