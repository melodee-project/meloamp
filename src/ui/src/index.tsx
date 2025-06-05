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

const themeMap: any = {
  classic: classicTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  forest: forestTheme,
  dark: darkTheme,
};

const getUserSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('userSettings') || '') || {};
  } catch {
    return {};
  }
};

const settings = getUserSettings();
const theme = themeMap[settings.theme] || classicTheme;

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
