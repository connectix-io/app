// One customer = one conversation stream (Chatwoot-style grouping).
//
// The stream id is DERIVED from the customer's normalized phone (or email), so
// a call, an SMS and a message from the same person land in the same thread
// with no lookup table and no race. Keep in sync with api/customer_key.ts.

/** Normalize a phone to digits in international form (Israeli 0-prefix → 972). */
function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `972${d.slice(1)}`;
  return d;
}

/** The customer's identity key: `phone:<digits>`, else `email:<lower>`, else null. */
export function customerKey({ phone, email } = {}) {
  const p = normalizePhone(phone);
  if (p.length >= 6) return `phone:${p}`;
  const e = String(email || '').trim().toLowerCase();
  return e ? `email:${e}` : null;
}

/** Deterministic UUID (v5 layout, SHA-1) for a customer key. */
export async function streamIdFor(key) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-1', new TextEncoder().encode(`voipappz:customer:${key}`)),
  ).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
