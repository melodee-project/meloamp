import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import classicTheme from './themes/classicTheme';
import oceanTheme from './themes/oceanTheme';
import sunsetTheme from './themes/sunsetTheme';
import forestTheme from './themes/forestTheme';
import darkTheme from './themes/darkTheme';
import rainbowTheme from './themes/rainbowTheme';
import candyTheme from './themes/candyTheme';
import bubblegumTheme from './themes/bubblegumTheme';
import retroWaveTheme from './themes/retroWaveTheme';
import spaceFunkTheme from './themes/spaceFunkTheme';
import acidPopTheme from './themes/acidPopTheme';
import fiestaTheme from './themes/fiestaTheme';
import scarlettTheme from './themes/scarlettTheme';
import getAuroraTheme from './themes/auroraTheme';
import getMonoContrastTheme from './themes/monoContrastTheme';
import getBerryTwilightTheme from './themes/berryTwilightTheme';
import winAmpTheme from './themes/winAmpTheme';
import i18n from './i18n';

const themeMap: any = {
  classic: classicTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  forest: forestTheme,
  dark: darkTheme,
  rainbow: rainbowTheme,
  candy: candyTheme,
  bubblegum: bubblegumTheme,
  retroWave: retroWaveTheme,
  spaceFunk: spaceFunkTheme,
  acidPop: acidPopTheme,
  fiesta: fiestaTheme,
  scarlett: scarlettTheme,
  aurora: (mode: 'light' | 'dark') => getAuroraTheme(mode),
  monoContrast: (mode: 'light' | 'dark') => getMonoContrastTheme(mode),
  berryTwilight: (mode: 'light' | 'dark') => getBerryTwilightTheme(mode),
  winAmp: winAmpTheme,
};

const getUserSettings = () => {
  try {
    const stored = localStorage.getItem('userSettings');
    if (stored) return JSON.parse(stored);
    // Default settings if none exist
    return {
      theme: 'berryTwilight',
      language: 'en',
      highContrast: false,
      fontScale: 1,
      caching: false,
      mode: 'dark',
    };
  } catch {
    return {
      theme: 'berryTwilight',
      language: 'en',
      highContrast: false,
      fontScale: 1,
      caching: false,
      mode: 'dark',
    };
  }
};

const settings = getUserSettings();
if (settings.language && i18n.language !== settings.language) {
  i18n.changeLanguage(settings.language);
}
const baseTheme = typeof themeMap[settings.theme] === 'function'
  ? themeMap[settings.theme](settings.mode || 'light')
  : themeMap[settings.theme] || getBerryTwilightTheme('light');
const theme = settings.highContrast ? getHighContrastTheme(baseTheme) : baseTheme;

// Apply font scale globally using a CSS variable
if (typeof window !== 'undefined') {
  document.documentElement.style.setProperty('--meloamp-font-scale', String(settings.fontScale || 1));
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();

function getHighContrastTheme(baseTheme: any) {
  return createTheme({
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      background: {
        default: '#000',
        paper: '#111',
      },
      text: {
        primary: '#fff',
        secondary: '#ff0',
      },
      primary: {
        main: '#fff',
        contrastText: '#000',
      },
      secondary: {
        main: '#ff0',
        contrastText: '#000',
      },
      divider: '#fff',
      error: { main: '#ff1744' },
      warning: { main: '#ffd600' },
      info: { main: '#00eaff' },
      success: { main: '#76ff03' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            color: '#000',
            backgroundColor: '#fff',
            border: '2px solid #ff0',
            fontWeight: 700,
          },
        },
      },
    },
  });
}
