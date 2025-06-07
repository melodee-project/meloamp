import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, CssBaseline } from '@mui/material';
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
import './i18n';

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
  berryTwilight: (mode: 'light' | 'dark') => getBerryTwilightTheme(mode)
};

const getUserSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('userSettings') || '') || {};
  } catch {
    return {};
  }
};

const settings = getUserSettings();
const baseTheme = typeof themeMap[settings.theme] === 'function'
  ? themeMap[settings.theme](settings.mode || 'light')
  : themeMap[settings.theme] || classicTheme;
const theme = baseTheme;

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
