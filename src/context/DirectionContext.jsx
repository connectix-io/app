import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import { createTheme } from '@mui/material/styles';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import createCache from '@emotion/cache';
import { theme as baseMuiTheme } from '../theme/muiTheme';
import { brand } from '../config';

// Same colours as the phone dock: slate panels, orange accent, green for calls.
const DARK_PALETTE = {
  background: { default: '#2f3640', paper: '#3b4350' },
  text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.65)' },
  divider: 'rgba(255,255,255,0.10)',
  primary: { main: '#f5a623', dark: '#d98e12', light: '#f8bd5a', contrastText: '#1f2328' },
  success: { main: '#34c759', contrastText: '#ffffff' },
};

const DirectionContext = createContext();

export const useDirection = () => {
  const context = useContext(DirectionContext);
  if (!context) {
    throw new Error('useDirection must be used within DirectionProvider');
  }
  return context;
};

export const DirectionProvider = ({ children }) => {
  // Initialize direction from localStorage or default to 'rtl'
  const [direction, setDirection] = useState(() => {
    return localStorage.getItem('app-direction') || 'rtl';
  });

  // Light / dark: remembered per browser, first visit follows the system setting.
  const [colorMode, setColorMode] = useState(() => {
    try {
      const saved = localStorage.getItem('color-mode');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* private mode */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const toggleColorMode = () => setColorMode((m) => {
    const next = m === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('color-mode', next); } catch { /* private mode */ }
    return next;
  });

  // Create emotion cache based on direction
  const emotionCache = useMemo(() => {
    if (direction === 'rtl') {
      return createCache({
        key: 'muirtl',
        stylisPlugins: [prefixer, rtlPlugin],
      });
    } else {
      return createCache({
        key: 'muiltr',
        stylisPlugins: [prefixer],
      });
    }
  }, [direction]);

  // Create MUI theme by merging base theme with direction-specific overrides.
  // The tenant's brand colour (customer_portal_data.logo_color, e.g. MTN #080808)
  // drives palette.primary. Applied HERE rather than in muiTheme.js because that
  // module is evaluated at import time — before boot() fetches the portal data —
  // whereas this theme is built at render, once the data is cached.
  const theme = useMemo(() => {
    // Dark mode wears the softphone dock's palette (PhoneWidget), so the inbox and
    // the phone read as one app; the tenant brand colour applies in light mode.
    const brandColor = colorMode === 'dark' ? '' : brand.color;
    return createTheme({
      ...baseMuiTheme,
      direction: direction, // Override direction dynamically
      palette: {
        ...baseMuiTheme.palette,
        mode: colorMode,
        ...(colorMode === 'dark' ? DARK_PALETTE : {}),
        ...(brandColor
          ? { primary: { ...baseMuiTheme.palette?.primary, main: brandColor } }
          : {}),
        ...(colorMode === 'dark' ? { primary: DARK_PALETTE.primary } : {}),
      },
      components: {
        ...baseMuiTheme.components,
        MuiDrawer: {
          ...baseMuiTheme.components?.MuiDrawer,
          defaultProps: {
            anchor: direction === 'rtl' ? 'right' : 'left',
          },
        },
        MuiTooltip: {
          ...baseMuiTheme.components?.MuiTooltip,
          defaultProps: {
            placement: direction === 'rtl' ? 'left' : 'right',
          },
        },
      },
    });
  }, [direction, colorMode]);

  // The page outside MUI components follows the mode too.
  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.background.default;
    document.body.style.color = theme.palette.text.primary;
    document.documentElement.style.colorScheme = colorMode;
  }, [theme, colorMode]);

  // Toggle direction function
  const toggleDirection = () => {
    const newDirection = direction === 'rtl' ? 'ltr' : 'rtl';
    setDirection(newDirection);
    localStorage.setItem('app-direction', newDirection);
    // Update document direction
    document.documentElement.dir = newDirection;
    document.documentElement.lang = newDirection === 'rtl' ? 'he' : 'en';
  };

  // Sync document direction on mount and direction change
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = direction === 'rtl' ? 'he' : 'en';
  }, [direction]);

  // Set direction to specific value (for i18n integration)
  const setDirectionValue = (newDirection) => {
    if (newDirection !== direction) {
      setDirection(newDirection);
      localStorage.setItem('app-direction', newDirection);
      document.documentElement.dir = newDirection;
      document.documentElement.lang = newDirection === 'rtl' ? 'he' : 'en';
    }
  };

  const value = {
    direction,
    toggleDirection,
    setDirection: setDirectionValue,
    isRTL: direction === 'rtl',
    colorMode,
    toggleColorMode,
  };

  return (
    <DirectionContext.Provider value={value}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </CacheProvider>
    </DirectionContext.Provider>
  );
};
