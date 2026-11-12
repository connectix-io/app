# Setting up a workspace

A customer runs the app on **their own Supabase project**. Setup is one command.

## 1. Create the project and a token

1. Create a project at https://supabase.com/dashboard (any region).
2. Create an access token: **Account → Access Tokens** (https://supabase.com/dashboard/account/tokens).
3. Put both in `.env` (gitignored, never commit it):

   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ACCESS_TOKEN=sbp_...
   ```

## 2. Run setup

```bash
make setup ARGS="--check"                          # see what is missing, change nothing
ADMIN_PASSWORD='…' make setup ARGS="--admin-email you@company.com"
```

`make setup` (`scripts/setup-supabase.mjs`) does, safely re-runnable:

| Step | What |
|---|---|
| Event store | Applies every `migrations/NNN_*.sql`: the append-only `events` table, the `conversations` view, live updates. |
| Sign-ups | Turns public sign-ups **off** (every signed-in user is an admin today). `--keep-signups` skips this. |
| First user | With `--admin-email` and `ADMIN_PASSWORD`: creates a confirmed user. |
| Browser env | Prints `VITE_SUPABASE_URL` and the publishable key for `.env` / GitHub repository variables. |

The secret key is used only inside the script and is never printed. When finished,
you can delete the access token in the dashboard.

## 3. Start

```bash
npm install && npm run dev      # → http://localhost:4200, log in with the user from step 2
```

If the app says **"This workspace is not set up yet"**, the database has no event
store: run `make setup`, then reload.

## Later

- An in-app first-run wizard that runs these steps for the customer (needs a server
  endpoint to hold the token; the browser never sees it).
- One database per tenant (see ARCHITECTURE.md): setup becomes "create tenant
  database → migrate → register", run by onboarding instead of by hand.
