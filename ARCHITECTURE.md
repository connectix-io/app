# Architecture — conversations

A **conversation-first** customer communication app for agents (non-technical),
Hebrew + English. Every customer has **one thread** that holds all their calls,
messages and notes.

> Status: the **target design** below was agreed on 2026-11-13. Today the app still
> reads and writes events in Supabase — see "Today → target" at the end.

## The picture

```
 CLOUD — mothership (voipappz-api, Ruby): the brain
   Postgres · RubyEventStore = the durable copy of every conversation event
   login and tokens · customers · environments · billing · actions (call, SMS)
            ▲ NATS: conversation events, sent by the node's outbox
            │ (the same pattern as cdr.write.bulk today)
 SWITCH — node (../va-crystal/node, Crystal), with crystal-es EMBEDDED
   conversations domain in crystalbank's layout:
     commands → aggregates (rules, versioned) → events → projections → reactors
   storage: SQLite (one file per customer) — events, outbox queue, encryption keys
   calls from FreeSWITCH → call.logged
   cable (live) · ApiProxy (login) · HTTP API (commands + queries)
            ▲ one cable connection + HTTPS — the browser talks to the node only
 Agents' browser: this app — screens only (list · chat · notes · status · phone)
```

The admin console for managers stays in `../voipappz/app` (MUI). This repo has no
backend and no API layer (deno-api is removed).

## Who owns what

| Part | Owns | Never does |
|---|---|---|
| **Mothership (Ruby)** | users, login, customers, billing, provisioning, outbound actions; the durable copy of conversation events | conversation rules |
| **Node (Crystal + crystal-es)** | conversation rules, events (working store), the list, calls, live delivery | billing, user management |
| **This app** | screens | rules, storage, talking to the mothership directly |

## Flows

1. **Login** — browser → node `ApiProxy` (`/auth`) → mothership → token. The node
   checks the token on every call and cable connection; a user only sees their own
   environment (derived from the token, never from the request).
2. **Action** (message, note, status, assign) — browser → node command → the
   aggregate checks the rules (and the version: two agents can't overwrite each
   other) → event saved in SQLite → projection updated → reactors push it to the
   cable and put it on the outbox → every open screen updates.
3. **Call** — FreeSWITCH → node → the customer's conversation by normalized phone →
   `call.logged`, the same way.
4. **Open a conversation** — browser → node query: that conversation's events; new
   ones arrive over the cable.
5. **Sync up** — the outbox sends each event to the mothership over NATS; a
   mothership subscriber appends it to RubyEventStore. If the cloud is down, events
   wait in the outbox and go when it is back. **The switch keeps working offline.**
6. **Rebuild** — projections can be replayed from the node's events at any time;
   a lost node can be restored from the mothership's copy.

## Events (unchanged — the logic the app already has)

| Event | Data |
|---|---|
| `conversation.opened` | contact_name, contact_phone, contact_email, contact_key, channel, language |
| `message.added` | text, channel, direction (`in` / `out`) |
| `note.added` | text (internal) |
| `call.logged` | call_uuid, direction, duration_sec, summary |
| `status.changed` | status: `open` / `pending` / `resolved` |
| `conversation.assigned` | assignee (empty = unassigned) |
| *(every event)* | `by` (who did it) and when |

One customer = one thread: the conversation id comes from the customer's normalized
phone (or email).

## What crystal-es and crystalbank give us

| | |
|---|---|
| Aggregates with versioning | concurrent changes conflict instead of overwriting |
| Projections + replay | the list and search are built from events and can always be rebuilt |
| Reactors | live push, sync to the mothership, follow-up actions |
| Outbox queue | nothing is lost while the cloud is unreachable |
| Encryption of personal data | phone, name and messages encrypted per customer; destroying the key erases them (privacy requests) without editing events |
| Scopes + permissions (crystalbank) | who sees which environment / team, enforced in the data |
| Approvals (crystalbank) | later: a supervisor approves before something is sent |
| OpenAPI + events API (crystalbank) | a documented API and an audit trail |

## Principles

1. **Events are the truth** — appended only, never edited.
2. **The browser talks only to the node.**
3. **Rules on the node, durable copy on the mothership.**
4. **SQLite on the node, no Postgres.** crystal-es needs only the generic `db`
   shard; the node adds SQLite versions of its three storage parts (event store,
   queue — an outbox table instead of `pgmq` — and key store).
5. **Simple.** No backend in this repo.

## To build

| Where | What |
|---|---|
| `va-crystal/node` | Add `crystal-es` + `sqlite3`; SQLite event store / queue / key store; the `conversations` domain (api, commands, aggregates, events, projections, queries, reactors); a cable channel for live events; call → `call.logged`. |
| `voipappz-api` | A NATS subscriber that appends incoming conversation events to RubyEventStore. |
| This app | Remove deno-api and the pages that depend on it; connect to the node (login via ApiProxy, commands + queries, cable); remove Supabase. |

## Open decisions

1. Does a switch serve one customer or several? (One SQLite file per customer.)
2. Who serves the app's files: the node (opens even when the cloud is down) or a
   CDN (simpler releases)?
3. Must login work while the cloud is down? (Today it goes through the mothership.)
4. How node and app versions roll out to each switch.

## Today → target

| Today | Target |
|---|---|
| Supabase: `events` table + `conversations` view; the browser writes directly (RLS). | crystal-es on the node (SQLite), copied to the mothership. |
| Supabase Auth. | Mothership login through the node. |
| Supabase realtime. | Node cable. |
| deno-api (`api/`): cable relay, transcripts, calls-per-hour. | Removed. |
| The WebRTC phone has no SIP credentials. | From the mothership, `GET /devices/:id/phone` (short-lived; never stored). |

## Verify

```bash
npm run build && npm run test:run     # frontend
make ci-local                          # the GitHub Actions CI, locally (act)
```
