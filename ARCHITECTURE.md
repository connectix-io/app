# Architecture

```
browser (React + MUI, he/en, light/dark)
   │  same origin only
   ▼
Hono server (Node, one container, deployed with Kamal)
   ├─ /health                 kamal-proxy's health check
   ├─ /api/*, /auth/*  ─────▶ voipappz-api (VOIPAPPZ_API_URL)
   └─ /, /assets/*, …         the built React app (dist/)

Supabase: sign-in (and the example page's data)
```

## Pieces

| Piece | Where | Role |
|---|---|---|
| React app | `src/` | The shell (layout, menu, sign-in, phone, themes, Hebrew/English) and one example page |
| Hono server | `server/index.js` | Serves the app; passes the API through; room for app-specific routes |
| Supabase | hosted | Sign-in; data for the example page (`migrations/`) |
| voipappz-api | the mothership | Customers, devices, calls, billing — reached through `/api/*` |
| Kamal | `config/` | Build, push, boot, health check, zero-downtime swap, rollback, per customer |

## Shared with the mother app

The mother app (`~/voipappz/app`) is React + MUI too. Its packages
(`packages/chat-ui`, `conversations-ui`, `dashboard-ui`) are consumed pinned, not copied;
a fix lands once in the mother app and reaches every template-based app on upgrade.

## Why Hono

TypeScript/JavaScript like the rest of the app, small, and runtime-agnostic: the same
routes run on Node (today), Bun, Deno, Cloudflare or Lambda — only the adapter at the
bottom of `server/index.js` changes.
