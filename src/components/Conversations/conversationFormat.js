// Small display helpers shared by the conversations screen.

const ICONS = { phone: '📞', whatsapp: '🟢', sms: '💬', email: '✉️', chat: '💭' };

export const channelIcon = (channel) => ICONS[channel] || '•';

export const statusColor = (status) =>
  ({ open: 'primary', pending: 'warning', resolved: 'success' }[status] || 'default');

export function formatWhen(iso, language = 'he') {
  if (!iso) return '';
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat(language, sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
}

export function formatDuration(sec) {
  const s = Math.max(0, Number(sec) || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
