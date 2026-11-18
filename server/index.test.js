// The Hono server: health, the pass-through to voipappz-api, and the React app.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp, apiUrlFromEnv } from './index.js';

function built() {
  const dir = mkdtempSync(join(tmpdir(), 'tpl-'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><div id="root"></div>');
  writeFileSync(join(dir, 'favicon.ico'), 'ico');
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'assets', 'app-abc123.js'), 'console.log(1)');
  return dir;
}
const API = 'https://api.example.test';

describe('server', () => {
  it('answers /health without touching the API', async () => {
    const app = createApp({ apiUrl: API, staticDir: built(), fetchImpl: () => { throw new Error('must not be called'); } });
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('ok');
  });

  it('passes /api and /auth to voipappz-api with path, query, method, body and auth', async () => {
    const seen = [];
    const fetchImpl = async (req) => {
      seen.push({ url: req.url, method: req.method, auth: req.headers.get('authorization'), body: await req.text(),
                  fwdHost: req.headers.get('x-forwarded-host'), fwdProto: req.headers.get('x-forwarded-proto') });
      return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'content-type': 'application/json' } });
    };
    const app = createApp({ apiUrl: API, staticDir: built(), fetchImpl });
    const res = await app.request('http://tpl.example.test/api/devices?page=2', { method: 'POST', body: '{"a":1}', headers: { authorization: 'Bearer t', 'content-type': 'application/json' } });
    expect(res.status).toBe(201);
    expect(seen[0]).toMatchObject({ url: `${API}/api/devices?page=2`, method: 'POST', auth: 'Bearer t', body: '{"a":1}',
                                    fwdHost: 'tpl.example.test', fwdProto: 'http' });
    await app.request('/auth/user_login', { method: 'POST', body: '{}' });
    expect(seen[1].url).toBe(`${API}/auth/user_login`);
  });

  it('answers 504 when the API is too slow, 502 when it is down', async () => {
    const slow = (req) => new Promise((_, reject) => req.signal.addEventListener('abort', () => reject(req.signal.reason)));
    const tooSlow = await createApp({ apiUrl: API, staticDir: built(), fetchImpl: slow, timeoutMs: 20 }).request('/api/x');
    expect(tooSlow.status).toBe(504);
    const down = await createApp({ apiUrl: API, staticDir: built(), fetchImpl: () => Promise.reject(new TypeError('fetch failed')) }).request('/api/x');
    expect(down.status).toBe(502);
  });

  it('serves the built app, with index.html for client routes', async () => {
    const app = createApp({ apiUrl: API, staticDir: built() });
    const page = await app.request('/conversations');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('id="root"');
    expect(page.headers.get('cache-control')).toBe('no-cache');
    const asset = await app.request('/assets/app-abc123.js');
    expect(asset.status).toBe(200);
    expect(asset.headers.get('cache-control')).toContain('immutable');
    expect((await app.request('/favicon.ico')).status).toBe(200);
  });

  it('never answers a missing file with the page, and never caches that', async () => {
    const app = createApp({ apiUrl: API, staticDir: built() });
    const asset = await app.request('/assets/app-old999.js');
    expect(asset.status).toBe(404);
    expect(asset.headers.get('cache-control') || '').not.toContain('immutable');
    expect((await app.request('/logo.png')).status).toBe(404);
  });

  it('never caches the page, at / or /index.html', async () => {
    const app = createApp({ apiUrl: API, staticDir: built() });
    for (const p of ['/', '/index.html']) expect((await app.request(p)).headers.get('cache-control')).toBe('no-cache');
  });

  it('never serves dotfiles', async () => {
    const dir = built();
    writeFileSync(join(dir, '.env'), 'SECRET=1');
    const res = await createApp({ apiUrl: API, staticDir: dir }).request('/.env');
    expect(res.status).toBe(404);
  });

  it('passes API redirects back instead of following them, and drops hop-by-hop headers', async () => {
    let seen;
    const fetchImpl = async (req) => { seen = req; return new Response(null, { status: 302, headers: { location: '/login', 'set-cookie': 'a=1' } }); };
    const res = await createApp({ apiUrl: API, staticDir: built(), fetchImpl })
      .request('/api/x', { headers: { connection: 'x-hop', 'x-hop': 'secret', 'proxy-authorization': 'p' } });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/login');
    expect(seen.redirect).toBe('manual');
    expect(seen.headers.get('x-hop')).toBeNull();
    expect(seen.headers.get('proxy-authorization')).toBeNull();
  });

  it('says so when the app is not built', async () => {
    const res = await createApp({ apiUrl: API, staticDir: mkdtempSync(join(tmpdir(), 'empty-')) }).request('/anything');
    expect(res.status).toBe(503);
  });

  it('requires VOIPAPPZ_API_URL in production', () => {
    expect(() => apiUrlFromEnv({ NODE_ENV: 'production' })).toThrow(/VOIPAPPZ_API_URL/);
    expect(apiUrlFromEnv({ NODE_ENV: 'production', VOIPAPPZ_API_URL: 'https://x.test/' })).toBe('https://x.test');
  });
});
