#!/usr/bin/env bash
# Runs on VPS via: ssh … "bash -s" < scripts/ensure-app-preview-nginx-remote.sh
set -euo pipefail

SITE="${NGINX_SITE:-/etc/nginx/sites-available/win-predict-ai-admin}"

if grep -q 'location /app-preview/' "$SITE"; then
  echo "ok: location /app-preview/ already configured"
  exit 0
fi

python3 - "$SITE" <<'PY'
import sys
from pathlib import Path

site = Path(sys.argv[1])
text = site.read_text()
snippet = (
    "\n"
    "    location /app-preview/ {\n"
    "        alias /var/www/win-predict-ai-app-preview/;\n"
    "        autoindex off;\n"
    "        try_files $uri $uri/ =404;\n"
    "    }\n"
)
needle = "location /win-predict-ai-preview/"
pos = text.find(needle)
if pos < 0:
    raise SystemExit(f"{needle!r} not found in {site}")
close = text.find("\n    }", pos)
if close < 0:
    raise SystemExit("closing brace for win-predict-ai-preview block not found")
insert_at = close + len("\n    }")
site.write_text(text[:insert_at] + snippet + text[insert_at:])
print("inserted location /app-preview/")
PY

nginx -t
systemctl reload nginx
