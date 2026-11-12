import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { readUserSettings } from './settings';
import { getHighContrastTheme, resolveThemedTheme } from './themes/registry';
import i18n from './i18n';

/**
 * Render a themed shell immediately using the persisted settings so the first
 * paint does not flash the wrong theme. `App` takes over with live settings
 * once React mounts; both derive from `themes/registry.ts`.
 */
function bootstrapTheme() {
  const settings = readUserSettings();
  if (settings.language && i18n.language !== settings.language) {
    void i18n.changeLanguage(settings.language);
  }
  document.documentElement.style.setProperty('--meloamp-font-scale', String(settings.fontScale || 1));
  const base = resolveThemedTheme(settings.theme, settings.mode);
  return settings.highContrast ? getHighContrastTheme(base) : base;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={bootstrapTheme()}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
