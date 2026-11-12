import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, IconButton, TextField, ToggleButton, ToggleButtonGroup, Alert, MenuItem, Avatar, InputBase,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import { Tooltip, ListItemIcon } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { addMessage, addNote, changeStatus, assign, STATUSES } from './conversationCommands';
import { channelIcon, formatWhen, formatDuration, fadeUp, PANE_HEADER, shortName, STATUS_ICON } from './conversationFormat';

const SYSTEM = new Set(['status.changed', 'conversation.assigned']);

// A run of back-to-back status/assignment changes shows as one quiet line (the
// latest); the full trail stays in the event store and in the line's tooltip.
function collapse(events) {
  const out = [];
  for (const e of events) {
    const prev = out[out.length - 1];
    if (prev && SYSTEM.has(e.type) && SYSTEM.has(prev.event.type)) {
      prev.trail.push(prev.event);
      prev.event = e;
    } else {
      out.push({ event: e, trail: [] });
    }
  }
  return out;
}

// One conversation: its event stream, plus what an agent can do (reply, note,
// status, assign).
export default function ConversationThread({ conversation, events, actions = null, search = null, onBack = null }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const me = user?.email;
  const [mode, setMode] = useState('message');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const bottom = useRef(null);

  // Keep the newest event in view.
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [events.length, conversation.id]);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const send = () => run(async () => {
    if (mode === 'note') await addNote(conversation.id, { text });
    else await addMessage(conversation.id, { text, channel: conversation.channel, direction: 'out' });
    setText('');
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }} data-testid="conversation-thread">
      <Box sx={{ ...PANE_HEADER, gap: 1.5 }}>
        {onBack && (
          <IconButton onClick={onBack} aria-label={t('conversations.close')} edge="start">
            <ArrowBackIcon sx={{ transform: (theme) => (theme.direction === 'rtl' ? 'scaleX(-1)' : 'none') }} />
          </IconButton>
        )}
        <Avatar variant="rounded" sx={{ width: 44, height: 44, bgcolor: 'primary.main' }}>
          {(conversation.contact_name || '?').trim().charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: '0 1 auto', maxWidth: 200 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600 }} noWrap>{conversation.contact_name}</Typography>
          <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: 'start' }} noWrap>
            {channelIcon(conversation.channel)} {conversation.contact_phone}
          </Typography>
        </Box>
        {/* The main search lives on this line, next to the phone: no extra top bar. */}
        <Box sx={{ flex: '1 1 260px', minWidth: 180, display: 'flex', justifyContent: 'center' }}>{search}</Box>
        {conversation.assignee === me ? (
          <Tooltip title={t('conversations.assignedToYou')}>
            <HowToRegOutlinedIcon color="primary" sx={{ flexShrink: 0 }} aria-label={t('conversations.assignedToYou')} />
          </Tooltip>
        ) : (
          <Tooltip title={conversation.assignee
            ? t('conversations.takeOver', { who: shortName(conversation.assignee) })
            : t('conversations.assignToMe')}>
            <span>
              <IconButton disabled={busy} onClick={() => run(() => assign(conversation.id, me))} data-testid="assign-me"
                aria-label={t('conversations.assignToMe')}>
                <PersonAddAltOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <TextField
          select size="small" value={conversation.status} disabled={busy}
          sx={{ flexShrink: 0, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'background.paper' } }}
          SelectProps={{ renderValue: (v) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>{STATUS_ICON[v]}{t(`conversations.status.${v}`)}</Box>
          ) }}
          onChange={(e) => run(() => changeStatus(conversation.id, e.target.value))}
          inputProps={{ 'aria-label': t('conversations.col.status') }}
          data-testid="thread-status"
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ gap: 1 }}>
              <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>{STATUS_ICON[s]}</ListItemIcon>
              {t(`conversations.status.${s}`)}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flexShrink: 0 }}>{actions}</Box>
      </Box>

      <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'background.default' }}>
        {collapse(events).map(({ event, trail }) => (
          <ThreadItem key={event.id} event={event} trail={trail} me={me} t={t} lang={i18n.language} />
        ))}
        <div ref={bottom} />
      </Box>

      {/* One-row composer: Enter sends, Shift+Enter is a new line. */}
      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)}>
            <ToggleButton value="message" aria-label={t('conversations.reply')}>
              <Tooltip title={t('conversations.reply')}><ChatBubbleOutlineIcon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="note" aria-label={t('conversations.note')}>
              <Tooltip title={t('conversations.note')}><StickyNote2OutlinedIcon fontSize="small" /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <InputBase
            fullWidth multiline maxRows={5} value={text} onChange={(e) => setText(e.target.value)}
            sx={{ px: 2, py: 1, borderRadius: 1.5, bgcolor: mode === 'note' ? (th) => alpha(th.palette.warning.main, 0.18) : 'action.hover', fontSize: 15 }}
            inputProps={{ dir: 'auto' }}
            placeholder={mode === 'note' ? t('conversations.notePlaceholder') : t('conversations.replyPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim() && !busy) send(); }
            }}
            data-testid="thread-input"
          />
          <IconButton disabled={busy || !text.trim()} onClick={send} data-testid="thread-send"
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' }, borderRadius: 1.5, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}
            aria-label={mode === 'note' ? t('conversations.saveNote') : t('conversations.send')}>
            <SendIcon sx={{ transform: (theme) => (theme.direction === 'rtl' ? 'scaleX(-1)' : 'none') }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

function systemText(event, t) {
  const { type, data } = event;
  if (type === 'conversation.opened') return t('conversations.ev.opened');
  if (type === 'status.changed') return t('conversations.ev.status', { status: t(`conversations.status.${data.status}`) });
  return data.assignee ? t('conversations.ev.assigned', { who: shortName(data.assignee) }) : t('conversations.ev.unassigned');
}

function ThreadItem({ event, trail, me, t, lang }) {
  const { type, data, created_at: at } = event;
  const time = formatWhen(at, lang);

  // System facts: one quiet centered line; who/when and earlier changes on hover.
  if (type === 'conversation.opened' || SYSTEM.has(type)) {
    const title = [...trail, event]
      .map((e) => `${systemText(e, t)} — ${shortName(e.data.by) || '?'}, ${formatWhen(e.created_at, lang)}`)
      .join('\n');
    return (
      <Typography variant="caption" color="text.secondary" align="center" title={title} sx={{ py: 0.5 }}>
        {systemText(event, t)} {time}
      </Typography>
    );
  }

  // Bubbles: ours tinted with the brand color, the customer's white, notes yellow.
  const note = type === 'note.added';
  const out = note || data.direction === 'out';
  // Mode-aware tints so the bubbles read in light and dark.
  const bg = note ? (th) => alpha(th.palette.warning.main, 0.18)
    : out ? (th) => alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.35 : 0.10)
    : 'background.paper';
  const author = data.by && data.by !== me ? shortName(data.by) : null;
  const body = type === 'call.logged'
    ? `📞 ${t(`conversations.ev.call_${data.direction === 'in' ? 'in' : 'out'}`)} ${formatDuration(data.duration_sec)}${data.summary ? `\n${data.summary}` : ''}`
    : data.text;

  return (
    <Box sx={{
      alignSelf: out ? 'flex-end' : 'flex-start', maxWidth: '70%', bgcolor: bg,
      borderRadius: 1.5, px: 1.75, py: 1, border: 1, borderColor: 'divider', ...fadeUp,
    }}>
      {(note || author) && (
        <Typography variant="caption" fontWeight={600} display="block" color="text.secondary">
          {note ? t('conversations.note') : author}{note && author ? ` (${author})` : ''}
        </Typography>
      )}
      <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>{body}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ textAlign: 'end', mt: 0.25 }}>{time}</Typography>
    </Box>
  );
}
