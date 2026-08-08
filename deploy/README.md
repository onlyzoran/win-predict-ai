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

## Build and publish

On the VPS (or locally, then sync `dist/`):

```sh
export NODE_AUTH_TOKEN=ghp_xxxxxxxx   # PAT with read:packages
npm ci
npm run build                          # output in dist/
sudo mkdir -p /var/www/win-predict-ai
sudo rsync -a --delete dist/ /var/www/win-predict-ai/dist/
```

(`cp -r dist/. /var/www/win-predict-ai/dist/` works too.)

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

- GitHub Pages workflow (`.github/workflows/deploy.yml`) can stay enabled or be disabled later; it does not affect the VPS deploy. Do not remove it unless intentional.
- Vite `base` must remain `/win-predict-ai/` so asset URLs match the Nginx path.
