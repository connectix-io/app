---
name: cqrs-noddde
description: Build or change the conversations backend with CQRS + event sourcing on noddde (TypeScript, Drizzle + PostgreSQL), one database per customer (tenant). Use whenever adding or changing a command, event, aggregate, projection, query, saga or the va-crystal cable consumer that writes conversation data, wiring a tenant's database, or deciding where a piece of conversation logic belongs (write side vs read side).
---

# CQRS with noddde — conversations

The conversation model is **CQRS + event sourcing**. Commands go to aggregates,
aggregates emit events, events are the only source of truth, and every screen
reads a projection built from events. The framework is
[noddde](https://github.com/dogganidhal/noddde) (`@noddde/*` **0.3.9**, pre-1.0 —
pin exact versions and re-check the docs on upgrade).

Docs: https://noddde.dev · Postgres sample: `samples/sample-hotel-booking` in the repo.

## Rules (non-negotiable)

1. **Writes only through `domain.dispatchCommand`** on the server. Nothing else
   inserts into the event store — not the browser, not the cable consumer, not a script.
2. **One database per customer (tenant).** Each tenant's events, views and
   snapshots live in that tenant's own Postgres database. No cross-tenant table,
   no `tenant_id` column doing isolation, no query that spans tenants.
3. **Tenant comes from the authenticated identity, never from the request body**
   (user JWT claim, or the cable subscription's `account_uuid` → tenant id → that
   tenant's wired domain).
4. **One customer = one conversation stream.** The `Conversation` aggregate id is
   the customer's derived stream id (`streamIdFor(customerKey(...))`, see
   `api/customer_key.ts`), so calls, SMS and messages from one person share a thread.
5. **`decide` holds the business rules** (may throw to reject). **`evolve` is pure**
   (no I/O, no clock, no randomness) — it is replayed on every load.
6. **Events are immutable, past tense** (`MessageAdded`, not `AddMessage`). Never
   edit or delete an emitted event; change its shape with an **upcaster**.
7. **The aggregate id is not in state** — it is `command.targetAggregateId`.
8. **Reads never touch the write model.** Screens read projection views through
   queries (`domain.dispatchQuery` / the view store), not aggregate state.
9. Every new command/event ships with a `testAggregate` test; every new
   projection with a `testDomain` test asserting the view.

## Where things go

```
backend/src/conversations/
  events.ts        DefineEvents<{...}>      past-tense facts
  commands.ts      DefineCommands<{...}>    imperatives
  aggregate.ts     defineAggregate          initialState + decide + evolve
  projections/     defineProjection         views + queryHandlers
  domain.ts        defineDomain             static structure (pure)
backend/src/tenancy.ts   tenant → wired domain (cached)
backend/src/http/        routes: auth → tenant → dispatchCommand / dispatchQuery
backend/src/cable/       va-crystal cable consumer → commands (never raw inserts)
```

## API cheat sheet (verified against noddde 0.3.9 docs)

