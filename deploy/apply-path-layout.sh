#!/usr/bin/env bash
# Switch layout: public app at /, admin at /admin/, /api → Nuxt /admin/api/.
# Run as root on the VPS after admin+vue code with this layout is on disk.
set -euo pipefail

DOMAIN="${DOMAIN:-win-predict-ai.com}"
WWW="www.${DOMAIN}"
APP_DIR="${APP_DIR:-/var/www/win-predict-ai-admin}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/win-predict-ai-admin}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_SRC="${SCRIPT_DIR}/nginx-domain.conf"
if [[ ! -f "$NGINX_SRC" ]]; then
  NGINX_SRC="${SCRIPT_DIR}/nginx.conf"
fi

if [[ ! -f "$NGINX_SRC" ]]; then
  echo "ERROR: missing nginx config next to this script"
  exit 1
fi

ENV_FILE="${APP_DIR}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing ${ENV_FILE}"
  exit 1
fi

echo "==> Set NUXT_APP_BASE_URL=/admin/ and APP_URL=https://${DOMAIN}"
PUBLIC_URL="https://${DOMAIN}"
if grep -q '^APP_URL=' "$ENV_FILE"; then
  sed -i "s|^APP_URL=.*|APP_URL=${PUBLIC_URL}|" "$ENV_FILE"
else
  printf '\nAPP_URL=%s\n' "$PUBLIC_URL" >> "$ENV_FILE"
fi
if grep -q '^NUXT_APP_URL=' "$ENV_FILE"; then
  sed -i "s|^NUXT_APP_URL=.*|NUXT_APP_URL=${PUBLIC_URL}|" "$ENV_FILE"
else
  printf 'NUXT_APP_URL=%s\n' "$PUBLIC_URL" >> "$ENV_FILE"
fi
if grep -q '^NUXT_APP_BASE_URL=' "$ENV_FILE"; then
  sed -i 's|^NUXT_APP_BASE_URL=.*|NUXT_APP_BASE_URL=/admin/|' "$ENV_FILE"
else
  printf 'NUXT_APP_BASE_URL=/admin/\n' >> "$ENV_FILE"
fi

echo "==> Pull + rebuild admin with base /admin/"
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main
export NUXT_APP_BASE_URL=/admin/
npm ci
npm ci --prefix api
npm run build
npm run build:api

echo "==> Install nginx layout (re-attach TLS with certbot)"
if [[ -f "$NGINX_SITE" ]]; then
  cp -a "$NGINX_SITE" "${NGINX_SITE}.bak.$(date +%Y%m%d%H%M%S)"
fi
cp "$NGINX_SRC" "$NGINX_SITE"
ln -sfn "$NGINX_SITE" /etc/nginx/sites-enabled/win-predict-ai-admin
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

CERTBOT_EMAIL="$(grep -E '^(NUXT_ADMIN_EMAILS|ADMIN_EMAILS)=' "$ENV_FILE" | head -1 | cut -d= -f2- | cut -d, -f1 | tr -d '[:space:]')"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
certbot --nginx \
  -d "$DOMAIN" \
  -d "$WWW" \
  --non-interactive \
  --agree-tos \
  --redirect \
  -m "$CERTBOT_EMAIL" \
  --keep-until-expiring

nginx -t
systemctl reload nginx

echo "==> Restart pm2"
pm2 restart win-predict-ai-admin win-predict-ai-admin-api \
  || (cd "$APP_DIR" && pm2 start deploy/ecosystem.config.cjs && pm2 save)

echo "==> Done"
echo "    App:   ${PUBLIC_URL}/"
echo "    Admin: ${PUBLIC_URL}/admin/"
echo "    API:   ${PUBLIC_URL}/api/leagues.json"
