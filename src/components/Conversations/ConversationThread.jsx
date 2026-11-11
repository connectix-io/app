import { useState } from 'react';
import {
  Box, Typography, IconButton, TextField, Button, ToggleButton, ToggleButtonGroup, Alert, Divider, Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { addMessage, addNote, changeStatus, assign, STATUSES } from './conversationCommands';
import { channelIcon, formatWhen, formatDuration } from './conversationFormat';

// One conversation: its event stream as a timeline, plus the commands an agent
// can run on it (reply, note, status, assign-to-me).
export default function ConversationThread({ conversation, events, onClose }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [mode, setMode] = useState('message');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} data-testid="conversation-thread">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">{conversation.contact_name}</Typography>
          <Typography variant="caption" color="text.secondary" dir="ltr">
            {channelIcon(conversation.channel)} {conversation.contact_phone}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label={t('conversations.close')}><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup
          size="small" exclusive value={conversation.status}
          onChange={(_, v) => v && run(() => changeStatus(conversation.id, v))}
        >
          {STATUSES.map((s) => <ToggleButton key={s} value={s}>{t(`conversations.status.${s}`)}</ToggleButton>)}
        </ToggleButtonGroup>
        {conversation.assignee !== user?.email && (
          <Button size="small" disabled={busy} onClick={() => run(() => assign(conversation.id, user?.email))}>
            {t('conversations.assignToMe')}
          </Button>
        )}
        {conversation.assignee && <Chip size="small" label={conversation.assignee} />}
      </Box>
      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {events.map((e) => <ThreadItem key={e.id} event={e} t={t} lang={i18n.language} />)}
      </Box>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)}>
          <ToggleButton value="message">{t('conversations.reply')}</ToggleButton>
          <ToggleButton value="note">{t('conversations.note')}</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          multiline minRows={2} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={mode === 'note' ? t('conversations.notePlaceholder') : t('conversations.replyPlaceholder')}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) send(); }}
          data-testid="thread-input"
        />
        <Button variant="contained" disabled={busy || !text.trim()} onClick={send} data-testid="thread-send">
          {mode === 'note' ? t('conversations.saveNote') : t('conversations.send')}
        </Button>
      </Box>
    </Box>
  );
}

function ThreadItem({ event, t, lang }) {
  const { type, data, created_at: at } = event;
  const when = formatWhen(at, lang);
  const line = (text) => (
    <Typography variant="caption" color="text.secondary" align="center">{text} · {when}</Typography>
  );

  if (type === 'conversation.opened') return line(t('conversations.ev.opened'));
  if (type === 'status.changed') return line(t('conversations.ev.status', { status: t(`conversations.status.${data.status}`) }));
  if (type === 'conversation.assigned') {
    return line(data.assignee ? t('conversations.ev.assigned', { who: data.assignee }) : t('conversations.ev.unassigned'));
  }

  const out = type === 'note.added' || data.direction === 'out';
  const bg = type === 'note.added' ? 'warning.light' : out ? 'primary.light' : 'grey.200';
  const body = type === 'call.logged'
    ? `📞 ${t(`conversations.ev.call_${data.direction === 'in' ? 'in' : 'out'}`)} · ${formatDuration(data.duration_sec)}${data.summary ? ` — ${data.summary}` : ''}`
    : data.text;

  return (
    <Box sx={{ alignSelf: out ? 'flex-end' : 'flex-start', maxWidth: '85%', bgcolor: bg, borderRadius: 2, px: 1.5, py: 1 }}>
      {type === 'note.added' && <Typography variant="caption" fontWeight={600}>{t('conversations.note')}</Typography>}
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{body}</Typography>
      <Typography variant="caption" color="text.secondary">{when}</Typography>
    </Box>
  );
}
