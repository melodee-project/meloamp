import { createTheme } from '@mui/material/styles';

export const getBerryTwilightTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: mode === 'dark' ? '#ff5eae' : '#ad1457' },
    secondary: { main: mode === 'dark' ? '#7c43bd' : '#ce93d8' },
    background: {
      default: mode === 'dark' ? '#2a003f' : '#f3e5f5',
      paper: mode === 'dark' ? '#3d155f' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#f3e5f5' : '#2a003f',
      secondary: mode === 'dark' ? '#ce93d8' : '#7c43bd',
    },
  },
  typography: {
    fontFamily: 'Fredoka One, Comic Sans MS, cursive, sans-serif',
  },
  shape: {
    borderRadius: 20,
  },
});

export default getBerryTwilightTheme;
