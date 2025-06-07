import { createTheme } from '@mui/material/styles';

const winAmpTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00ff00' }, // Neon green
    secondary: { main: '#ffff00' }, // Bright yellow
    error: { main: '#ff0000' },
    warning: { main: '#ff9900' },
    info: { main: '#00ccff' },
    success: { main: '#e6c200' }, // Accent gold
    background: { default: '#2b2b2b', paper: '#44444a' },
    text: { primary: '#ffffff', secondary: '#00ff00' },
  },
  typography: {
    fontFamily: '"Segoe UI", "Arial", "sans-serif"',
  },
  shape: {
    borderRadius: 6,
  },
});

export default winAmpTheme;
