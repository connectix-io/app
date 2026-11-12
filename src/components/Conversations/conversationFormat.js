import { createElement } from 'react';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AllInboxOutlinedIcon from '@mui/icons-material/AllInboxOutlined';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
// Small display helpers shared by the conversations screen.

// Channel icons from the same family as the rest of the UI (no emoji).
const CHANNEL_ICON = {
  phone: PhoneOutlinedIcon, whatsapp: WhatsAppIcon, sms: SmsOutlinedIcon, email: EmailOutlinedIcon, chat: ChatBubbleOutlineIcon,
};

export const channelIcon = (channel) => createElement(CHANNEL_ICON[channel] || ChatBubbleOutlineIcon, {
  sx: { fontSize: 16, verticalAlign: '-3px' }, 'aria-hidden': true,
});


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

// Gentle entrance for rows and bubbles.
export const fadeUp = {
  '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
  animation: 'fadeUp 220ms ease-out both',
};

// Every pane (list, chat, customer) starts with the same header box, so the
// three columns line up.
export const PANE_HEADER = {
  height: 72, flexShrink: 0, px: 2.5, display: 'flex', alignItems: 'center',
  borderBottom: 1, borderColor: 'divider',
  bgcolor: (t) => (t.palette.mode === 'dark' ? t.palette.background.default : t.palette.grey[100]),
};

// "dana@company.com" → "dana": people read names, not addresses.
export const shortName = (email) => (email ? String(email).split('@')[0] : '');

// One icon per status, used by the filters and the status menu.

export const STATUS_ICON = {
  all: createElement(AllInboxOutlinedIcon, { fontSize: 'small' }),
  open: createElement(MarkChatUnreadOutlinedIcon, { fontSize: 'small' }),
  pending: createElement(ScheduleOutlinedIcon, { fontSize: 'small' }),
  resolved: createElement(TaskAltOutlinedIcon, { fontSize: 'small' }),
};

// Every pane is a card like the phone: thin border, soft corners, a little gap.
export const CARD = {
  m: 1, height: 'calc(100% - 16px)', border: 1, borderColor: 'divider', borderRadius: 2,
  overflow: 'hidden', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column',
};
