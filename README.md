# Win Predict AI

Vue 3 frontend that shows win probabilities for sports tournaments and other events. League data is **not** stored in this repo — it is loaded at runtime from a separate [data repository](https://github.com/onlyzoran/win-predict-ai-data) published on GitHub Pages.

## Data repository

Predictions live in [`win-predict-ai-data`](https://github.com/onlyzoran/win-predict-ai-data) and are served from:

```
https://onlyzoran.github.io/win-predict-ai-data/data/
```

On load the app fetches:

1. **`leagues.json`** — manifest of leagues (id, title, sport, dates, path to the predictions file)
2. **Per-league JSON** (e.g. `epl-26-27.json`) — array of `{ "team": string, "win_predict": number }`

Update predictions by changing files in the data repo; this app picks them up without a redeploy (after the Pages CDN refreshes).

### Local / alternate data source

If `VITE_DATA_BASE_URL` is unset, the app falls back to `{BASE_URL}data` (i.e. a `public/data` folder under the Vite base path). Point the env var at any origin that serves the same JSON layout.

## Environment

| Variable | Description |
| --- | --- |
| `VITE_DATA_BASE_URL` | Base URL for JSON data (no trailing slash). Defaults to `{BASE_URL}data` if omitted. |

Committed defaults:

- [`.env.development`](.env.development) — remote data repo (same as production)
- [`.env.production`](.env.production) — remote data repo used for the GitHub Pages build

Override locally with `.env.local` (gitignored), for example:

```sh
# .env.local
VITE_DATA_BASE_URL=http://localhost:4173/data
```

## Setup

Node `^22.18.0` or `>=24.12.0`.

Sport icons come from [`@onlyzoran/win-predict-ai-icons`](https://github.com/onlyzoran/win-predict-ai-icons) (GitHub Packages). Even though the package is public, npm needs a GitHub PAT with `read:packages`:

```sh
export NODE_AUTH_TOKEN=ghp_xxxxxxxx
npm install
npm run dev
```

A project [`.npmrc`](.npmrc) points the `@onlyzoran` scope at `npm.pkg.github.com`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview the production build |
| `npm run test:unit` | Unit tests (Vitest) |
| `npm run lint` | ESLint + Oxlint |
| `npm run format` | Format `src/` with Oxfmt |

The app is configured with `base: '/win-predict-ai/'` for GitHub Pages deployment (see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).
