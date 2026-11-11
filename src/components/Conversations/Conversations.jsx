import { useState } from 'react';
import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, ToggleButton,
  ToggleButtonGroup, Button, Chip, Typography, Alert, CircularProgress, Drawer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../context/DirectionContext';
import { useConversations } from './useConversations';
import { STATUSES } from './conversationCommands';
import ConversationThread from './ConversationThread';
import NewConversationDialog from './NewConversationDialog';
import { channelIcon, statusColor, formatWhen } from './conversationFormat';

// The main screen: one table of conversations (the read model), a thread panel
// for the selected row, and a dialog to start a new conversation.
export default function Conversations() {
  const { t, i18n } = useTranslation();
  const { direction } = useDirection();
  const c = useConversations();
  const [creating, setCreating] = useState(false);

  return (
    <Box dir={direction} sx={{ p: 2 }} data-testid="conversations-page">
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>{t('conversations.title')}</Typography>
        <TextField
          size="small"
          placeholder={t('conversations.search')}
          value={c.search}
          onChange={(e) => c.setSearch(e.target.value)}
          data-testid="conversations-search"
        />
        <ToggleButtonGroup size="small" exclusive value={c.status} onChange={(_, v) => v && c.setStatus(v)}>
          {['all', ...STATUSES].map((s) => (
            <ToggleButton key={s} value={s}>{t(`conversations.status.${s}`)}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)} data-testid="conversations-new">
          {t('conversations.new')}
        </Button>
      </Box>

      {c.error && <Alert severity="error" sx={{ mb: 2 }}>{c.error}</Alert>}

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small" data-testid="conversations-table">
          <TableHead>
            <TableRow>
              <TableCell>{t('conversations.col.contact')}</TableCell>
              <TableCell>{t('conversations.col.channel')}</TableCell>
              <TableCell>{t('conversations.col.last')}</TableCell>
              <TableCell>{t('conversations.col.status')}</TableCell>
              <TableCell>{t('conversations.col.assignee')}</TableCell>
              <TableCell>{t('conversations.col.updated')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {c.loading && (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            )}
            {!c.loading && c.rows.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">{t('conversations.empty')}</TableCell></TableRow>
            )}
            {c.rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                selected={row.id === c.selectedId}
                onClick={() => c.setSelectedId(row.id)}
                sx={{ cursor: 'pointer' }}
                data-testid="conversation-row"
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{row.contact_name}</Typography>
                  <Typography variant="caption" color="text.secondary" dir="ltr">{row.contact_phone}</Typography>
                </TableCell>
                <TableCell>{channelIcon(row.channel)} {t(`conversations.channel.${row.channel}`, row.channel)}</TableCell>
                <TableCell sx={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.last_text || '—'}
                </TableCell>
                <TableCell>
                  <Chip size="small" color={statusColor(row.status)} label={t(`conversations.status.${row.status}`)} />
                </TableCell>
                <TableCell>{row.assignee || t('conversations.unassigned')}</TableCell>
                <TableCell>{formatWhen(row.updated_at, i18n.language)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Drawer
        anchor={direction === 'rtl' ? 'left' : 'right'}
        open={Boolean(c.selected)}
        onClose={() => c.setSelectedId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        {c.selected && (
          <ConversationThread conversation={c.selected} events={c.thread} onClose={() => c.setSelectedId(null)} />
        )}
      </Drawer>

      <NewConversationDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => { setCreating(false); c.setSelectedId(id); c.refresh(); }}
      />
    </Box>
  );
}
