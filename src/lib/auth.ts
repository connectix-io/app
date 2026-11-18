import { supabase } from './clients/supabase';
// The signed-in session. Sign-in is Supabase (components/Login): its session is mapped
// to this shape (lib/clients/supabase.ts → toAuthSession) and kept in localStorage so the
// route gate and the ACL read one thing. Logout clears it and ends the Supabase session.

const STORAGE_KEY = 'auth';

export interface AuthSession {
  access: string;             // the Supabase access token
  email: string;
  user_uuid: string;
  environment_uuid?: string;
  expires_at?: number;        // epoch seconds; absent → no client-side expiry
  name?: string;
  refresh?: string;           // the Supabase refresh token
  user?: any;                 // the Supabase user object
}

/** The persisted session, or null if absent / expired. */
export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    if (!s?.access) return null;
    if (s.expires_at && s.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

/** Persist a session (built from the Supabase session at sign-in). */
export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  // End the Supabase session too (fire-and-forget; local state is already cleared).
  void supabase.auth.signOut().catch(() => { /* offline / not configured */ });
}

// The app/ACL user for a session. Users carry no app role yet, so everyone gets the
// wildcard `admin` template (src/config/permissions.js) until per-user roles exist.
export function sessionUser(s: AuthSession | null) {
  if (!s) return null;
  const u = s.user || {};
  return {
    id: s.user_uuid || u.id,
    email: s.email || u.email,
    name: s.name || u.user_metadata?.name,
    user_uuid: s.user_uuid,
    environment_uuid: s.environment_uuid,
    role: u.app_role || 'admin',
    raw: u,
  };
}
