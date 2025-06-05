import { createTheme } from '@mui/material/styles';

const sunsetTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ff7043' },
    secondary: { main: '#ffd54f' },
    background: { default: '#fff3e0', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default sunsetTheme;
