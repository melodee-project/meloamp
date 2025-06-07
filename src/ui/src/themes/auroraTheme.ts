import { createTheme } from '@mui/material/styles';

export const getAuroraTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: mode === 'dark' ? '#00ffd0' : '#00796b' },
    secondary: { main: mode === 'dark' ? '#ffb300' : '#ff9800' },
    background: {
      default: mode === 'dark' ? '#1a2233' : '#e0f7fa',
      paper: mode === 'dark' ? '#232b3b' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#e0f7fa' : '#232b3b',
      secondary: mode === 'dark' ? '#b2ebf2' : '#607d8b',
    },
  },
  typography: {
    fontFamily: 'Quicksand, Arial, sans-serif',
  },
  shape: {
    borderRadius: 18,
  },
});

export default getAuroraTheme;
