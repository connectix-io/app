import { useState } from 'react';
import {
  Box, List, ListItemButton, Avatar, Chip, IconButton, Typography, Alert,
  CircularProgress, Tooltip, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { STATUS_ICON, PANE_HEADER, CARD } from './conversationFormat';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../context/DirectionContext';
import InboxRail from './InboxRail';
import GlobalSearch from './GlobalSearch';
import PhoneWidget from '../Phone/PhoneWidget';
import ErrorBoundary from '../common/ErrorBoundary';
import { useConversations } from './useConversations';
import { STATUSES } from './conversationCommands';
import ConversationThread from './ConversationThread';
import CustomerPanel from './CustomerPanel';
import NewConversationDialog from './NewConversationDialog';
import { formatWhen } from './conversationFormat';

const LIST_KEY = 'inbox-list-open';
const readListOpen = () => { try { return localStorage.getItem(LIST_KEY) !== '0'; } catch { return true; } };
const STATUS_DOT = { open: 'primary.main', pending: 'warning.main', resolved: 'success.main' };
const LIST_WIDTH = 400;

// The inbox, WhatsApp Web style: the left sidebar, then the conversation list,
// the chat (its header line holds the main search) and the docked phone
// (customer info is a phone tab). Each pane is a bordered card, like the phone. On a phone the list and the chat take turns.
export default function Conversations() {
  const { t } = useTranslation();
  const { direction } = useDirection();
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down('md'));
  const c = useConversations();
  const [creating, setCreating] = useState(false);
  const [listOpen, setListOpenState] = useState(readListOpen);

  const setListOpen = (value) => {
    try { localStorage.setItem(LIST_KEY, value ? '1' : '0'); } catch { /* private mode */ }
    setListOpenState(value);
  };
  const showList = narrow ? (listOpen || !c.selected) : listOpen;
  const showThread = !narrow || !showList;
  const open = (id) => { c.setSelectedId(id); if (narrow) setListOpen(false); };
  // The phone docks as the right-most column (on phones it stays an overlay);
  // the open conversation's customer is a tab inside it.
  const customer = c.selected
    ? <Box dir={direction}><CustomerPanel embedded conversation={c.selected} events={c.thread} /></Box>
    : null;
  const search = <GlobalSearch onOpen={open} onSearchAll={c.setSearch} onStatus={c.setStatus} />;
  const phone = (
    <ErrorBoundary label="phone-widget" fallback={null}>
      <PhoneWidget dock={narrow ? null : 'phone-dock'} customer={customer} />
    </ErrorBoundary>
  );

  return (
    <Box dir={direction} data-testid="conversations-page" sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
      bgcolor: (th) => (th.palette.mode === 'dark' ? th.palette.background.default : th.palette.grey[100]) }}>
      <InboxRail listOpen={showList} onToggleList={() => setListOpen(!showList)} />


      {/* Conversation list — a card that slides open / closed. */}
      {(showList || !narrow) && (
        <Box sx={{
          width: narrow ? '100%' : (showList ? LIST_WIDTH : 0), flexShrink: 0, overflow: 'hidden',
          transition: 'width 240ms ease', display: 'flex',
        }}>
          <Box sx={{ ...CARD, width: '100%', minWidth: narrow ? 0 : LIST_WIDTH - 16, marginInlineEnd: 0 }}>
            {/* Filters and + share the top line with the chat header and the phone. */}
            <Box sx={{ ...PANE_HEADER, px: 1.5, gap: 0.75 }}>
              <Box sx={{ display: 'flex', gap: 0.75, flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                {/* Only the selected filter shows its name; the others are icons with a tooltip, so all fit. */}
                {['all', ...STATUSES].map((s) => (
                  <Tooltip key={s} title={c.status === s ? '' : t(`conversations.status.${s}`)}>
                  <Chip icon={STATUS_ICON[s]} label={c.status === s ? t(`conversations.status.${s}`) : undefined}
                    aria-label={t(`conversations.status.${s}`)} onClick={() => c.setStatus(s)}
                    data-testid={`filter-${s}`} variant={c.status === s ? 'filled' : 'outlined'}
                    sx={{
                      fontSize: 14, height: 32, flexShrink: 0, borderRadius: 1.5,
                      ...(c.status === s
                        ? { bgcolor: 'primary.main', color: 'primary.contrastText', '& .MuiChip-icon': { color: 'inherit' }, '&:hover': { bgcolor: 'primary.dark' } }
                        : { bgcolor: 'background.paper', '& .MuiChip-label': { display: 'none' }, '& .MuiChip-icon': { mx: 1 } }),
                    }} />
                  </Tooltip>
                ))}
              </Box>
              <Tooltip title={t('conversations.new')}>
                <IconButton onClick={() => setCreating(true)} data-testid="conversations-new" aria-label={t('conversations.new')}
                  sx={{ flexShrink: 0, borderRadius: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
            {narrow && <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>{search}</Box>}

            {c.error === 'setup' && (
              <Alert severity="info" sx={{ m: 2 }} data-testid="conversations-setup">{t('conversations.setupNeeded')}</Alert>
            )}
            {c.error && c.error !== 'setup' && <Alert severity="error" sx={{ m: 2 }}>{c.error}</Alert>}

            <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto', px: 1, pt: 1 }} data-testid="conversations-list">
              {c.loading && <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>}
              {!c.loading && !c.error && c.rows.length === 0 && (
                <Typography sx={{ p: 3 }} align="center" color="text.secondary">{t('conversations.empty')}</Typography>
              )}
              {c.rows.map((row) => (
                <ConversationItem key={row.id} row={row} selected={row.id === c.selectedId} onClick={() => open(row.id)} />
              ))}
            </List>
          </Box>
        </Box>
      )}

      {showThread && (
        <Box sx={{ ...CARD, flexGrow: 1, minWidth: 0, minHeight: 0, marginInlineEnd: 0 }}>
          {c.selected ? (
            <ConversationThread conversation={c.selected} events={c.thread} actions={phone} search={narrow ? null : search}
              onBack={narrow ? () => setListOpen(true) : null} />
          ) : (
            <>
              <Box sx={{ ...PANE_HEADER, gap: 1.5 }}>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>{narrow ? null : search}</Box>
                {phone}
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 1, color: 'text.secondary' }}>
                <ForumOutlinedIcon sx={{ fontSize: 56 }} />
                <Typography sx={{ fontSize: 18 }}>{t('conversations.pick')}</Typography>
              </Box>
            </>
          )}
        </Box>
      )}

      <Box id="phone-dock" sx={{ display: 'flex', flexShrink: 0, height: '100%' }} />

      <NewConversationDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => { setCreating(false); open(id); c.refresh(); }}
      />
    </Box>
  );
}

