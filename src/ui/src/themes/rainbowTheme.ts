import { createTheme } from '@mui/material/styles';

const rainbowTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ff0080' }, // Hot pink
    secondary: { main: '#00bfff' }, // Sky blue
    error: { main: '#ff1744' },
    warning: { main: '#ffd600' },
    info: { main: '#00e676' },
    success: { main: '#76ff03' },
    background: { default: '#fffbe7', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Comic Sans MS, Comic Sans, cursive, sans-serif',
  },
  shape: {
    borderRadius: 16,
  },
});

export default rainbowTheme;
