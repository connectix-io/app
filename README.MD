# VoipAppz app template

A starting point for VoipAppz customer apps: **React + MUI** in the browser, a small
**Hono** server, deployed with **Kamal**. Shaped after the mother app
(`~/voipappz/app`) and sharing its components.

- How it fits together → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Conventions and commands → [CLAUDE.md](./CLAUDE.md)
- Supabase sign-in setup → [SETUP.md](./SETUP.md)
- Deploying to a new server → [DEPLOY.md](./DEPLOY.md)

## Quick start

Node 24 (`.nvmrc`). Then:

```bash
make install             # creates .env from .env.example, installs packages
make dev                 # Hono :3000 + Vite :4200 → http://localhost:4200
```

Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env` to sign in. `make help` lists everything.

## Check before you push

```bash
make check               # lint + React and server tests + build (what CI runs)
make start               # the production build, served by Hono, on :3000
make image               # the real production image, run locally on :3000
```

## Settings

| Variable | Where | What |
|---|---|---|
| `VOIPAPPZ_API_URL` | server, runtime (`.env`, Kamal `env`) | The voipappz-api; `/api/*` and `/auth/*` are passed to it. Required in production. |
| `PORT` | server, runtime | Default 3000. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | browser, build time | Supabase sign-in. Public by design. |
| `VITE_APP_NAME`, `VITE_BRAND_LOGO`, `VITE_BRAND_LOGO_WHITE`, `VITE_PRIMARY_COLOR` | browser, build time | Optional branding. |

Anything secret is a server setting, never `VITE_*`.

## CI

GitHub Actions (`.github/workflows/ci.yml`): lint + build, unit tests, Playwright, a
dependency audit (blocking for what ships), and the Docker image (published to GHCR from
`main`). Run it locally with [act](https://github.com/nektos/act): `make ci-local`
(`JOB=e2e` for one job).

## Deploy

```bash
cp config/deploy.example.yml config/deploy.acme.yml    # domain, API url, SSH
cp .kamal/secrets.example .kamal/secrets               # registry token, host, VITE_* keys
make setup-server DEST=acme   # first time on a new server
make deploy DEST=acme         # every release
```

Step by step, day-to-day commands and troubleshooting: [DEPLOY.md](./DEPLOY.md).
