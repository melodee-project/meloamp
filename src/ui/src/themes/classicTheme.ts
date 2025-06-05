import { createTheme } from '@mui/material/styles';

const classicTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#ff9800' },
    background: { default: '#f5f5f5', paper: '#fff' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default classicTheme;
