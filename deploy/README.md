# Deploy frontend to VPS

Serve this Vue app from the same origin as the admin API so the browser can load the leagues manifest without Mixed Content or CORS issues.

| Piece | URL |
| --- | --- |
| Frontend | `https://win-predict-ai.com/` |
| Admin | `https://win-predict-ai.com/admin/` |
| Manifest API | `https://win-predict-ai.com/api/leagues.json` |
| Prediction / history JSON | `https://onlyzoran.github.io/win-predict-ai-data/data/…` |

Production build uses `base: '/'` (override with `VITE_BASE_PATH` for PR previews) and:

```
VITE_LEAGUES_URL=/api/leagues.json
VITE_DATA_BASE_URL=https://onlyzoran.github.io/win-predict-ai-data/data
```

`VITE_LEAGUES_URL` is root-relative, so it resolves to the same host as the page and does not go through the Vite `base` path.

## Prerequisites

- Node `^22.18.0` or `>=24.12.0` (see `package.json` `engines`).
- GitHub PAT with `read:packages` for `@onlyzoran/*` (see project [`.npmrc`](../.npmrc)).

If the VPS still has Node 20, either upgrade:

```sh
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

…or build locally and upload only `dist/`.

## Auto-deploy from `main` (GitHub Actions)

Workflow: [`.github/workflows/release.yml`](../.github/workflows/release.yml) (**Release and deploy**).

On each push to `main` (except release commits marked `[skip ci]`):

1. `semantic-release` bumps the version if needed (updates `package.json` in the job workspace)
2. production build (footer version comes from that bumped `package.json`)
3. `rsync` of `dist/` to the VPS

One pipeline run → one deploy, footer matches the GitHub Release. Manual re-deploy without a new release: **Actions → Release and deploy → Run workflow** (skips semantic-release, builds current `main`).

### One-time server setup

1. Create a deploy key on your machine (or on the VPS):

```sh
ssh-keygen -t ed25519 -C "github-actions-win-predict-ai" -f ./deploy_key -N ""
```

2. Put the **public** key on the VPS (`~/.ssh/authorized_keys` for the deploy user). Ensure that user can write the web root:

```sh
# on VPS, as root
mkdir -p /var/www/win-predict-ai/dist
# if deploy user is not root:
# chown -R deployuser:deployuser /var/www/win-predict-ai
```

3. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret | Example |
| --- | --- |
| `VPS_HOST` | `202.71.15.138` |
| `VPS_USER` | `root` (or your deploy user) |
| `VPS_PATH` | `/var/www/win-predict-ai/dist` |
| `VPS_SSH_KEY` | full private key (`-----BEGIN OPENSSH PRIVATE KEY-----` …) |

4. Push to `main` (or run the workflow manually) and check **Actions → Release and deploy**.

## Manual build and publish

Fallback if Actions is unavailable. On your machine (or on the VPS):

```sh
export NODE_AUTH_TOKEN=ghp_xxxxxxxx   # PAT with read:packages
npm ci
npm run build                          # output in dist/
sudo mkdir -p /var/www/win-predict-ai
rsync -avz --delete dist/ root@202.71.15.138:/var/www/win-predict-ai/dist/
```

## Nginx

Production layout (see `deploy/nginx-domain.conf` / admin `deploy/nginx.conf`):

- `/` → Vue SPA (`/var/www/win-predict-ai/dist`)
- `/admin/` → Nuxt admin (`127.0.0.1:3000/admin/`)
- `/api/` → Nuxt (`127.0.0.1:3000/admin/api/`)
- `/win-predict-ai/*` → 301 to `/*`

Apply via `gh workflow run apply-path-layout.yml` or copy the nginx config and reload.

## Acceptance checks

1. Open `https://win-predict-ai.com/` — page loads; assets under `/assets/…`.
2. DevTools → Network: manifest from `https://win-predict-ai.com/api/leagues.json` with status 200.
3. Prediction files load from `onlyzoran.github.io` over HTTPS — expected.
4. Admin at `https://win-predict-ai.com/admin/`; login link in the app header goes there.

## Notes

- Prefer auto-deploy via `release.yml` (release + single deploy).
- Production Vite `base` is `/`. PR previews still set `VITE_BASE_PATH=/win-predict-ai-preview/pr-N/`.
- Goal-demo (orchestrator): `VITE_BASE_PATH=/app-preview/issue-N/`, static files under `/var/www/win-predict-ai-app-preview/issue-N/`, URL `https://win-predict-ai.com/app-preview/issue-N/`. Deploy locally: `chmod +x deploy/goal-preview-up.sh && ./deploy/goal-preview-up.sh 35`. PR workflow deploys Goal-demo when the PR body contains `win-predict-ai-orchestrator#N`. Nginx bootstrap: `scripts/ensure-app-preview-nginx-remote.sh` over SSH on first deploy.
