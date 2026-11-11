// One customer = one conversation stream. Deno twin of
// src/components/Conversations/customerKey.js — keep the two in sync, or the
// same caller ends up in two threads.

export function normalizePhone(raw: unknown): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `972${d.slice(1)}`;
  return d;
}

export function customerKey({ phone, email }: { phone?: unknown; email?: unknown } = {}): string | null {
  const p = normalizePhone(phone);
  if (p.length >= 6) return `phone:${p}`;
  const e = String(email ?? "").trim().toLowerCase();
  return e ? `email:${e}` : null;
}

export async function streamIdFor(key: string): Promise<string> {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-1", new TextEncoder().encode(`voipappz:customer:${key}`)),
  ).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