```ts
import { defineAggregate, defineProjection, defineDomain,
         DefineCommands, DefineEvents, DefineQueries, type ViewStore } from "@noddde/core";
import { wireDomain } from "@noddde/engine";

type ConversationEvent = DefineEvents<{
  ConversationOpened: { contactName: string; contactPhone: string; channel: Channel; language: string };
  MessageAdded:       { text: string; channel: Channel; direction: "in" | "out"; by?: string };
  NoteAdded:          { text: string; by: string };
  CallLogged:         { callUuid: string; direction: "in" | "out"; durationSec: number; summary?: string };
  StatusChanged:      { status: Status; by: string };
  ConversationAssigned: { assignee: string | null; by: string };
}>;

type ConversationCommand = DefineCommands<{
  OpenConversation: { contactName: string; contactPhone: string; channel: Channel; language: string };
  AddMessage:  { text: string; channel: Channel; direction: "in" | "out"; by?: string };
  AddNote:     { text: string; by: string };
  LogCall:     { callUuid: string; direction: "in" | "out"; durationSec: number; summary?: string };
  ChangeStatus:{ status: Status; by: string };
  Assign:      { assignee: string | null; by: string };
}>;

type ConversationState = { opened: boolean; status: Status; assignee: string | null; callUuids: string[] };

type ConversationTypes = {
  state: ConversationState; events: ConversationEvent;
  commands: ConversationCommand; infrastructure: {};
};

export const Conversation = defineAggregate<ConversationTypes>({
  initialState: { opened: false, status: "open", assignee: null, callUuids: [] },
  decide: {
    // Idempotent open: an existing customer returns no new event.
    OpenConversation: (cmd, state) =>
      state.opened ? [] : { name: "ConversationOpened", payload: cmd.payload },
    AddMessage: (cmd, state) => {
      if (!state.opened) throw new Error("conversation not opened");
      if (!cmd.payload.text.trim()) throw new Error("empty message");
      return { name: "MessageAdded", payload: cmd.payload };
    },
    // Webhook retries: the same call is logged once.
    LogCall: (cmd, state) =>
      state.callUuids.includes(cmd.payload.callUuid) ? [] : { name: "CallLogged", payload: cmd.payload },
    // ...AddNote, ChangeStatus, Assign
  },
  evolve: {
    ConversationOpened: (_p, s) => ({ ...s, opened: true }),
    CallLogged: (p, s) => ({ ...s, callUuids: [...s.callUuids, p.callUuid] }),
    StatusChanged: (p, s) => ({ ...s, status: p.status }),
    ConversationAssigned: (p, s) => ({ ...s, assignee: p.assignee }),
    MessageAdded: (_p, s) => s,
    NoteAdded: (_p, s) => s,
  },
});
```

- `decide.X(command, state, infrastructure)` returns one event, an array, or `[]`.
- `evolve.X(payload, state)` — receives the **payload**, not the full event.
- Dispatch: `await domain.dispatchCommand({ name, targetAggregateId, payload })`
  (fully typed per command; `void` commands omit `payload`).

**Projection (read side)** — `on` handlers get the **full event** and the current view:

```ts
type ConversationListQuery = DefineQueries<{
  ListConversations: { payload: { status?: Status }; result: ConversationRow[] };
}>;
type ConversationListDef = {
  events: ConversationEvent; queries: ConversationListQuery; view: ConversationRow;
  infrastructure: {}; viewStore: ViewStore<ConversationRow>;
};
export const ConversationList = defineProjection<ConversationListDef>({
  on: {
    ConversationOpened: { id: (e) => e.metadata?.aggregateId /* or payload id */, reduce: (e) => ({ /* new row */ }) },
    MessageAdded:       { id: /* same */, reduce: (e, view) => ({ ...view, lastText: e.payload.text }) },
  },
  queryHandlers: { ListConversations: /* reads the view store */ },
  // consistency: "strong"  → view updated in the same transaction as the events
});
```

