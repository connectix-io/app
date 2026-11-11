import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, Alert, Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { openConversation, CHANNELS } from './conversationCommands';

const LANGUAGES = ['he', 'en', 'ar', 'ru'];
const EMPTY = { contactName: '', contactPhone: '', channel: 'phone', language: 'he' };

// Start a conversation: one `conversation.opened` event.
export default function NewConversationDialog({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const id = await openConversation(form);
      setForm(EMPTY);
      onCreated(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit} data-testid="new-conversation-form">
        <DialogTitle>{t('conversations.new')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label={t('conversations.col.contact')} value={form.contactName} onChange={set('contactName')} required autoFocus />
            <TextField label={t('conversations.phone')} value={form.contactPhone} onChange={set('contactPhone')} inputProps={{ dir: 'ltr' }} />
            <TextField select label={t('conversations.col.channel')} value={form.channel} onChange={set('channel')}>
              {CHANNELS.map((ch) => <MenuItem key={ch} value={ch}>{t(`conversations.channel.${ch}`)}</MenuItem>)}
            </TextField>
            <TextField select label={t('conversations.language')} value={form.language} onChange={set('language')}>
              {LANGUAGES.map((l) => <MenuItem key={l} value={l}>{t(`conversations.lang.${l}`)}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('conversations.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={busy}>{t('conversations.create')}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
