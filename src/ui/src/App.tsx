import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, InputBase, Menu, MenuItem, Avatar, Box, Button, Tooltip, ThemeProvider, CssBaseline } from '@mui/material';
import { Brightness4, Brightness7, Search, AccountCircle, Settings, Logout, Info, QueueMusic } from '@mui/icons-material';
import logo from './logo.svg';
import './App.css';
import Badge from '@mui/material/Badge';
import UserSettings from './pages/UserSettings';
import LoginPage from './pages/LoginPage';
import { clearJwt } from './api';
import classicTheme from './themes/classicTheme';
import oceanTheme from './themes/oceanTheme';
import sunsetTheme from './themes/sunsetTheme';
import forestTheme from './themes/forestTheme';
import darkTheme from './themes/darkTheme';
import modernMinimalTheme from './themes/modernMinimalTheme';
import rainbowTheme from './themes/rainbowTheme';
import candyTheme from './themes/candyTheme';
import bubblegumTheme from './themes/bubblegumTheme';
import BrowseAlbums from './pages/BrowseAlbums';
import PlaylistManager from './pages/PlaylistManager';
import BrowseArtists from './pages/BrowseArtists';
import BrowseSongs from './pages/BrowseSongs';
import SearchPage from './pages/SearchPage';
import Player from './pages/Player';
import QueueView from './pages/QueueView';
import '../src/pages/QueueView.css';
import { useQueueStore } from './queueStore';
import DashboardWrapper from './pages/Dashboard';
import ArtistDetailView from './detailViews/ArtistDetailView';
import AlbumDetailView from './detailViews/AlbumDetailView';
import PlaylistDetailView from './detailViews/PlaylistDetailView';
import getAuroraTheme from './themes/auroraTheme';
import getMonoContrastTheme from './themes/monoContrastTheme';
import getBerryTwilightTheme from './themes/berryTwilightTheme';
import retroWaveTheme from './themes/retroWaveTheme';
import spaceFunkTheme from './themes/spaceFunkTheme';
import acidPopTheme from './themes/acidPopTheme';
import fiestaTheme from './themes/fiestaTheme';
import scarlettTheme from './themes/scarlettTheme';
import winAmpTheme from './themes/winAmpTheme';
import { useTranslation } from 'react-i18next';
import { createTheme } from '@mui/material/styles';

const themeMap: any = {
  classic: classicTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  forest: forestTheme,
  dark: darkTheme,
  modernMinimal: modernMinimalTheme,
  rainbow: rainbowTheme,
  candy: candyTheme,
  bubblegum: bubblegumTheme,
  aurora: (mode: 'light' | 'dark') => getAuroraTheme(mode),
  monoContrast: (mode: 'light' | 'dark') => getMonoContrastTheme(mode),
  berryTwilight: (mode: 'light' | 'dark') => getBerryTwilightTheme(mode),
  retroWave: retroWaveTheme,
  spaceFunk: spaceFunkTheme,
  acidPop: acidPopTheme,
  fiesta: fiestaTheme,
  scarlett: scarlettTheme,
  winAmp: winAmpTheme,
};

// Removed unused Dashboard function

function Albums() { return <BrowseAlbums />; }
function Playlists() { return <PlaylistManager />; }
function Artists() { return <BrowseArtists />; }
function Songs() { return <BrowseSongs />; }
function Queue() { return <QueueView />; }

function ProfilePage() { return <div>Profile Page</div>; }

// Navigation bar component with active highlighting
function NavBar({ user }: { user: any }) {
  const location = useLocation();
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
        <img src={logo} alt="MeloAmp Logo" style={{ height: 40, marginRight: 12 }} />
        <Typography variant="h6" noWrap>MeloAmp</Typography>
      </Link>
      <Box sx={{ ml: 4, display: 'flex', gap: 2 }}>
        <Button color={location.pathname === '/' ? 'primary' : 'inherit'} component={Link} to="/">{t('nav.dashboard')}</Button>
        <Button color={location.pathname === '/artists' ? 'primary' : 'inherit'} component={Link} to="/artists">{t('nav.artists')}</Button>
        <Button color={location.pathname === '/albums' ? 'primary' : 'inherit'} component={Link} to="/albums">{t('nav.albums')}</Button>
        <Button color={location.pathname === '/playlists' ? 'primary' : 'inherit'} component={Link} to="/playlists">{t('nav.playlists')}</Button>
        <Button color={location.pathname === '/songs' ? 'primary' : 'inherit'} component={Link} to="/songs">{t('nav.songs')}</Button>        
      </Box>
    </Box>
  );
}

