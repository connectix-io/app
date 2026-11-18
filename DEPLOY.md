# Deploying to a new server

Kamal builds the image, pushes it to a registry, and runs it on the server behind
kamal-proxy (zero-downtime swaps, health checks, rollbacks). One file per customer:
`config/deploy.<customer>.yml` on top of `config/deploy.yml`.

## What you need

| | |
|---|---|
| A server | Fresh Linux (Ubuntu 22.04+), reachable over SSH with a key, as root or a sudo user. Kamal installs Docker itself. |
| Ports | 80 and 443 open (and the SSH port). |
| A domain | An A record pointing at the server (e.g. `app.customer.com`). |
| A registry | Where images are pushed (Docker Hub `nirlevi` by default; change `image`/`registry` in `config/deploy.yml` for GHCR). A token with push rights. |
| voipappz-api | The API URL this customer uses. The server passes `/api/*` and `/auth/*` to it. |
| Supabase | The customer's project URL and publishable (anon) key, for sign-in. See [SETUP.md](./SETUP.md). |
| On your machine | Docker, Ruby + `gem install kamal` (2.x), this repo. |

## First deploy

```bash
cp config/deploy.example.yml config/deploy.acme.yml   # domain, VOIPAPPZ_API_URL, SSH user/port
cp .kamal/secrets.example .kamal/secrets              # registry token, KAMAL_HOST, VITE_SUPABASE_*
ssh -p 22 root@<server> true                          # the key works
make setup-server DEST=acme                           # installs Docker + kamal-proxy, builds, deploys
curl https://app.acme.com/health                      # {"status":"ok",...}
```

- **SSH:** `config/deploy.yml` assumes root on port 2228 with `~/.ssh/kamal_deploy`. A new server is
  usually port 22 with your own key: uncomment `ssh:` in your destination file.
- **HTTPS:** uncomment `ssl: true` under `proxy:` once DNS points at the server; kamal-proxy gets a
  Let's Encrypt certificate by itself.
- **Branding** (optional, build time): `VITE_APP_NAME`, `VITE_BRAND_LOGO`, `VITE_BRAND_LOGO_WHITE`,
  `VITE_PRIMARY_COLOR` — add them to `builder.args` and `.kamal/secrets`.

## Every release

```bash
make check                      # lint, tests, build
make deploy DEST=acme           # build, push, swap with zero downtime
```

The `pre-build` hook runs the server tests and stops a broken deploy. Set
`KAMAL_HEALTHCHECK_URL=https://app.acme.com` and the `post-deploy` hook checks `/health` and `/`.

## Day to day

| Command | What |
|---|---|
| `make logs DEST=acme` | Follow the app's logs |
| `make rollback DEST=acme VERSION=<sha>` | Back to an earlier release (the last 5 are kept) |
| `make maintenance DEST=acme` / `make live DEST=acme` | A maintenance page instead of the app, and back |
| `kamal app details -d acme` | What is running |
| `kamal shell -d acme` | A shell in the running container |

## How it behaves

- kamal-proxy sends traffic only once `/health` answers 200 (it never calls the API).
- Old containers get 30 s to finish open requests (`drain_timeout`); the server shuts down cleanly on SIGTERM.
- The previous release's assets stay available during a swap (`asset_path`), so open tabs don't break.
- Several hosts are replaced one at a time (`boot.limit: 1`). Logs rotate at 10 MB × 3.
- Requests to voipappz-api time out after 30 s (504); kamal-proxy waits 35 s.

## When something goes wrong

| Symptom | Look at |
|---|---|
| `KAMAL_HOST unset` | `.kamal/secrets` has `KAMAL_HOST=`; run through `make`, which loads it. |
| Deploy stops at "waiting for healthy" | `make logs DEST=…`; in production the server refuses to start without `VOIPAPPZ_API_URL`. |
| Sign-in page says Supabase isn't configured | `VITE_SUPABASE_*` are baked at build time: set them in `.kamal/secrets` and deploy again. |
| `/api/...` answers 502/504 | The server can't reach `VOIPAPPZ_API_URL` from the host: `kamal app exec -d … 'node -e "fetch(process.env.VOIPAPPZ_API_URL).then(r=>console.log(r.status))"'`. |
| Certificate not issued | DNS must point at the server and port 80 be open before `ssl: true`. |
