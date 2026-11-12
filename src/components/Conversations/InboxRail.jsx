import { Avatar, Box, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TranslateIcon from '@mui/icons-material/Translate';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDirection } from '../../context/DirectionContext';
import { useAppTranslation } from '../../i18n/useAppTranslation';

// The left sidebar: ☰ shows / hides the conversation list, the Connectix mark,
// then every account option as an icon (no popup menu), and who you are.
export default function InboxRail({ listOpen, onToggleList }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { direction, toggleDirection, colorMode, toggleColorMode } = useDirection();
  const { language, changeLanguage } = useAppTranslation();
  const navigate = useNavigate();
  const email = user?.email || '';
  const side = direction === 'rtl' ? 'left' : 'right';

  const action = (title, icon, onClick, testid) => (
    <Tooltip title={title} placement={side}>
      <IconButton onClick={onClick} aria-label={title} data-testid={testid} sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box component="nav" sx={{
      width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 0.5, py: 1.5, bgcolor: 'action.hover', borderInlineEnd: 1, borderColor: 'divider',
    }}>
      <Tooltip title={t('conversations.toggleList')} placement={side}>
        <IconButton onClick={onToggleList} aria-label={t('conversations.toggleList')} aria-pressed={listOpen}
          data-testid="list-toggle" sx={{ borderRadius: 1.5 }}>
          <MenuIcon />
        </IconButton>
      </Tooltip>
      <Box component="img" src="/brand/connectix-mark.svg" alt="Connectix" sx={{ width: 36, height: 36, my: 1 }} />

      <Box sx={{ flexGrow: 1 }} />

      {action(language === 'he' ? 'English' : 'עברית', <TranslateIcon />, () => changeLanguage(language === 'he' ? 'en' : 'he'), 'rail-language')}
      {action(direction === 'rtl' ? t('menu.switchToLTR', 'Left-to-right') : t('menu.switchToRTL', 'Right-to-left'),
        <SwapHorizIcon />, toggleDirection, 'rail-direction')}
      {action(colorMode === 'dark' ? t('menu.lightMode', 'Light mode') : t('menu.darkMode', 'Dark mode'),
        colorMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />, toggleColorMode, 'color-mode')}
      {action(t('menu.logout'), <LogoutIcon />, () => { logout(); navigate('/login'); }, 'logout')}

      <Tooltip title={email} placement={side}>
        <Avatar variant="rounded" aria-label={email} sx={{ width: 36, height: 36, mt: 1, fontSize: 16, bgcolor: 'primary.main' }}>
          {(user?.name || email || '?').charAt(0).toUpperCase()}
        </Avatar>
      </Tooltip>
    </Box>
  );
}
