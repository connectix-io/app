# VoIPAppz conversations

A **conversation-first** customer communication app: one thread per customer with
all their calls, messages and notes, in Hebrew and English. Built on **CQRS + event
sourcing**. Call information arrives live over the **va-crystal cable** and is saved
through CQRS; actions (calls, SMS) go to **voipappz-api**; auth is **Supabase**.

- **How it fits together** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Building the conversation backend** → [`.claude/skills/cqrs-noddde/SKILL.md`](./.claude/skills/cqrs-noddde/SKILL.md)
- **Feature recipe (service → hook → component)** → [DEVELOPING.md](./DEVELOPING.md)
- **Repo conventions / gotchas** → [CLAUDE.md](./CLAUDE.md)

---

## Quick start

```bash
cp .env.example .env     # set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev              # → http://localhost:4200
```

One-time database setup: `make setup` — applies the event store, locks
sign-ups, creates the first user and prints the env. See [SETUP.md](./SETUP.md).

After login you land on **Conversations** — the main screen.

## What's in the app

| Screen | Data |
|---|---|
| **Conversations** (main) | Supabase: `conversations` view + `events` (live via realtime) |
| Phone dock (right) | WebRTC softphone; SIP settings from voipappz-api |
| Calls, Reports, Dashboard | voipappz-api (needs a voipappz-api token — see Known gaps) |

## Configuration

All configuration is env (see [.env.example](./.env.example)). `VITE_*` values are
public — they are baked into the browser bundle. Server-only secrets (e.g.
`SUPABASE_SERVICE_ROLE_KEY`) must **never** be `VITE_`-prefixed and never committed.
Deploy hosts come from the environment (`KAMAL_HOST`), not from files in the repo.

## Make commands

| Command | Description |
|---|---|
| `make dev` | deno-api in Docker + host Vite with HMR |
| `make up` / `make down` | Start / stop the Docker stack |
| `make build` | Production build (`dist/`) |
| `make ci-list` | List the GitHub Actions jobs |
| `make ci-local` | Run CI locally with [act](https://github.com/nektos/act) (`JOB=check` for one job) |
| `make test` | Playwright E2E (needs the app running) |
| `make deploy` / `make ship` | Kamal deploy / push + deploy (`KAMAL_HOST` required) |

## CI / CD (GitHub Actions)

| Workflow | When | What |
|---|---|---|
| `ci.yml` | push to master/main, every PR | lint + build, vitest, deno tests, npm audit (report-only), Docker image build. Publishes `ghcr.io/<repo>:edge` on the default branch. |
| `release.yml` | tag `v*` | Builds and publishes `ghcr.io/<repo>:<version>` + a GitHub Release. |
| `dependabot.yml` | weekly / monthly | npm, actions, docker updates. |

Repository **variables** (not secrets): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Publishing uses the built-in `GITHUB_TOKEN` — no registry password to store.

Local runs: `make ci-local` copies `.vars.example` / `.secrets.example` to `.vars` /
`.secrets` (both gitignored) and runs the `pull_request` workflow in Docker. Local
runs never publish images.

## Project layout

```
src/components/Conversations/   main screen: commands (write), queries (read), UI
src/lib/clients/supabase.ts     Supabase auth client
migrations/                     event store SQL (apply per database)
api/                            deno-api: va-crystal cable client (calls → CQRS next)
.claude/skills/cqrs-noddde/     how the CQRS backend is built
.github/                        CI, release, dependabot, shared node-deps action
```

## Known gaps

- Calls / Reports / Dashboard still call voipappz-api with the session token; a
  Supabase token is rejected there (401 → logout). Use Conversations until the
  voipappz-api link is in place.
- Every signed-in user is `admin` and can read all conversations. Turn off public
  sign-ups in Supabase (Authentication → Sign In / Providers) until roles land.
- Writes go from the browser straight to Supabase (interim); the noddde backend
  and per-tenant databases are the target (see ARCHITECTURE.md).

## Testing

```bash
npm run test:run    # Vitest
npm run build       # must be clean before shipping
make ci-local       # full CI locally
```
