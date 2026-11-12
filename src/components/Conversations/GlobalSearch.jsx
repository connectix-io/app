import { useEffect, useRef, useState } from 'react';
import {
  Avatar, Box, Chip, ClickAwayListener, IconButton, InputBase, List, ListItemButton, Paper, Popper, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTranslation } from 'react-i18next';
import { searchAll } from './conversationQueries';
import { STATUSES } from './conversationCommands';
import { formatWhen, STATUS_ICON } from './conversationFormat';

// Bold the part that matched, as Gmail does.
function Highlight({ text = '', term }) {
  const i = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<b>{text.slice(i, i + term.length)}</b>{text.slice(i + term.length)}</>;
}

// The main search (top of the inbox): customers and what was said. Typing shows
// the best matches; Enter filters the conversation list by the term.
export default function GlobalSearch({ onOpen, onSearchAll, onStatus }) {
  const { t, i18n } = useTranslation();
  const anchor = useRef(null);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState({ contacts: [], messages: [] });

  useEffect(() => {
    if (!term.trim()) { setResult({ contacts: [], messages: [] }); return undefined; }
    let live = true;
    const id = setTimeout(() => {
      searchAll(term).then((r) => { if (live) setResult(r); }).catch(() => { if (live) setResult({ contacts: [], messages: [] }); });
    }, 200);
    return () => { live = false; clearTimeout(id); };
  }, [term]);

  const close = () => setOpen(false);
  const pick = (id) => { onOpen(id); close(); };
  const all = () => { onSearchAll(term); close(); };
  const clear = () => { setTerm(''); onSearchAll(''); };
  const empty = term.trim() && !result.contacts.length && !result.messages.length;

  return (
    <ClickAwayListener onClickAway={close}>
      <Box ref={anchor} sx={{ width: '100%', maxWidth: 560, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, height: 42, borderRadius: 1.5,
          bgcolor: 'background.paper', border: 1, borderColor: 'divider', '&:focus-within': { borderColor: 'primary.main' } }}>
          <SearchIcon sx={{ color: 'text.secondary' }} />
          <InputBase
            fullWidth value={term} placeholder={t('conversations.searchAll')}
            onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') all(); if (e.key === 'Escape') close(); }}
            inputProps={{ dir: 'auto', 'data-testid': 'conversations-search', 'aria-label': t('conversations.searchAll') }}
          />
          {term && <IconButton size="small" onClick={clear} aria-label={t('conversations.clear')}><CloseIcon fontSize="small" /></IconButton>}
        </Box>

        <Popper open={open} anchorEl={anchor.current} placement="bottom-start" sx={{ zIndex: 1300, width: anchor.current?.offsetWidth }}>
          <Paper elevation={8} sx={{ mt: 0.5, borderRadius: 2, overflow: 'hidden' }} data-testid="search-results">
            <Box sx={{ display: 'flex', gap: 1, p: 1.5, flexWrap: 'wrap' }}>
              {STATUSES.map((s) => (
                <Chip key={s} variant="outlined" icon={STATUS_ICON[s]} label={t(`conversations.status.${s}`)}
                  onClick={() => { onStatus(s); close(); }} sx={{ borderRadius: 1.5 }} />
              ))}
            </Box>

            {result.contacts.length > 0 && (
              <List dense disablePadding>
                {result.contacts.map((c) => (
                  <ListItemButton key={c.id} onClick={() => pick(c.id)} sx={{ gap: 1.5, py: 1 }}>
                    <Avatar variant="rounded" sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
                      {(c.contact_name || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography noWrap><Highlight text={c.contact_name} term={term} /></Typography>
                      <Typography variant="body2" color="text.secondary" noWrap dir="ltr" sx={{ textAlign: 'start' }}>
                        <Highlight text={c.contact_phone} term={term} />
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{formatWhen(c.updated_at, i18n.language)}</Typography>
                  </ListItemButton>
                ))}
              </List>
            )}

            {result.messages.length > 0 && (
              <List dense disablePadding sx={{ borderTop: 1, borderColor: 'divider' }}>
                {result.messages.map((m) => (
                  <ListItemButton key={m.id} onClick={() => pick(m.stream_id)} sx={{ gap: 1.5, py: 1 }}>
                    <ChatBubbleOutlineIcon fontSize="small" sx={{ color: 'text.secondary', mx: 0.75 }} />
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography noWrap><Highlight text={m.data.text || m.data.summary} term={term} /></Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{m.contact?.contact_name || ''}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{formatWhen(m.created_at, i18n.language)}</Typography>
                  </ListItemButton>
                ))}
              </List>
            )}

            {empty && <Typography sx={{ px: 2, py: 1.5 }} color="text.secondary">{t('conversations.noResults')}</Typography>}

            {term.trim() && (
              <ListItemButton onClick={all} sx={{ gap: 1.5, borderTop: 1, borderColor: 'divider', py: 1.25 }}>
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography sx={{ flexGrow: 1 }}>{t('conversations.allResults', { term })}</Typography>
                <Typography variant="caption" color="text.secondary">{t('conversations.pressEnter')}</Typography>
              </ListItemButton>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
