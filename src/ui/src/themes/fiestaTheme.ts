import { createTheme } from '@mui/material/styles';

const fiestaTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ff9800' }, // Orange
    secondary: { main: '#e91e63' }, // Pink
    error: { main: '#d50000' },
    warning: { main: '#ffd600' },
    info: { main: '#00bcd4' },
    success: { main: '#76ff03' },
    background: { default: '#fffde7', paper: '#fff8e1' },
  },
  typography: {
    fontFamily: 'Chewy, "Comic Sans MS", cursive, fantasy',
  },
  shape: {
    borderRadius: 30,
  },
});

export default fiestaTheme;
