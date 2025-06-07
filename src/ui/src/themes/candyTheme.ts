import { createTheme } from '@mui/material/styles';

const candyTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ff69b4' }, // Candy pink
    secondary: { main: '#40e0d0' }, // Turquoise
    error: { main: '#ff1744' },
    warning: { main: '#ffe066' },
    info: { main: '#8ecae6' },
    success: { main: '#b5ead7' },
    background: { default: '#fff0f6', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Baloo 2, Comic Sans MS, cursive, sans-serif',
  },
  shape: {
    borderRadius: 24,
  },
});

export default candyTheme;
