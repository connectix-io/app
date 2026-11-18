// Conversations — WRITE side (CQRS commands).
//
// Each command validates its input and appends exactly one event to the
// append-only `events` table (migrations/001_conversations_event_store.sql).
// Commands never read views and never update rows; the read side
// (conversationQueries.js) folds the events into what the screen shows.

import { supabase } from '../../lib/clients/supabase';
import { customerKey, streamIdFor } from './customerKey';

export const CHANNELS = Object.freeze(['phone', 'whatsapp', 'sms', 'email', 'chat']);
export const STATUSES = Object.freeze(['open', 'pending', 'resolved']);

// Every event says who did it (`by`, readable) next to `actor_id` (the user id the
// database stamps). The thread is the event stream, so it reads as a full history.
async function append(streamId, type, data) {
  const { data: auth } = await supabase.auth.getSession();
  const by = auth?.session?.user?.email || '';
  const { error } = await supabase.from('events').insert({ stream_id: streamId, type, data: { ...data, by } });
  if (error) throw new Error(error.message);
}

function required(value, name) {
  const v = typeof value === 'string' ? value.trim() : value;
  if (!v) throw new Error(`${name} is required`);
  return v;
}

/**
 * Open (or reopen) the customer's conversation. One customer = one stream, so a
 * phone that already has a conversation returns the existing id instead of
 * creating a second thread.
 */
export async function openConversation({ contactName, contactPhone, contactEmail, channel, language }) {
  const name = required(contactName, 'Contact name');
  const key = customerKey({ phone: contactPhone, email: contactEmail }) || `name:${name.toLowerCase()}`;
  const id = await streamIdFor(key);

  // Load-the-stream check (idempotent open): skip if this customer already exists.
  const { data: existing, error } = await supabase
    .from('events').select('id').eq('stream_id', id).eq('type', 'conversation.opened').limit(1);
  if (error) throw new Error(error.message);
  if (existing?.length) return id;

  await append(id, 'conversation.opened', {
    contact_name: name,
    contact_phone: (contactPhone || '').trim(),
    contact_email: (contactEmail || '').trim(),
    contact_key: key,
    channel: CHANNELS.includes(channel) ? channel : 'phone',
    language: language || 'he',
  });
  return id;
}

export function addMessage(conversationId, { text, channel, direction = 'out' }) {
  return append(conversationId, 'message.added', {
    text: required(text, 'Message'),
    channel: CHANNELS.includes(channel) ? channel : 'phone',
    direction: direction === 'in' ? 'in' : 'out',
  });
}

export function addNote(conversationId, { text }) {
  return append(conversationId, 'note.added', { text: required(text, 'Note') });
}

// A phone call on the conversation (shown in the thread and the customer panel).
export function logCall(conversationId, { direction = 'out', durationSec = 0, summary = '', callUuid = '' }) {
  return append(conversationId, 'call.logged', {
    direction: direction === 'in' ? 'in' : 'out',
    duration_sec: Math.max(0, Number(durationSec) || 0),
    summary: summary.trim(),
    call_uuid: callUuid,
  });
}

export function changeStatus(conversationId, status) {
  if (!STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`);
  return append(conversationId, 'status.changed', { status });
}

/** Assign to a user (email); empty string unassigns. */
export function assign(conversationId, assignee) {
  return append(conversationId, 'conversation.assigned', { assignee: (assignee || '').trim() });
}