export default function App() {
  // Move theme logic here so <ThemeProvider> wraps AppContent, which uses router hooks
  const [settings, setSettings] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userSettings') || '') || {
        theme: 'classic',
        language: 'en',
        highContrast: false,
        fontScale: 1,
        caching: false,
        mode: 'light',
      };
    } catch {
      return {
        theme: 'classic',
        language: 'en',
        highContrast: false,
        fontScale: 1,
        caching: false,
        mode: 'light',
      };
    }
  });
  const baseTheme = typeof themeMap[settings.theme] === 'function'
    ? themeMap[settings.theme](settings.mode || 'light')
    : themeMap[settings.theme] || classicTheme;
  function getHighContrastTheme(baseTheme: any) {
    return createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        background: { default: '#000', paper: '#111' },
        text: { primary: '#fff', secondary: '#ff0' },
        primary: { main: '#fff', contrastText: '#000' },
        secondary: { main: '#ff0', contrastText: '#000' },
        divider: '#fff',
        error: { main: '#ff1744' },
        warning: { main: '#ffd600' },
        info: { main: '#00eaff' },
        success: { main: '#76ff03' },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              color: '#000',
              backgroundColor: '#fff',
              border: '2px solid #ff0',
              fontWeight: 700,
            },
          },
        },
      },
    });
  }
  const theme = React.useMemo(() => (
    settings.highContrast ? getHighContrastTheme(baseTheme) : baseTheme
  ), [settings.highContrast, baseTheme]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent settings={settings} setSettings={setSettings} />
      </Router>
    </ThemeProvider>
  );
}