Check `docs/read-model/projections.mdx` + `view-persistence.mdx` for how the
view id is resolved and how a Drizzle-backed view store is built (the hotel
sample's `drizzle-view-store.ts` is the reference). `domain.rebuildProjection("Name")`
replays the log into a projection (halt writes while it runs).

**Domain + Postgres persistence:**

```ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { DrizzleAdapter } from "@noddde/drizzle";
import { everyNEvents } from "@noddde/core";

const conversations = defineDomain({
  writeModel: { aggregates: { Conversation } },
  readModel:  { projections: { ConversationList } },
});

const pool = new pg.Pool({ connectionString: tenantDatabaseUrl });
const domain = await wireDomain(conversations, {
  persistenceAdapter: new DrizzleAdapter(drizzle(pool)),   // dialect auto-detected
  aggregates: { Conversation: { persistence: "event-sourced", snapshots: { strategy: everyNEvents(100) } } },
});
```

Framework tables per tenant DB (from the hotel sample; schema exported by
`@noddde/drizzle/pg`): `noddde_events(id, aggregate_name, aggregate_id,
sequence_number, event_name, payload jsonb, metadata jsonb, created_at)` with a
unique `(aggregate_name, aggregate_id, sequence_number)`, plus
`noddde_aggregate_states`, `noddde_saga_states`, `noddde_snapshots`, `outbox`.
Create them with a migration applied **to every tenant database**.

## Database per tenant

```ts
// backend/src/tenancy.ts — one wired domain per tenant, built once, reused.
const domains = new Map<string, Promise<Domain>>();

export function domainFor(tenantId: string) {
  let d = domains.get(tenantId);
  if (!d) {
    d = wireTenant(tenantId).catch((e) => { domains.delete(tenantId); throw e; });
    domains.set(tenantId, d);
  }
  return d;
}

async function wireTenant(tenantId: string) {
  const url = await tenantDatabaseUrl(tenantId);   // from the tenant registry, never from the request
  const pool = new pg.Pool({ connectionString: url, max: 5 });
  return wireDomain(conversations, { persistenceAdapter: new DrizzleAdapter(drizzle(pool)), /* ... */ });
}
```

- A small **tenant registry** (control-plane DB or config) maps tenant id → database
  URL. Secrets come from env/secret store, never from the client.
- Onboarding a tenant = create its database, run the migration, register it.
- Keep `max` pool size low per tenant; many tenants × big pools exhausts Postgres.
- Request flow: verify JWT → read tenant claim → `domainFor(tenant)` →
  `dispatchCommand` / `dispatchQuery`. A missing/unknown tenant is a 403, not a fallback.
- **Call information comes only from the va-crystal cable** (no webhooks), and is
  saved only as commands. One cable subscription per tenant: the cable JWT's
  `account_uuid` names the tenant, so every frame goes to that tenant's domain.
  Reuse `api/cable.ts` (`createCableClient`, `normalizeCableEvent`) for the wire
  protocol.
- Mapping: `call.completed` → `LogCall` (customer phone = `from` for inbound, `to`
  for outbound; `targetAggregateId` = `streamIdFor(customerKey({ phone }))`);
  `transcription.completed` → attach the summary to that call. Frames can repeat
  after a reconnect, so idempotency lives in `decide` (see `LogCall` above).
- Duration: the normalized cable payload has no duration field today — derive it
  from the `call.answered` → `call.completed` timestamps, or confirm a metadata
  field in `../va-crystal` before relying on one.

## Testing

```ts
import { testAggregate, testDomain } from "@noddde/testing";

const r = await testAggregate(Conversation)
  .given({ name: "ConversationOpened", payload: { /* ... */ } })
  .when({ name: "LogCall", targetAggregateId: "c-1", payload: { callUuid: "u1", direction: "in", durationSec: 30 } })
  .execute();
expect(r.events.map((e) => e.name)).toEqual(["CallLogged"]);

const { domain, spy } = await testDomain({ aggregates: { Conversation }, projections: { ConversationList } });
await domain.dispatchCommand({ name: "OpenConversation", targetAggregateId: "c-1", payload: { /* ... */ } });
expect(spy.publishedEvents[0].name).toBe("ConversationOpened");
```

Rejections: a throwing `decide` is captured by `testAggregate` and rethrown by
`testDomain` (also recorded in `spy.commandErrors`).

## Runtime notes

- noddde documents **Node.js ≥ 18, TypeScript ≥ 5.3 strict** (`module`/
  `moduleResolution: Node16`). Deno is not documented — run the backend as a
  Node service; do not assume it works under Deno without testing.
- The existing browser code in `src/components/Conversations/conversationCommands.js`
  writes straight to Supabase. That is the **interim** write path; when the noddde
  backend lands, those functions become HTTP calls to it and the browser loses
  insert rights on events.

## Before saying a change is done

1. `testAggregate` for each new/changed command (happy path + rejection + idempotency).
2. `testDomain` for each projection change, asserting the view.
3. Migration applied to a fresh tenant DB from scratch.
4. No query or code path that reads another tenant's database.
