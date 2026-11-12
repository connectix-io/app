import { useState } from 'react';
import {
  Avatar, Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDirection } from '../../context/DirectionContext';
import { useAppTranslation } from '../../i18n/useAppTranslation';

// Top-right account button (as in ../app and Zendesk): your avatar opens who you
// are signed in as, language, direction and sign out.
export default function AccountMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { direction, toggleDirection, colorMode, toggleColorMode } = useDirection();
  const { language, changeLanguage } = useAppTranslation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  const email = user?.email || '';
  const name = user?.name || email.split('@')[0] || '?';

  return (
    <>
      <Tooltip title={email || t('menu.account', 'Account')}>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} data-testid="account-button"
          aria-label={t('menu.account', 'Account')} sx={{ p: 0.5 }}>
          <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 16 }}>
            {name.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 240, mt: 1 } } }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography fontWeight={600}>{name}</Typography>
          <Typography variant="body2" color="text.secondary">{email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { changeLanguage(language === 'he' ? 'en' : 'he'); close(); }}>
          <ListItemIcon><TranslateIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={language === 'he' ? 'English' : 'עברית'} />
        </MenuItem>
        <MenuItem onClick={() => { toggleDirection(); close(); }}>
          <ListItemIcon><SwapHorizIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={direction === 'rtl'
            ? t('menu.switchToLTR', 'Left-to-right') : t('menu.switchToRTL', 'Right-to-left')} />
        </MenuItem>
        <MenuItem onClick={() => { toggleColorMode(); close(); }} data-testid="color-mode">
          <ListItemIcon>{colorMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}</ListItemIcon>
          <ListItemText primary={colorMode === 'dark' ? t('menu.lightMode', 'Light mode') : t('menu.darkMode', 'Dark mode')} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { close(); logout(); navigate('/login'); }} data-testid="logout">
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('menu.logout')} />
        </MenuItem>
      </Menu>
    </>
  );
}
