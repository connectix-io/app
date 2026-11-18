// The template's server: Hono on Node, one container (deployed with Kamal).
//
//   GET  /health         liveness for kamal-proxy (local: an API outage never fails it)
//   /api/*, /auth/*      passed through to voipappz-api (the mothership); the browser
//                        only ever talks to this origin, so there is no CORS
//   /assets/*            the build's hashed files; a missing one is a real 404
//   everything else      the React app: index.html for client routes
//
// Add an app's own server routes here (webhooks, tokens, anything needing a secret);
// never put a secret in the React bundle. Hono runs on Bun, Deno, Cloudflare or
// Lambda too: only the last lines (the Node adapter) would change.
import { Hono } from 'hono';
import { proxy } from 'hono/proxy';
import { secureHeaders } from 'hono/secure-headers';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const VERSION = process.env.APP_VERSION || 'dev';
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 30_000);

// Headers that belong to one hop and must not be forwarded.
const HOP = ['connection', 'keep-alive', 'proxy-connection', 'proxy-authorization', 'proxy-authenticate',
             'transfer-encoding', 'upgrade', 'host', 'te', 'trailer'];

// Production needs an explicit upstream: a customer deploy must never fall back to another API.
export function apiUrlFromEnv(env = process.env) {
  const url = (env.VOIPAPPZ_API_URL || '').replace(/\/+$/, '');
  if (url) return url;
  if (env.NODE_ENV === 'production') throw new Error('VOIPAPPZ_API_URL is required in production');
  return 'https://cloud.voipappz.io'; // development only
}

export function createApp({ apiUrl, staticDir = resolve(process.env.STATIC_DIR || 'dist'), fetchImpl, timeoutMs = UPSTREAM_TIMEOUT_MS } = {}) {
  const upstream = apiUrl || apiUrlFromEnv();
  const app = new Hono();
  let indexHtml = null; // read once, on first use

  app.use('*', secureHeaders({ crossOriginEmbedderPolicy: false, permissionsPolicy: { microphone: ['self'], camera: [] } }));

  app.get('/health', (c) => c.json({ status: 'ok', version: VERSION }));

  // voipappz-api, same paths. The caller's Authorization header goes through as is.
  const pass = async (c) => {
    const url = new URL(c.req.url);
    const headers = new Headers(c.req.raw.headers);
    // headers named in Connection are hop-by-hop too
    (headers.get('connection') || '').split(',').map((h) => h.trim()).filter(Boolean).forEach((h) => headers.delete(h));
    HOP.forEach((h) => headers.delete(h));
    const client = c.req.header('x-forwarded-for');
    const peer = c.env?.incoming?.socket?.remoteAddress;
    if (client || peer) headers.set('x-forwarded-for', [client, peer].filter(Boolean).join(', '));
    headers.set('x-forwarded-host', url.host);
    headers.set('x-forwarded-proto', c.req.header('x-forwarded-proto') || url.protocol.replace(':', ''));
    try {
      return await proxy(`${upstream}${url.pathname}${url.search}`, {
        raw: c.req.raw,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: 'manual', // the browser follows the API's redirects itself (keeps Set-Cookie, never replays a body)
        ...(fetchImpl ? { customFetch: fetchImpl } : {}),
      });
    } catch (e) {
      const timedOut = e?.name === 'TimeoutError' || e?.name === 'AbortError';
      console.error(`upstream ${timedOut ? 'timeout' : 'error'}: ${c.req.method} ${url.pathname} (${e?.name || 'Error'})`);
      return c.json({ error: timedOut ? 'upstream timeout' : 'upstream unavailable' }, timedOut ? 504 : 502);
    }
  };
  app.all('/api/*', pass);
  app.all('/auth/*', pass);

  // Hashed build assets: found = cached for a year; missing = 404 (never the page HTML,
  // which would then be cached as a script for a year).
  app.use('/assets/*', async (c, next) => {
    await next();
    if (c.res.status === 200) c.res.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  });
  app.use('/assets/*', serveStatic({ root: staticDir }));
  app.get('/assets/*', (c) => c.text('not found', 404));

  // No dotfiles (.env, .git, …) from the build folder, ever.
  app.use('*', async (c, next) => (/(^|\/)\.(?!well-known\/)/.test(new URL(c.req.url).pathname) ? c.text('not found', 404) : next()));

  // The page itself is never cached (it names the current hashed assets).
  const page = (c) => {
    if (indexHtml === null) {
      try { indexHtml = readFileSync(join(staticDir, 'index.html'), 'utf8'); } catch { return c.text('not built: run npm run build', 503); }
    }
    c.header('Cache-Control', 'no-cache');
    return c.html(indexHtml);
  };
  app.get('/', page);
  app.get('/index.html', page);

  // Other files at the root (favicon, brand images, manifest).
  app.use('*', serveStatic({ root: staticDir }));

  // Client routes get the app; a missing file with an extension is a real 404.
  app.get('*', (c) => {
    if (extname(new URL(c.req.url).pathname)) return c.text('not found', 404);
    return page(c);
  });

  return app;
}

// Started as a program (not imported by a test).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  const app = createApp();
  const server = serve({ fetch: app.fetch, port }, (info) => {
    console.log(`server: http://localhost:${info.port}  api → ${apiUrlFromEnv()}`);
  });
  // Kamal stops the old container with SIGTERM: finish open requests, then exit.
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
