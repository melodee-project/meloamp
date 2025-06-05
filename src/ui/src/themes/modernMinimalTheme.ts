import { createTheme } from '@mui/material/styles';

const modernMinimalTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000'
    },
    secondary: {
      main: '#FFFFFF',
      light: '#FFFFFF',
      dark: '#E0E0E0'
    },
    error: {
      main: '#FF3D00',
      light: '#FF6E40',
      dark: '#DD2C00'
    },
    warning: {
      main: '#FFB300',
      light: '#FFC107',
      dark: '#FF8F00'
    },
    info: {
      main: '#03A9F4',
      light: '#29B6F6',
      dark: '#0288D1'
    },
    success: {
      main: '#00BFA5',
      light: '#1DE9B6',
      dark: '#00897B'
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      active: 'rgba(255, 255, 255, 0.7)',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)'
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121'
    }
  },
  typography: {
    fontFamily: 'Helvetica Now, sans-serif',
    h1: {
      fontWeight: 300
    },
    button: {
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: 0
  },
  transitions: {
    duration: {
      standard: 300
    }
  }
});

export default modernMinimalTheme;