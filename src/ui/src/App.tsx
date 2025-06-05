import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, InputBase, Menu, MenuItem, Avatar, Box, Button, Tooltip, ThemeProvider, CssBaseline } from '@mui/material';
import { Brightness4, Brightness7, Search, AccountCircle, Settings, Logout, Info } from '@mui/icons-material';
import logo from './logo.svg';
import './App.css';
import UserSettings from './UserSettings';
import classicTheme from './themes/classicTheme';
import oceanTheme from './themes/oceanTheme';
import sunsetTheme from './themes/sunsetTheme';
import forestTheme from './themes/forestTheme';
import darkTheme from './themes/darkTheme';
import modernMinimalTheme from './themes/modernMinimalTheme';

const themeMap: any = {
  classic: classicTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  forest: forestTheme,
  dark: darkTheme,
  modernMinimal: modernMinimalTheme
};

// Placeholder pages
function Dashboard() { return <div>Dashboard Page</div>; }
function Browse() { return <div>Browse Page</div>; }
function Library() { return <div>Library Page</div>; }

function SettingsPage() {
  const [settings, setSettings] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userSettings') || '') || {
        theme: 'classic',
        language: 'en',
        highContrast: false,
        fontScale: 1,
        caching: false,
      };
    } catch {
      return {
        theme: 'classic',
        language: 'en',
        highContrast: false,
        fontScale: 1,
        caching: false,
      };
    }
  });
  React.useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    // Optionally trigger a reload to apply theme/font changes globally
    // window.location.reload();
  }, [settings]);
  return <UserSettings settings={settings} onChange={setSettings} />;
}

function ProfilePage() { return <div>Profile Page</div>; }

// Navigation bar component with active highlighting
function NavBar() {
  const location = useLocation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
        <img src={logo} alt="MeloAmp Logo" style={{ height: 40, marginRight: 12 }} />
        <Typography variant="h6" noWrap>MeloAmp</Typography>
      </Link>
      <Box sx={{ ml: 4, display: 'flex', gap: 2 }}>
        <Button color={location.pathname === '/' ? 'primary' : 'inherit'} component={Link} to="/">Dashboard</Button>
        <Button color={location.pathname === '/browse' ? 'primary' : 'inherit'} component={Link} to="/browse">Browse</Button>
        <Button color={location.pathname === '/library' ? 'primary' : 'inherit'} component={Link} to="/library">Library</Button>
      </Box>
    </Box>
  );
}

export default function App() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>('light');
  const toggleTheme = () => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  // Simulated user data
  const user = { name: 'User', avatar: '', version: 'v0.1.0', apiVersion: 'v1.0.0' };

  const [settings, setSettings] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userSettings') || '') || {
        theme: 'classic',
        language: 'en',
        highContrast: false,
        fontScale: 1,
        caching: false,
      };
    } catch {
      return {
        theme: 'classic',
        language: 'en',
        highContrast: false,
        fontScale: 1,
        caching: false,
      };
    }
  });
  React.useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);
  const theme = themeMap[settings.theme] || classicTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <NavBar />
            {/* Right: Search, Theme, User */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative', mr: 2 }}>
                <InputBase
                  placeholder="Search…"
                  inputProps={{ 'aria-label': 'search' }}
                  startAdornment={<Search sx={{ mr: 1 }} />}
                  sx={{
                    color: 'inherit',
                    background: '#f1f1f1',
                    borderRadius: 1,
                    pl: 1,
                    pr: 1,
                    height: 36,
                    width: 180,
                  }}
                />
              </Box>
              <Tooltip title={`Switch to ${settings.theme === 'dark' ? 'classic' : 'dark'} mode`}>
                <IconButton color="inherit" onClick={() => setSettings((s: any) => ({ ...s, theme: s.theme === 'dark' ? 'classic' : 'dark' }))} aria-label="toggle theme">
                  {settings.theme === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
              <IconButton color="inherit" onClick={handleMenu} aria-label="user menu" sx={{ ml: 1 }}>
                <Avatar alt={user.name} src={user.avatar} />
                <Typography variant="body2" sx={{ ml: 1 }}>{user.name}</Typography>
              </IconButton>
              <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem component={Link} to="/settings" onClick={handleClose}><Settings sx={{ mr: 1 }} />Settings</MenuItem>
                <MenuItem component={Link} to="/profile" onClick={handleClose}><AccountCircle sx={{ mr: 1 }} />Profile</MenuItem>
                <MenuItem onClick={handleClose}><Logout sx={{ mr: 1 }} />Log out</MenuItem>
                <MenuItem disabled><Info sx={{ mr: 1 }} />MeloAmp {user.version}</MenuItem>
                <MenuItem disabled><Info sx={{ mr: 1 }} />API {user.apiVersion}</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<UserSettings settings={settings} onChange={setSettings} />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}
