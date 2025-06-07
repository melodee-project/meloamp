import { createTheme } from '@mui/material/styles';

const scarlettTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4B0082' }, // Indigo
    secondary: { main: '#FF1493' }, // Deep pink
    error: { main: '#B22222' }, // Firebrick
    warning: { main: '#FFD700' }, // Gold
    info: { main: '#00BFFF' }, // Deep sky blue
    success: { main: '#32CD32' }, // Lime green
    background: { default: '#f3eaff', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Caveat, "Comic Sans MS", cursive, sans-serif',
  },
  shape: {
    borderRadius: 18,
  },
});

export default scarlettTheme;
