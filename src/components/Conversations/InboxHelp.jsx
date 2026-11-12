import { Box, Button, Drawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../context/DirectionContext';

// Help in plain words: five short answers and a button to replay the tour.
const TOPICS = ['start', 'reply', 'find', 'call', 'list'];

export default function InboxHelp({ open, onClose, onTour }) {
  const { t } = useTranslation();
  const { direction } = useDirection();

  return (
    <Drawer open={open} onClose={onClose} anchor={direction === 'rtl' ? 'right' : 'left'}
      PaperProps={{ dir: direction, sx: { width: 360, maxWidth: '100vw', p: 2.5 } }}>
      <Box data-testid="inbox-help">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 600, flexGrow: 1 }}>{t('help.title')}</Typography>
          <IconButton onClick={onClose} aria-label={t('help.close')}><CloseIcon /></IconButton>
        </Box>
        {TOPICS.map((k) => (
          <Box key={k} sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600 }}>{t(`help.q.${k}`)}</Typography>
            <Typography color="text.secondary">{t(`help.a.${k}`)}</Typography>
          </Box>
        ))}
        <Button fullWidth variant="contained" onClick={() => { onClose(); onTour(); }} data-testid="help-tour">
          {t('help.tour')}
        </Button>
      </Box>
    </Drawer>
  );
}
