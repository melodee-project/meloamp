import { createTheme } from '@mui/material/styles';

const forestTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#388e3c' },
    secondary: { main: '#a5d6a7' },
    background: { default: '#e8f5e9', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default forestTheme;
