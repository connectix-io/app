import { Avatar, Box, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TranslateIcon from '@mui/icons-material/Translate';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDirection } from '../../context/DirectionContext';
import { useAppTranslation } from '../../i18n/useAppTranslation';

// The left sidebar: ☰ shows / hides the conversation list, then every account
// option as an icon (no popup menu), who you are, and at the bottom the
// Connectix mark with the version (build date and time), small.
// Language also sets the direction (Hebrew = right-to-left).
export default function InboxRail({ listOpen, onToggleList }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { direction, colorMode, toggleColorMode, themeName } = useDirection();
  const { language, changeLanguage } = useAppTranslation();
  const navigate = useNavigate();
  const email = user?.email || '';
  const side = direction === 'rtl' ? 'left' : 'right';
  const version = import.meta.env.VITE_APP_VERSION || 'dev';
  const built = new Date(import.meta.env.VITE_BUILD_TIME || Date.now());
  const pad = (n) => String(n).padStart(2, '0');
  const builtDate = `${pad(built.getDate())}.${pad(built.getMonth() + 1)}`;
  const builtTime = `${pad(built.getHours())}:${pad(built.getMinutes())}`;

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
      gap: 0.5, py: 1.5,
    }}>
      <Tooltip title={t('conversations.toggleList')} placement={side}>
        <IconButton onClick={onToggleList} aria-label={t('conversations.toggleList')} aria-pressed={listOpen}
          data-testid="list-toggle" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
          <MenuIcon />
        </IconButton>
      </Tooltip>

      <Box sx={{ flexGrow: 1 }} />

      {action(language === 'he' ? 'English' : 'עברית', <TranslateIcon />, () => changeLanguage(language === 'he' ? 'en' : 'he'), 'rail-language')}
      {/* Theme: each click goes one step darker (light → dim → dark → midnight → black → light). */}
      {action(`${t('menu.theme')}: ${t(`menu.themes.${themeName}`)}`,
        colorMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />, toggleColorMode, 'color-mode')}
      {action(t('menu.logout'), <LogoutIcon />, () => { logout(); navigate('/login'); }, 'logout')}

      <Tooltip title={email} placement={side}>
        <Avatar variant="rounded" aria-label={email} sx={{ width: 36, height: 36, mt: 1, fontSize: 16, bgcolor: 'primary.main' }}>
          {(user?.name || email || '?').charAt(0).toUpperCase()}
        </Avatar>
      </Tooltip>

      <Tooltip title={`v${version} · ${built.toLocaleString()}`} placement={side}>
        <Box data-testid="app-version" sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, color: 'text.secondary', opacity: 0.7, userSelect: 'none' }}>
          <Box component="img" src="/brand/connectix-mark.svg" alt="Connectix" sx={{ width: 24, height: 24, mb: 0.25 }} />
          <Box sx={{ fontSize: 10, lineHeight: 1.2 }}>{builtDate}</Box>
          <Box sx={{ fontSize: 10, lineHeight: 1.2 }}>{builtTime}</Box>
        </Box>
      </Tooltip>
    </Box>
  );
}
