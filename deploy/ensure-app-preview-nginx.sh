#!/usr/bin/env bash
# Idempotent: add /app-preview/ static location if missing (Goal-demo URL).
set -euo pipefail

SITE="${NGINX_SITE:-/etc/nginx/sites-available/win-predict-ai-admin}"

if grep -q 'location /app-preview/' "$SITE"; then
  echo "nginx already has /app-preview/"
  exit 0
fi

python3 - "$SITE" <<'PY'
import sys
from pathlib import Path

site = Path(sys.argv[1])
text = site.read_text()
needle = "    location /win-predict-ai-preview/ {"
if needle not in text:
    raise SystemExit(f"missing win-predict-ai-preview block in {site}")
start = text.index(needle)
end = text.index("\n    }", start) + len("\n    }")
snippet = """

    location /app-preview/ {
        alias /var/www/win-predict-ai-app-preview/;
        autoindex off;
        try_files $uri $uri/ =404;
    }"""
site.write_text(text[:end] + snippet + text[end:])
PY

nginx -t
systemctl reload nginx
echo "nginx: added /app-preview/ location"
