# Win Predict AI

Vue 3 frontend that shows win probabilities for sports tournaments and other events.

## Data sources

1. **Tournament manifest** — from the admin API (`VITE_LEAGUES_URL`), backed by SQLite. Updates from the admin panel appear immediately (no GitHub Pages cache).
2. **Prediction / history JSON** — from [`win-predict-ai-data`](https://github.com/onlyzoran/win-predict-ai-data) on GitHub Pages (`VITE_DATA_BASE_URL`).

Default URLs:

```
VITE_LEAGUES_URL=http://202.71.15.138/api/leagues.json
VITE_DATA_BASE_URL=https://onlyzoran.github.io/win-predict-ai-data/data
```

On load the app fetches the manifest, then per-league files (e.g. `epl-26-27.json`) with `{ "team": string, "win_predict": number }`.

### Local / alternate data source

If `VITE_LEAGUES_URL` is unset, the manifest falls back to `{VITE_DATA_BASE_URL}/leagues.json`.  
If `VITE_DATA_BASE_URL` is unset, prediction files fall back to `{BASE_URL}data`.

## Environment

| Variable | Description |
| --- | --- |
| `VITE_LEAGUES_URL` | Full URL of the tournament manifest JSON. |
| `VITE_DATA_BASE_URL` | Base URL for prediction/history JSON (no trailing slash). |

Committed defaults:

- [`.env.development`](.env.development) — API manifest + Pages data
- [`.env.production`](.env.production) — same for the GitHub Pages build

Override locally with `.env.local` (gitignored), for example:

```sh
# .env.local
VITE_LEAGUES_URL=http://localhost:3000/api/leagues.json
VITE_DATA_BASE_URL=http://localhost:4173/data
```

## Setup

Node `^22.18.0` or `>=24.12.0`.

Icons come from [`@onlyzoran/win-predict-ai-icons`](https://github.com/onlyzoran/win-predict-ai-icons) (GitHub Packages). Even though the package is public, npm needs a GitHub PAT with `read:packages`:

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

## Versioning and changelog

Releases are automated with [semantic-release](https://semantic-release.gitbook.io/) on every push to `main`. Major stays at `0`; each merge bumps **minor** or **patch** and updates [`CHANGELOG.md`](CHANGELOG.md).

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Commit | Version bump |
| --- | --- |
| `feat: …` | minor (`0.x.0`) |
| `fix: …`, `chore: …`, `refactor: …`, other types | patch (`0.0.x`) |
| Breaking change (`BREAKING CHANGE:` / `feat!:`) | minor (while major is `0`) |

Example: `feat: add standings chart` → `0.1.0`; `fix: correct date formatting` → `0.0.1`.

The first release needs a baseline tag on `main` (once):

```sh
git tag v0.0.0
git push origin v0.0.0
```
