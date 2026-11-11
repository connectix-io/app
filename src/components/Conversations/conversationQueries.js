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
  const term = search.trim();
  if (term) q = q.or(`contact_name.ilike.%${term}%,contact_phone.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

/** The ordered event stream of one conversation (the thread). */
export async function getThread(conversationId) {
  const { data, error } = await supabase
    .from('events')
    .select('id, type, data, actor_id, created_at')
    .eq('stream_id', conversationId)
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
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
