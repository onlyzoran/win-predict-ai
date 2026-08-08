# Deploy frontend to VPS

Serve this Vue app from the same origin as the admin API so the browser can load the leagues manifest without Mixed Content or CORS issues.

| Piece | URL |
| --- | --- |
| Frontend | `http://202.71.15.138/win-predict-ai/` |
| Manifest API | `http://202.71.15.138/api/leagues.json` |
| Prediction / history JSON | `https://onlyzoran.github.io/win-predict-ai-data/data/…` (HTTPS is fine from an HTTP page) |

Production build uses `base: '/win-predict-ai/'` and:

```
VITE_LEAGUES_URL=/api/leagues.json
VITE_DATA_BASE_URL=https://onlyzoran.github.io/win-predict-ai-data/data
```

`VITE_LEAGUES_URL` is root-relative, so it resolves to the same host as the page (`http://202.71.15.138/api/leagues.json`) and does not go through the Vite `base` path.

HTTPS / custom domain is out of scope for this setup — keep everything on HTTP on one origin for now.

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

Admin app already runs under pm2 on `127.0.0.1:3000`; Nginx proxies `/api/` to it. Do **not** change that.

In the existing server block (`/etc/nginx/sites-available/win-predict-ai-admin`), add a static location **before** the catch-all `location /` that proxies to Node. Order matters: if `/` comes first, `/win-predict-ai/` is never served as static files.

```nginx
location /win-predict-ai/ {
    alias /var/www/win-predict-ai/dist/;
    try_files $uri $uri/ /win-predict-ai/index.html;
}
```

The SPA uses history mode, so the `try_files` fallback to `/win-predict-ai/index.html` is required.

Then:

```sh
sudo nginx -t && sudo systemctl reload nginx
```

## Acceptance checks

1. Open `http://202.71.15.138/win-predict-ai/` — page loads; assets under `/win-predict-ai/assets/…`.
2. DevTools → Network: manifest from `http://202.71.15.138/api/leagues.json` with status 200, no Mixed Content, no CORS errors.
3. Prediction files (`epl-….json`, `history/*`) load from `onlyzoran.github.io` over HTTPS — expected.
4. Change a tournament in the admin panel; reload the frontend — the update appears immediately.

## Notes

- Prefer auto-deploy via `release.yml` (release + single deploy). The old GitHub Pages workflow was removed; hosting is VPS-only.
- Vite `base` must remain `/win-predict-ai/` so asset URLs match the Nginx path.
