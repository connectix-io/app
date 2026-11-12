// Conversations — READ side (CQRS queries).
//
// Reads only: the `conversations` view (one folded row per conversation) and
// a conversation's raw event stream for the thread. Never writes.

import { supabase } from '../../lib/clients/supabase';

/** Conversations, newest activity first. `status` 'all' (default) or one status. */
export async function listConversations({ status = 'all', search = '', limit = 100 } = {}) {
  let q = supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (status !== 'all') q = q.eq('status', status);
  // Characters that are filter syntax in PostgREST (or a LIKE wildcard) are dropped.
  const term = search.replace(/[,()%*\\]/g, ' ').trim();
  if (term) q = q.or(`contact_name.ilike.%${term}%,contact_phone.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data || [];
}

/** The ordered event stream of one conversation (the thread). */
export async function getThread(conversationId) {
  const { data, error } = await supabase
    .from('events')
    .select('id, type, data, actor_id, created_at')
    .eq('stream_id', conversationId)
    .order('id', { ascending: true });
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data || [];
}

/** Call `onChange` whenever any event is appended (Supabase realtime). Returns an unsubscribe fn. */
export function subscribeToEvents(onChange) {
  const channel = supabase
    .channel(`events-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => onChange(payload.new))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/**
 * The main search: customers by name / phone, and what was said (messages,
 * notes, call summaries), each message with its customer. Small, for the
 * search dropdown.
 */
export async function searchAll(search, limit = 5) {
  const term = search.replace(/[,()%*\\]/g, ' ').trim();
  if (!term) return { contacts: [], messages: [] };
  const [contacts, hits] = await Promise.all([
    listConversations({ search: term, limit }),
    supabase
      .from('events')
      .select('id, stream_id, type, data, created_at')
      .in('type', ['message.added', 'note.added', 'call.logged'])
      .or(`data->>text.ilike.%${term}%,data->>summary.ilike.%${term}%`)
      .order('id', { ascending: false })
      .limit(limit),
  ]);
  if (hits.error) throw Object.assign(new Error(hits.error.message), { code: hits.error.code });
  const ids = [...new Set((hits.data || []).map((e) => e.stream_id))];
  const owners = ids.length
    ? (await supabase.from('conversations').select('id, contact_name, contact_phone').in('id', ids)).data || []
    : [];
  const byId = Object.fromEntries(owners.map((o) => [o.id, o]));
  const messages = (hits.data || []).map((e) => ({ ...e, contact: byId[e.stream_id] || null }));
  return { contacts, messages };
}