function AppContent({ settings, setSettings }: { settings: any, setSettings: (s: any) => void }) {
  // Move all hooks and logic here
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => !!localStorage.getItem('jwt'));
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [searchValue, setSearchValue] = React.useState('');
  const [searchActive, setSearchActive] = React.useState(false);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);
  const baseTheme = typeof themeMap[settings.theme] === 'function'
    ? themeMap[settings.theme](settings.mode || 'light')
    : themeMap[settings.theme] || classicTheme;

  React.useEffect(() => {
    document.documentElement.style.setProperty('--meloamp-font-scale', String(settings.fontScale || 1));
  }, [settings.fontScale]);

  React.useEffect(() => {
    const checkAuth = () => {
      if (!localStorage.getItem('jwt')) {
        setIsAuthenticated(false);
      }
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Always load user from sessionStorage on mount and when authentication changes
  React.useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
        setUser(storedUser);
      } catch {
        setUser(null);
      }
    };
    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [isAuthenticated]);

  // Replace local user variable with state
  const apiVersion = localStorage.getItem('apiVersion') || '';

  const queue = useQueueStore((state: any) => state.queue);
  const current = useQueueStore((state: any) => state.current);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {
      setIsAuthenticated(true);
      // Update user state after login
      try {
        setUser(JSON.parse(sessionStorage.getItem('user') || 'null'));
      } catch {
        setUser(null);
      }
    }} />;
  }

  // Update user state on logout
  const handleLogout = () => {
    clearJwt();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setSearchLoading(true);
    setSearchActive(false);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      // If not already on /search, navigate there
      if (location.pathname !== '/search') {
        navigate('/search');
      }
      setSearchActive(true);
      setSearchLoading(false);
    }, 200);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      setSearchActive(true);
      setSearchLoading(false);
    }
  };

  return (
    <>
      <AppBar
        position="static"
        color="default"
        elevation={1}
        sx={{ backgroundColor: theme => theme.palette.background.paper, color: theme => theme.palette.text.primary }}
      >
        <Toolbar>
          <NavBar user={user} />
          {/* Right: Search, Theme, User */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative', mr: 2 }}>
              <InputBase
                placeholder={t('search.placeholder')}
                inputProps={{ 'aria-label': 'search', sx: { '::placeholder': { color: 'text.secondary', opacity: 1 } } }}
                startAdornment={<Search sx={{ mr: 1 }} />}
                sx={{
                  color: theme => theme.palette.text.primary,
                  background: theme => theme.palette.background.paper,
                  borderRadius: 1,
                  pl: 1,
                  pr: 1,
                  height: 36,
                  width: 280,
                  border: theme => `1.5px solid ${theme.palette.divider}`,
                  boxShadow: theme => theme.palette.mode === 'dark' ? '0 0 0 1px #333' : '0 0 0 1px #ccc',
                  'input::placeholder': {
                    color: theme => theme.palette.text.secondary,
                    opacity: 1,
                  },
                }}
                value={searchValue}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
              />
              {searchLoading && (
                <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                  <span className="MuiCircularProgress-root MuiCircularProgress-colorPrimary MuiCircularProgress-indeterminate" style={{ width: 20, height: 20 }}>
                    <svg className="MuiCircularProgress-svg" viewBox="22 22 44 44"><circle className="MuiCircularProgress-circle" cx="44" cy="44" r="20.2" fill="none" strokeWidth="3.6" /></svg>
                  </span>
                </Box>
              )}
            </Box>
            <Tooltip title={`Switch to ${settings.mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton color="inherit" onClick={() => setSettings((s: any) => ({ ...s, mode: s.mode === 'dark' ? 'light' : 'dark' }))} aria-label="toggle mode">
                {settings.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
            {/* Queue Icon Button */}
            <Tooltip title={t('nav.queue')}>
              <Badge badgeContent={queue.filter((song: any) => !song.played).length} color="primary">
                <IconButton color="inherit" component={Link} to="/queue" aria-label="queue" sx={{ ml: 0.5 }}>
                  <QueueMusic />
                </IconButton>
              </Badge>
            </Tooltip>
            <IconButton color="inherit" onClick={handleMenu} aria-label="user menu" sx={{ ml: 0.5 }}>
              <Avatar alt={user?.username || user?.name || ''} src={user?.thumbnailUrl || user?.imageUrl || ''} />
              <Typography variant="body2" sx={{ ml: 1 }}>{user?.username || user?.name || ''}</Typography>
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem component={Link} to="/settings" onClick={handleClose}><Settings sx={{ mr: 1 }} />{t('nav.settings')}</MenuItem>
              <MenuItem component={Link} to="/profile" onClick={handleClose}><AccountCircle sx={{ mr: 1 }} />{t('nav.profile')}</MenuItem>
              <MenuItem onClick={() => { handleClose(); handleLogout(); }}><Logout sx={{ mr: 1 }} />{t('nav.logout')}</MenuItem>
              <MenuItem divider disabled style={{ margin: '4px 0', padding: 0, minHeight: 0, height: 0, background: 'transparent' }}>
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', width: '100%' }} />
              </MenuItem>
              <MenuItem disabled><Info sx={{ mr: 1 }} />MeloAmp {user?.version || 'v0.1.0'}</MenuItem>
              <MenuItem disabled><Info sx={{ mr: 1 }} />API v{apiVersion}</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3, pb: queue.length > 0 ? 10 : 3 }}>
        {searchActive ? (
          <SearchPage query={searchValue} onClose={() => setSearchActive(false)} />
        ) : (
          <Routes>
            <Route path="/" element={<DashboardWrapper />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/albums" element={<Albums />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/songs" element={<Songs />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<UserSettings settings={settings} onChange={setSettings} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/artists/:id" element={<ArtistDetailView />} />
            <Route path="/albums/:id" element={<AlbumDetailView />} />
            <Route path="/playlists/:id" element={<PlaylistDetailView />} />
          </Routes>
        )}
      </Box>
      {/* Sticky Player at bottom if queue is not empty */}
      {queue.length > 0 && (
        <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
          <Player src={queue[current]?.url || ''} />
        </Box>
      )}
    </>
  );
}
