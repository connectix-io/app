#!/usr/bin/env node
// One-command workspace setup on a customer's own Supabase project.
//
//   make setup                                  # migrations + lock sign-ups + print env
//   make setup ARGS="--admin-email a@b.co"      # also create the first user (asks for no
//                                                 password: reads ADMIN_PASSWORD from env)
//   make setup ARGS="--check"                   # report only, change nothing
//
// Needs SUPABASE_ACCESS_TOKEN (dashboard → Account → Access Tokens) in the env or .env.
// The project comes from --project <ref> or VITE_SUPABASE_URL. Every step is safe to
// re-run. Nothing is written to disk; secrets are never printed.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

try { process.loadEnvFile('.env'); } catch { /* no .env — use the real env */ }

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = opt('project') || (process.env.VITE_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
const check = flag('check');
const adminEmail = opt('admin-email');

const die = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };
if (!token) die('SUPABASE_ACCESS_TOKEN is not set (create one at https://supabase.com/dashboard/account/tokens).');
if (!ref) die('No project: pass --project <ref> or set VITE_SUPABASE_URL.');

const api = async (method, path, body) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) die(`${method} ${path} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
};
const sql = (query) => api('POST', '/database/query', { query });

console.log(`Workspace setup — project ${ref}${check ? ' (check only)' : ''}\n`);

// 1. Event store: apply every migration in order (each is idempotent).
const dir = 'migrations';
const files = readdirSync(dir).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();
if (!check) {
  for (const f of files) {
    await sql(readFileSync(join(dir, f), 'utf8'));
    console.log(`✓ migration ${f}`);
  }
}
const [state] = await sql(`select
  to_regclass('public.events') is not null as events,
  to_regclass('public.conversations') is not null as conversations,
  exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'events') as realtime`);
for (const [k, ok] of Object.entries(state)) console.log(`${ok ? '✓' : '✗'} ${k}`);

// 2. Sign-ups: every signed-in user is an admin today, so only invited users get in.
const auth = await api('GET', '/config/auth');
if (!check && !flag('keep-signups') && !auth.disable_signup) {
  await api('PATCH', '/config/auth', { disable_signup: true });
  console.log('✓ public sign-ups turned off');
} else {
  console.log(`${auth.disable_signup ? '✓ public sign-ups are off' : '! public sign-ups are ON (anyone can register)'}`);
}

// 3. Keys: the browser gets the publishable (or legacy anon) key; the secret key is used
//    here only, to create the first user, and is never printed.
const keys = await api('GET', '/api-keys?reveal=true');
const pub = keys.find((k) => k.type === 'publishable') || keys.find((k) => k.name === 'anon');
const secret = keys.find((k) => k.type === 'secret') || keys.find((k) => k.name === 'service_role');

// 4. First user (optional).
if (adminEmail && !check) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) die('Set ADMIN_PASSWORD in the env to create the first user.');
  const res = await fetch(`https://${ref}.supabase.co/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: secret.api_key, Authorization: `Bearer ${secret.api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password, email_confirm: true }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) console.log(`✓ user ${adminEmail} created (confirmed)`);
  else if (/already/i.test(body.msg || body.message || '')) console.log(`✓ user ${adminEmail} already exists`);
  else die(`create user → HTTP ${res.status}: ${body.msg || body.message || ''}`);
}

console.log(`\nBrowser env (public — put these in .env, or as GitHub repository variables):
VITE_SUPABASE_URL=https://${ref}.supabase.co
VITE_SUPABASE_ANON_KEY=${pub?.api_key ?? '<not found>'}`);

if (!Object.values(state).every(Boolean)) process.exit(1);
