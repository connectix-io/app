# Architecture — conversations

A **conversation-first** customer communication app (Chatwoot / Smarticks style),
Hebrew + English. Every customer has **one thread** that holds all their calls,
messages and notes. Telephony comes from **voipappz-api**; everything else —
conversations, routing, rules — is built **here**.

## The vision in one picture

```
                 ┌──────────── this repo ────────────────────────────────┐
 Browser ──────► │ React app (Vite)                                      │
 (he / en)       │   Conversations table · thread · phone dock           │
                 │        │ reads (queries)            │ commands         │
                 │        ▼                             ▼                 │
                 │   read model (views)  ◄── events ── write model        │
                 │                          (event store, append-only)    │
                 │   backend: CQRS on noddde (target) · deno-api (today)  │
                 └───────────▲──────────────────────────▲─────────────────┘
                             │ cable (live call events) │ calls / SMS / extensions
                        ┌────┴──────────────────────────┴────┐
                        │ va-crystal cable · voipappz-api    │
                        └────────────────────────────────────┘
 Auth: Supabase.   Data: one Postgres database per customer (tenant).
```

## Principles

1. **Conversations are the product.** The main screen is the conversations table;
   dashboard, reports and settings are secondary.
2. **One customer = one thread.** The conversation id is derived from the customer's
   normalized phone (or email) — `src/components/Conversations/customerKey.js` and its
   twin `api/customer_key.ts`. A call, an SMS and a message from the same person land
   in the same thread, with no lookup table.
3. **CQRS + event sourcing.** Commands append events; events are the only truth;
   screens read views folded from events. Events are never edited or deleted.
4. **One database per customer (tenant).** Each tenant's events and views live in its
   own Postgres database. No cross-tenant tables or queries. The tenant is resolved
   from the authenticated identity, never from the request body.
5. **All call information arrives over the va-crystal cable, saved through CQRS.**
   deno-api is a cable client (`api/cable.ts`, ActionCable `CallEvents`): `call.completed`
   and `transcription.completed` become commands that append conversation events
   (`call.logged`, summary) — never direct inserts. Actions (place a call, SMS,
   extensions) go to voipappz-api (API / MCP). No webhooks; the switch is never
   re-implemented here.
6. **Simple first.** One events table, views on top; add a projection table only when
   a view gets slow.

## Pieces

| Piece | Where | Role |
|---|---|---|
| React app | `src/` (Vite :4200) | Conversations (main), phone dock, dashboard, reports. |
| Conversations UI | `src/components/Conversations/` | Table, thread drawer, new-conversation dialog. |
| Commands (write side) | `conversationCommands.js` | Validate + append one event each. |
| Queries (read side) | `conversationQueries.js` | Read the `conversations` view and a thread's events; live via Supabase realtime. |
| Event store + view | `migrations/001_conversations_event_store.sql` | `events` (append-only, RLS) + `conversations` view. |
| deno-api | `api/` (:4001) | va-crystal cable client: live relay today; next: cable call events → CQRS commands, per tenant. |
| Supabase | hosted | Auth (email + password) and, today, the Postgres that holds events. |
| va-crystal cable | `../va-crystal` | Source of all call information (`CallEvents`, transcripts). |
| voipappz-api | `../voipappz-api` | Actions: place calls, SMS, extensions (API / MCP). |

## Events (the conversation model)

| Event | Data |
|---|---|
| `conversation.opened` | contact_name, contact_phone, contact_email, contact_key, channel, language |
| `message.added` | text, channel, direction (`in` / `out`) |
| `note.added` | text (internal) |
| `call.logged` | call_uuid, direction, duration_sec, summary |
| `status.changed` | status: `open` / `pending` / `resolved` |
| `conversation.assigned` | assignee (email; empty = unassigned) |
| *(every event)* | `by` (who did it, email) — plus `actor_id`, stamped by the database |

## Where it is going (and what is interim)

| Today (works now) | Target |
|---|---|
| The browser appends events to Supabase directly (RLS: signed-in users, insert-only). | All writes go through a **noddde** backend (`domain.dispatchCommand`); the browser loses insert rights. See the `cqrs-noddde` skill (`.claude/skills/cqrs-noddde/SKILL.md`). |
| One Supabase project. | One Postgres database per tenant, wired per request (`domainFor(tenant)`). |
| Calls logged by hand. | Cable `call.completed` → `LogCall` command (customer = caller for inbound, callee for outbound), idempotent per `call_uuid`; `transcription.completed` → call summary. One cable subscription per tenant (`account_uuid` in the cable JWT) → that tenant's database. |
| The WebRTC phone has no SIP credentials. | **Later:** the phone's SIP username + password come from voipappz-api `GET /devices/:id/phone` — a short-lived signed token (default 1 h) with `username`, `password`, `domain`, `wss_server`, `display_name`. Fetch it at runtime and refresh before `expires_at`; never store or commit the password. Needs a voipappz-api Bearer token (never `X-VA-Auth`); the app's origin must be in production Kong's CORS list. |
| Every signed-in user is `admin`; users are Supabase users. | **Later:** users, calls and billing all load from voipappz-api (users = its user/extension records with their roles). Conversations stay here, in the event store. |
| — | WhatsApp, bot-first with human handoff (later). |

## Auth

Supabase email + password (`src/lib/clients/supabase.ts`). The session is mirrored
into the app's `localStorage.auth` so the ACL and route gate read one shape
(`src/lib/auth.ts`, `src/context/AuthContext.jsx`). Screens that still call
voipappz-api with a bearer token (Calls, Reports) need a voipappz-api token, which
the Supabase login does not provide — see "Known gaps" in `README.MD`.

## Key env

| Env | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | browser (public) | Supabase project + publishable key. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | deno-api only | Server-side writes (cable → events). Never `VITE_`-prefixed. |
| `VITE_MOTHERSHIP_URL` | browser | voipappz-api base (phone, calls). |
| `CABLE_URL` / `SECRET_KEY` / `CABLE_ACCOUNT_UUID` | deno-api | va-crystal cable: the source of all call information. |

## Verify

```bash
npm run build && npm run test:run     # frontend
make ci-local                          # the GitHub Actions CI, locally (act)
```
