import { createTheme } from '@mui/material/styles';

export const getMonoContrastTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: mode === 'dark' ? '#ffffff' : '#222222' },
    secondary: { main: mode === 'dark' ? '#bbbbbb' : '#444444' },
    background: {
      default: mode === 'dark' ? '#181818' : '#f5f5f5',
      paper: mode === 'dark' ? '#232323' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#f5f5f5' : '#181818',
      secondary: mode === 'dark' ? '#bbbbbb' : '#444444',
    },
  },
  typography: {
    fontFamily: 'Fira Mono, monospace',
  },
  shape: {
    borderRadius: 6,
  },
});

export default getMonoContrastTheme;
