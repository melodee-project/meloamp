import { createTheme } from '@mui/material/styles';

const bubblegumTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ffb6b9' }, // Bubblegum pink
    secondary: { main: '#fcd5ce' }, // Pastel peach
    error: { main: '#ff1744' },
    warning: { main: '#ffe066' },
    info: { main: '#a0c4ff' },
    success: { main: '#b5ead7' },
    background: { default: '#f9f6fd', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Fredoka One, Comic Sans MS, cursive, sans-serif',
  },
  shape: {
    borderRadius: 32,
  },
});

export default bubblegumTheme;
