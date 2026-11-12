import { Avatar, Box, Divider, Tooltip, Typography } from '@mui/material';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import { useTranslation } from 'react-i18next';
import { channelIcon, formatWhen, formatDuration, PANE_HEADER, shortName } from './conversationFormat';

// Interactions = contact with the customer. Status / assignment changes live in the chat.
const HISTORY = {
  'message.added': <ChatBubbleOutlineIcon fontSize="small" />,
  'note.added': <StickyNote2OutlinedIcon fontSize="small" />,
  'call.logged': <CallOutlinedIcon fontSize="small" />,
};

// The customer, as Zendesk shows it beside a ticket — but read straight from
// this customer's event stream: who they are, totals, and every interaction.
export default function CustomerPanel({ conversation, events, embedded = false }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const opened = events.find((e) => e.type === 'conversation.opened')?.data || {};
  const calls = events.filter((e) => e.type === 'call.logged');
  const talk = calls.reduce((sum, e) => sum + (Number(e.data.duration_sec) || 0), 0);
  const interactions = events.filter((e) => HISTORY[e.type]).reverse();
  const name = conversation.contact_name || conversation.contact_phone || '?';

  // Icon + value; the label is the tooltip (and the screen-reader name).
  const row = (icon, label, value, ltr) => value ? (
    <Box sx={{ display: 'flex', gap: 1.5, py: 0.75, alignItems: 'center' }}>
      <Tooltip title={label}><Box aria-label={label} sx={{ display: 'flex', color: 'text.secondary' }}>{icon}</Box></Tooltip>
      <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere' }} dir={ltr ? 'ltr' : undefined}>{value}</Typography>
    </Box>
  ) : null;

  const stat = (icon, value, label) => (
    <Box sx={{ flex: 1, textAlign: 'center', py: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'center' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={600}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );

  return (
    <Box sx={embedded ? {} : { width: 320, flexShrink: 0, borderInlineStart: 1, borderColor: 'divider', overflowY: 'auto' }}
      data-testid="customer-panel">
      {!embedded && (
        <Box sx={PANE_HEADER}>
          <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{t('conversations.customer')}</Typography>
        </Box>
      )}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar variant="rounded" sx={{ width: 52, height: 52, fontSize: 22, bgcolor: 'primary.main' }}>{name.charAt(0).toUpperCase()}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={600} noWrap>{name}</Typography>
          <Typography color="text.secondary">{channelIcon(conversation.channel)} {t(`conversations.channel.${conversation.channel}`, conversation.channel)}</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2.5 }}>
        {row(<PhoneOutlinedIcon fontSize="small" />, t('conversations.phone'), conversation.contact_phone, true)}
        {row(<EmailOutlinedIcon fontSize="small" />, t('conversations.email'), opened.contact_email, true)}
        {row(<TranslateIcon fontSize="small" />, t('conversations.language'), opened.language && t(`conversations.lang.${opened.language}`, opened.language))}
        {row(<PersonOutlineIcon fontSize="small" />, t('conversations.col.assignee'), conversation.assignee ? shortName(conversation.assignee) : t('conversations.unassigned'))}
        {row(<EventOutlinedIcon fontSize="small" />, t('conversations.since'), formatWhen(conversation.created_at, lang))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, px: 2.5, py: 2 }}>
        {stat(<ChatBubbleOutlineIcon fontSize="small" />, conversation.message_count - calls.length, t('conversations.messages'))}
        {stat(<CallOutlinedIcon fontSize="small" />, calls.length, t('conversations.calls'))}
        {stat(<TimerOutlinedIcon fontSize="small" />, formatDuration(talk), t('conversations.talkTime'))}
      </Box>

      <Divider />
      <Typography fontWeight={600} sx={{ px: 2.5, pt: 2, pb: 1 }}>{t('conversations.history')}</Typography>
      <Box sx={{ px: 2.5, pb: 2 }}>
        {interactions.length === 0 && (
          <Typography variant="body2" color="text.secondary">{t('conversations.noInteractions')}</Typography>
        )}
        {interactions.map((e) => (
          <Box key={e.id} sx={{ display: 'flex', gap: 1.5, py: 0.75, alignItems: 'baseline' }}>
            <Box component="span" aria-hidden sx={{ display: 'flex', color: 'text.secondary', alignSelf: 'flex-start', pt: 0.25 }}>{HISTORY[e.type]}</Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body2" noWrap>
                {e.data.text || e.data.summary || t(`conversations.kind.${e.type}`, e.type)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {e.data.by ? `${shortName(e.data.by)}, ` : ''}{formatWhen(e.created_at, lang)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
