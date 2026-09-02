#!/usr/bin/env bash
# Build and publish Goal-demo SPA at /app-preview/issue-N/ (orchestrator preview URL).
# Usage: ./deploy/goal-preview-up.sh <issue-number> [repo-root]
set -euo pipefail

ISSUE="${1:?usage: goal-preview-up.sh <issue-number>}"
REPO_ROOT="${2:-$(cd "$(dirname "$0")/.." && pwd)}"
SLUG="issue-${ISSUE}"
BASE_PATH="/app-preview/${SLUG}/"
PREVIEW_ROOT="${PREVIEW_ROOT:-/var/www/win-predict-ai-app-preview}"
TARGET="${PREVIEW_ROOT}/${SLUG}"

echo "==> Goal preview ${SLUG} → ${BASE_PATH}"

cd "$REPO_ROOT"
export NODE_AUTH_TOKEN="${NODE_AUTH_TOKEN:-${GH_TOKEN:-}}"

if [[ ! -d node_modules ]]; then
  npm ci
fi

VITE_BASE_PATH="${BASE_PATH}" VITE_DEV_FIXTURES=true npm run build

mkdir -p "$TARGET"
rsync -av --delete dist/ "$TARGET/"

if [[ -f /etc/nginx/sites-available/win-predict-ai-admin ]] \
  && ! grep -q 'location /app-preview/' /etc/nginx/sites-available/win-predict-ai-admin; then
  echo "==> WARN: nginx has no /app-preview/ location — run deploy/apply-path-layout.sh or reload after updating nginx-domain.conf"
fi

echo "==> Done: https://win-predict-ai.com${BASE_PATH}"
