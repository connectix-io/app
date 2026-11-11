// Supabase Auth client — the single login for the app (email + password).
//
// Env (VITE_* → baked into the browser bundle; the anon/publishable key is
// public by design, RLS is what protects data):
//   VITE_SUPABASE_URL       https://<project-ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY  publishable / anon key
//
// Supabase keeps its own refresh-capable session in localStorage. We mirror the
// current access token into the app's `auth` key (lib/auth.ts) on every change,
// so the rest of the app (ACL, bearer headers, reloads) reads one session shape.

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthSession } from '../auth';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const STORAGE_KEY = 'auth';

export const supabaseConfigured = Boolean(URL && KEY);

export const supabase: SupabaseClient = createClient(
  URL || 'http://localhost:0',
  KEY || 'missing-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);

/** Map a Supabase session to the app's AuthSession shape. */
export function toAuthSession(session: Session): AuthSession {
  return {
    access: session.access_token,
    email: session.user.email ?? '',
    user_uuid: session.user.id,
    name: (session.user.user_metadata?.name as string | undefined) ?? undefined,
    expires_at: session.expires_at,
  };
}

// Keep the app's `auth` key in step with Supabase's session (sign-in, token
// refresh, sign-out in another tab, expiry).
if (supabaseConfigured) {
  supabase.auth.onAuthStateChange((_event, session) => {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(toAuthSession(session)));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage unavailable — session stays in memory only */ }
  });
}
