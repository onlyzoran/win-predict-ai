#!/usr/bin/env bash
# Enable win-predict-ai.com on this VPS (nginx + Let's Encrypt + APP_URL).
# Run as root after Namecheap A records point here.
set -euo pipefail

DOMAIN="${DOMAIN:-win-predict-ai.com}"
WWW="www.${DOMAIN}"
APP_DIR="${APP_DIR:-/var/www/win-predict-ai-admin}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/win-predict-ai-admin}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_SRC="${SCRIPT_DIR}/nginx-domain.conf"
if [[ ! -f "$NGINX_SRC" && -f "${SCRIPT_DIR}/nginx.conf" ]]; then
  NGINX_SRC="${SCRIPT_DIR}/nginx.conf"
fi
EXPECTED_IP="$(curl -4 -fsS --max-time 10 https://ifconfig.me/ip || curl -4 -fsS --max-time 10 https://api.ipify.org)"

echo "==> This server public IPv4: ${EXPECTED_IP}"

resolve() {
  getent ahostsv4 "$1" 2>/dev/null | awk '{print $1; exit}' \
    || dig +short A "$1" 2>/dev/null | grep -E '^[0-9.]+$' | head -1 \
    || true
}

APEX_IP="$(resolve "$DOMAIN")"
WWW_IP="$(resolve "$WWW")"
echo "==> DNS ${DOMAIN} → ${APEX_IP:-<none>}"
echo "==> DNS ${WWW} → ${WWW_IP:-<none>}"

if [[ "${SKIP_DNS_CHECK:-}" != "1" ]]; then
  if [[ "$APEX_IP" != "$EXPECTED_IP" ]]; then
    echo "ERROR: ${DOMAIN} does not point to this server yet."
    echo "In Namecheap Advanced DNS set A @ → ${EXPECTED_IP}, then re-run."
    exit 1
  fi
  if [[ -n "$WWW_IP" && "$WWW_IP" != "$EXPECTED_IP" ]]; then
    echo "ERROR: ${WWW} resolves to ${WWW_IP}, expected ${EXPECTED_IP}."
    exit 1
  fi
fi

if [[ ! -f "$NGINX_SRC" ]]; then
  echo "ERROR: missing nginx config next to this script"
  exit 1
fi

echo "==> Install nginx site from $(basename "$NGINX_SRC")"
mkdir -p "$(dirname "$NGINX_SITE")"
if [[ -f "$NGINX_SITE" ]]; then
  cp -a "$NGINX_SITE" "${NGINX_SITE}.bak.$(date +%Y%m%d%H%M%S)"
fi
cp "$NGINX_SRC" "$NGINX_SITE"
ln -sfn "$NGINX_SITE" /etc/nginx/sites-enabled/win-predict-ai-admin
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

ENV_FILE="${APP_DIR}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing ${ENV_FILE}"
  exit 1
fi

PUBLIC_URL="https://${DOMAIN}"
echo "==> Set APP_URL / NUXT_APP_URL → ${PUBLIC_URL}"
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

CERTBOT_EMAIL="$(grep -E '^(NUXT_ADMIN_EMAILS|ADMIN_EMAILS)=' "$ENV_FILE" | head -1 | cut -d= -f2- | cut -d, -f1 | tr -d '[:space:]')"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"

echo "==> Ensure certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx

echo "==> Issue / renew certificate for ${DOMAIN} + ${WWW}"
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

echo "==> Restart pm2 apps"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart win-predict-ai-admin win-predict-ai-admin-api \
    || (cd "$APP_DIR" && pm2 start deploy/ecosystem.config.cjs && pm2 save)
fi

echo "==> Done"
echo "    App:    ${PUBLIC_URL}/"
echo "    Admin:  ${PUBLIC_URL}/admin/"
echo "    API:    ${PUBLIC_URL}/api/leagues.json"
echo "    Ops:    ${PUBLIC_URL}/ops/"
