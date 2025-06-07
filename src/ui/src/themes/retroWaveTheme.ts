import { createTheme } from '@mui/material/styles';

const retroWaveTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ff00cc' }, // Neon pink
    secondary: { main: '#00fff7' }, // Neon cyan
    error: { main: '#ff1744' },
    warning: { main: '#ffe066' },
    info: { main: '#8ecae6' },
    success: { main: '#b5ead7' },
    background: { default: '#2d0036', paper: '#3a006a' },
  },
  typography: {
    fontFamily: 'Monoton, "Comic Sans MS", cursive, sans-serif',
  },
  shape: {
    borderRadius: 20,
  },
});

export default retroWaveTheme;
