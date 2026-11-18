# VoipAppz app template

A starting point for VoipAppz customer apps: **React + MUI** in the browser, a small
**Hono** server, deployed with **Kamal**. Shaped after the mother app
(`~/voipappz/app`) and sharing its components.

- How it fits together → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Conventions and commands → [CLAUDE.md](./CLAUDE.md)
- Supabase sign-in setup → [SETUP.md](./SETUP.md)

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

## Deploy

```bash
cp config/deploy.example.yml config/deploy.acme.yml    # host, domain, API url
cp .kamal/secrets.example .kamal/secrets               # registry token, host, VITE_* keys
kamal setup -d acme      # first time on a host
kamal deploy -d acme     # every release
```
