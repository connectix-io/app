// Brand identity, set per customer at build time (VITE_* in .env / Kamal builder args),
// so the template rebrands without code changes. Defaults: "voipappz" and the bundled
// logos in public/brand/.
//   VITE_APP_NAME          display name (header, tab title, alt text, welcome)
//   VITE_BRAND_LOGO        logo URL on a light background (menu, login, favicon)
//   VITE_BRAND_LOGO_WHITE  logo URL on a dark background (login sidebar)
//   VITE_PRIMARY_COLOR     primary colour (light theme)
const env = import.meta.env || {};

export const brand = {
  name: env.VITE_APP_NAME || 'voipappz',
  logo: env.VITE_BRAND_LOGO || '/brand/voipappz-logo.png',
  logoWhite: env.VITE_BRAND_LOGO_WHITE || '/brand/voipappz-logo-white.png',
  icon: '/favicon.ico',
  color: env.VITE_PRIMARY_COLOR || '',
};
