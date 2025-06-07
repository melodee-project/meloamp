import { createTheme } from '@mui/material/styles';

const acidPopTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#39ff14' }, // Acid green
    secondary: { main: '#ff073a' }, // Vivid red
    error: { main: '#ff1744' },
    warning: { main: '#ffe066' },
    info: { main: '#00eaff' },
    success: { main: '#faff00' },
    background: { default: '#fffbe7', paper: '#fff0f6' },
  },
  typography: {
    fontFamily: 'Bangers, "Comic Sans MS", cursive, fantasy',
  },
  shape: {
    borderRadius: 8,
  },
});

export default acidPopTheme;