function ConversationItem({ row, selected, onClick }) {
  const { t, i18n } = useTranslation();
  const name = row.contact_name || row.contact_phone || '?';
  return (
    <ListItemButton selected={selected} onClick={onClick} data-testid="conversation-row"
      sx={{ gap: 1.5, py: 1.5, px: 1.5, borderRadius: 1.5, mb: 0.25, '&.Mui-selected': { bgcolor: 'action.selected' } }}>
      <Avatar variant="rounded" sx={{ width: 48, height: 48, fontSize: 19, bgcolor: 'primary.main' }}>{name.trim().charAt(0).toUpperCase()}</Avatar>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography noWrap sx={{ flexGrow: 1, fontSize: 17, fontWeight: 500 }}>{name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {formatWhen(row.updated_at, i18n.language)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography color="text.secondary" noWrap sx={{ flexGrow: 1, fontSize: 15 }}>
            {row.last_text || t(`conversations.channel.${row.channel}`, row.channel)}
          </Typography>
          <Box title={t(`conversations.status.${row.status}`)}
            sx={{ width: 10, height: 10, borderRadius: 0.5, flexShrink: 0, bgcolor: STATUS_DOT[row.status] || 'grey.400' }} />
        </Box>
      </Box>
    </ListItemButton>
  );
}
