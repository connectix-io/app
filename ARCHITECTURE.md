# Architecture — conversations

A **conversation-first** customer communication app for agents (non-technical),
Hebrew + English. Every customer has **one thread** that holds all their calls,
messages and notes. **It must keep working offline** — when the switch loses the
internet, agents keep answering calls, chatting and adding notes.

> Status: the **target design** below was agreed on 2026-11-17. Today the app still
> reads and writes events in Supabase — see "Today → target" at the end.

## The picture

```
 CLOUD — mothership (voipappz-api, Ruby): the brain
   Postgres = the durable store · login and tokens · customers · billing
            ▲ NATS request/reply (deno's outbox; ack only after the DB commit)
 SWITCH
   node (../va-crystal/node, Crystal) — UNCHANGED, stateless by rule
     cable · ApiProxy · CallEvents · NATS WSS :9222
            ▲ NATS over WSS + cable
   deno (this repo's api/) — the conversation service
     commands → events in SQLite → the list (fold) → live to the browser
     outbox → mothership · call events → call.logged · serves the app's files
            ▲ HTTPS + WebSocket
 Agents' browser: this app — screens only (list · chat · notes · status · phone)
```

Why deno and not the node: the node may hold no data (`va-crystal/CLAUDE.md`,
"Data Access Boundaries"). Why on the switch and not the cloud: offline.

## Who owns what

| Part | Owns | Never does |
|---|---|---|
| **Mothership (Ruby)** | login, customers, billing, outbound actions; the durable copy of every conversation event | conversation rules |
| **Node (Crystal)** | calls, live call/agent state, `ApiProxy` | store anything |
| **deno (this repo)** | conversation rules, events (SQLite), the list, the outbox, live push, serving the app | billing, user management |
| **The browser app** | screens | rules, storage, talking to NATS or the mothership directly |

## Flows

1. **Action** (message, note, status, assign) — browser → deno → the command checks
   the rules and the stream's expected version → **one SQLite transaction** writes
   the event **and** its outbox row → the list updates → pushed live to every open
   screen.
2. **Call** — node `CallEvents` → deno → the customer's thread by normalized phone →
   `call.logged`, idempotent per `call_uuid`.
3. **Sync up** — the outbox sends each event to the mothership (NATS request/reply);
   the row is cleared **only after the mothership acknowledges its DB commit**.
   Retries are safe: every event has a stable id the mothership de-duplicates on.
   While the cloud is down, rows wait; they survive restarts.
4. **Login** — online: mothership `/auth` through the node's `ApiProxy`; deno checks
   the token and derives the environment from it, never from the request. Offline:
   see "Offline rules".
5. **Recovery** — a replaced switch restores its SQLite from the mothership's copy.

## Events (unchanged — the logic the app already has)

| Event | Data |
|---|---|
| `conversation.opened` | contact_name, contact_phone, contact_email, contact_key, channel, language |
| `message.added` | text, channel, direction (`in` / `out`) |
| `note.added` | text (internal) |
| `call.logged` | call_uuid, direction, duration_sec, summary |
| `status.changed` | status: `open` / `pending` / `resolved` |
| `conversation.assigned` | assignee (empty = unassigned) |
| *(every event)* | id, `by` (who did it, from the token), when |

Recording a message is separate from sending it (SMS / WhatsApp go out through the
mothership as their own action).

## Offline rules (must be decided and built, not assumed)

- **Login offline:** agents already signed in keep working until their token
  expires; a new sign-in needs the cloud — unless deno caches verified users.
- **The app's files** are served by deno on the switch, so the app opens offline.
- **Disk full / corruption:** SQLite in WAL mode, a size alarm, and the mothership
  copy as the recovery source.
- **Per-agent identity everywhere:** every command, query and live subscription
  checks the agent's own token and environment (no shared operator login).
- **The phone** runs on its own in the browser, outside the pages, with short-lived
  SIP credentials from the mothership (`GET /devices/:id/phone`) — never stored.

## Principles

1. Events are the truth — appended only, never edited.
2. The browser talks to deno only; only deno talks to NATS (NATS login is not
   enforced yet — `nats/AUTH_CALLOUT.md`).
3. The node stays unchanged and stateless.
4. Simple: one service (deno) on the switch next to the node.

## Open decisions

1. Mothership side: write into `messages` (type `chat`, the 2026-11-03 decision,
   `crystal_subscribe` request/reply) or into RubyEventStore.
2. One customer or several per switch (one SQLite file each).
3. Offline sign-in: cached users on deno, or sign-in needs the cloud.
4. How deno and app versions roll out to each switch.

## Today → target

| Today | Target |
|---|---|
| Supabase `events` + `conversations` view; the browser writes directly. | deno + SQLite, copied to the mothership. |
| Supabase Auth. | Mothership login through the node. |
| Supabase realtime. | deno's WebSocket. |
| deno-api: cable relay, transcripts, calls-per-hour, Influx. | deno: the conversation service only. |
| Dashboard, Calls, Reports, Status pages. | Removed — conversations only. |

## Verify

```bash
npm run build && npm run test:run     # frontend
make ci-local                          # the GitHub Actions CI, locally (act)
```
