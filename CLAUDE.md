# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

A **template app** for VoipAppz customer apps: React 19 + MUI 7 + Vite in the browser,
a small **Hono** server on Node, deployed with **Kamal**. It is shaped after the mother
app, `~/voipappz/app` (React + MUI), and shares its components rather than copying them.
Keep it simple: a template carries the shell and one example page, nothing customer-specific.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the pieces fit.

## Commands

| Command | What |
|---|---|
| `make install` | First run: `.env` from `.env.example`, packages |
| `make dev` | Hono server (:3000) + Vite with HMR (:4200) |
| `make check` | Lint + unit tests (React jsdom, server node) + build — run before pushing |
| `make start` | The production build served by Hono on :3000 |
| `make image` | The production image, built and run locally on :3000 |
| `make test` | Playwright (`tests/`) against a running app |
| `make setup` | Prepare a Supabase project (see SETUP.md) |
| `kamal deploy -d <customer>` | Deploy (see Deploy) |

## Layout

| Path | What |
|---|---|
| `src/` | The React app: `components/` (Layout, MainMenu, Login, Phone, Conversations = the example page), `context/` (auth, direction/theme, phone), `i18n/`, `theme/`, `lib/` |
| `server/index.js` | The Hono server: `/health`, `/api/*` + `/auth/*` passed to voipappz-api, the built app |
| `config/deploy.yml` | Kamal base; `config/deploy.<customer>.yml` per customer (start from `deploy.example.yml`) |
| `Dockerfile.production` | The image Kamal builds: React build + Hono, Node 24 slim |
| `migrations/`, `scripts/setup-supabase.mjs` | Supabase (sign-in and the example page's data) |
| `tests/` | Playwright smoke tests |

## Rules

- **Sign-in is Supabase** (`src/lib/clients/supabase.ts`, `src/components/Login/`).
- **The browser talks only to its own origin.** `/api/*` and `/auth/*` go through the Hono
  server to `VOIPAPPZ_API_URL`; no CORS, no API host in the bundle.
- **Secrets never reach the browser or the repo.** Only `VITE_*` values are baked into the
  bundle, and they are public by design. Server settings are runtime env. Deploy secrets
  live in `.kamal/secrets` (gitignored).
- **Share, don't fork, the mother app's components** (`~/voipappz/app/packages/*`), pinned.
- **Hebrew (RTL) and English**, light and dark themes, plain words for non-technical users.
- Keep files small; prefer the simplest thing that works; no mock data outside tests.

## Server (Hono)

`server/index.js` stays thin: `/health` (local, never calls the API), the pass-through
(hop-by-hop headers dropped, redirects passed back, 504/502 on timeout/failure), the
build's assets (`/assets/*` cached for a year, a missing one is a 404), the page itself
never cached, no dotfiles. `VOIPAPPZ_API_URL` is required in production. Add an app's own
routes here when it needs a secret (webhooks, tokens). Tests: `server/index.test.js`.

## Deploy (Kamal)

- `kamal setup -d <customer>` once per host, then `kamal deploy -d <customer>`.
- `require_destination: true`: a bare deploy is refused.
- kamal-proxy checks `/health`; `asset_path` keeps the previous release's assets during a
  swap; `retain_containers: 5` for `kamal rollback`.
- Hooks: `pre-build` runs the server tests; `post-deploy` checks `/health` and `/` when
  `KAMAL_HEALTHCHECK_URL` is set.
