import { createTheme } from '@mui/material/styles';

const oceanTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0288d1' },
    secondary: { main: '#26c6da' },
    background: { default: '#e0f7fa', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default oceanTheme;
