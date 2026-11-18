# VoipAppz app template

A starting point for VoipAppz customer apps: **React + MUI** in the browser, a small
**Hono** server, deployed with **Kamal**. Shaped after the mother app
(`~/voipappz/app`) and sharing its components.

- How it fits together → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Conventions and commands → [CLAUDE.md](./CLAUDE.md)
- Supabase sign-in setup → [SETUP.md](./SETUP.md)

## Quick start

```bash
cp .env.example .env     # VOIPAPPZ_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
make dev                 # Hono :3000 + Vite :4200 → http://localhost:4200
```

## Test

```bash
npm run test:run         # React + server unit tests
npm run lint
```

## Deploy

```bash
cp config/deploy.example.yml config/deploy.acme.yml    # host, domain, API url
cp .kamal/secrets.example .kamal/secrets               # registry token, host, VITE_* keys
kamal setup -d acme      # first time on a host
kamal deploy -d acme     # every release
```
