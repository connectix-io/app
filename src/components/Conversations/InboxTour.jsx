import { useEffect, useLayoutEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

// A short guided tour for first-time (non-technical) users: it dims the screen,
// lights up one part at a time and says in plain words what it is for.
// Steps whose part is not on screen (e.g. no conversation open) are skipped.
const STEPS = [
  { id: 'list', target: ['conversations-list'] },
  { id: 'new', target: ['conversations-new'] },
  { id: 'search', target: ['conversations-search'] },
  { id: 'phone', target: ['phone-panel', 'phone-button'] },
  { id: 'help', target: ['rail-help'] },
];

const TOUR_KEY = 'inbox-tour-done';
export const tourSeen = () => { try { return localStorage.getItem(TOUR_KEY) === '1'; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* private mode */ } };

function findTarget(step) {
  for (const id of step.target || []) {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }
  }
  return null;
}

const CARD_W = 340;
const PAD = 6;

export default function InboxTour({ open, onClose }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [, setTick] = useState(0);

  // Only steps whose part is visible right now.
  const steps = STEPS.filter((s) => !s.target || findTarget(s));
  const step = steps[Math.min(index, steps.length - 1)];
  const last = index >= steps.length - 1;

  useEffect(() => { if (open) setIndex(0); }, [open]);

  useLayoutEffect(() => {
    if (!open || !step) return undefined;
    const measure = () => setRect(step.target ? findTarget(step) : null);
    measure();
    const onResize = () => { measure(); setTick((n) => n + 1); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, step]);

  if (!open || !step) return null;

  const close = () => { markSeen(); onClose(); };
  const next = () => (last ? close() : setIndex((i) => i + 1));

  // Card next to the lit part: below it if there is room, else above; centred if no part.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let cardSx = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  if (rect) {
    const left = Math.max(16, Math.min(rect.left + rect.width / 2 - CARD_W / 2, vw - CARD_W - 16));
    const below = rect.bottom + 16;
    cardSx = below + 220 < vh
      ? { top: below, left }
      : { top: Math.max(16, rect.top - 236), left };
  }

  return (
    <Box role="dialog" aria-modal="true" aria-labelledby="tour-title" data-testid="inbox-tour"
      sx={{ position: 'fixed', inset: 0, zIndex: 1600 }}
      onKeyDown={(e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight' || e.key === 'Enter') next(); }}>
      {/* Dim everything except the lit part. */}
      {rect ? (
        <Box sx={{
          position: 'fixed', top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: 2, boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)', border: 2, borderColor: 'primary.main',
          transition: 'all 260ms ease', pointerEvents: 'none',
        }} />
      ) : (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.55)' }} />
      )}

      <Paper elevation={12} sx={{
        position: 'fixed', width: CARD_W, maxWidth: 'calc(100vw - 32px)', p: 2.5, borderRadius: 2,
        border: 1, borderColor: 'divider', transition: 'top 260ms ease, left 260ms ease', ...cardSx,
      }}>
        <Typography variant="caption" color="text.secondary">
          {t('tour.step', { n: index + 1, total: steps.length })}
        </Typography>
        <Typography id="tour-title" sx={{ fontSize: 19, fontWeight: 600, mt: 0.5 }}>{t(`tour.${step.id}.title`)}</Typography>
        <Typography sx={{ mt: 1, fontSize: 16, lineHeight: 1.5 }}>{t(`tour.${step.id}.text`)}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 2.5, alignItems: 'center' }}>
          <Button onClick={close} color="inherit" sx={{ color: 'text.secondary' }} data-testid="tour-skip">{t('tour.skip')}</Button>
          <Box sx={{ flexGrow: 1 }} />
          {index > 0 && <Button onClick={() => setIndex((i) => i - 1)} variant="outlined">{t('tour.back')}</Button>}
          <Button onClick={next} variant="contained" autoFocus data-testid="tour-next">
            {last ? t('tour.done') : t('tour.next')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
