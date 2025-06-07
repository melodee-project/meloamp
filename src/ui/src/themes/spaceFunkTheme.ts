import { createTheme } from '@mui/material/styles';

const spaceFunkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7f00ff' }, // Electric purple
    secondary: { main: '#e100ff' }, // Magenta
    error: { main: '#ff1744' },
    warning: { main: '#ffe066' },
    info: { main: '#00eaff' },
    success: { main: '#00ff85' },
    background: { default: '#0a0033', paper: '#1a004d' },
  },
  typography: {
    fontFamily: 'Orbitron, "Papyrus", fantasy, sans-serif',
  },
  shape: {
    borderRadius: 40,
  },
});

export default spaceFunkTheme;
