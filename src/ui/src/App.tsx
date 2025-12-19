import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, InputBase, Menu, MenuItem, Avatar, Box, Button, Tooltip, ThemeProvider, CssBaseline } from '@mui/material';
import { Brightness4, Brightness7, Search, AccountCircle, Settings, Logout, Info, QueueMusic, Dns } from '@mui/icons-material';
import logo from './logo.svg';
import './App.css';
import Badge from '@mui/material/Badge';
import UserSettings from './pages/UserSettings';
import LoginPage from './pages/LoginPage';
import { clearJwt, apiRequest } from './api';
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
import SongDetailView from './detailViews/SongDetailView';
import FavoritesPage from './pages/FavoritesPage';
import GenresPage from './pages/GenresPage';
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
import CommandPalette, { useDefaultCommands } from './components/CommandPalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

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
      <Box sx={{ ml: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button color={location.pathname === '/' ? 'primary' : 'inherit'} component={Link} to="/">{t('nav.dashboard')}</Button>
        <Button color={location.pathname === '/artists' ? 'primary' : 'inherit'} component={Link} to="/artists">{t('nav.artists')}</Button>
        <Button color={location.pathname === '/albums' ? 'primary' : 'inherit'} component={Link} to="/albums">{t('nav.albums')}</Button>
        <Button color={location.pathname === '/playlists' ? 'primary' : 'inherit'} component={Link} to="/playlists">{t('nav.playlists')}</Button>
        <Button color={location.pathname === '/songs' ? 'primary' : 'inherit'} component={Link} to="/songs">{t('nav.songs')}</Button>
        <Button color={location.pathname.startsWith('/genres') ? 'primary' : 'inherit'} component={Link} to="/genres">{t('nav.genres', 'Genres')}</Button>
        <Button color={location.pathname === '/favorites' ? 'primary' : 'inherit'} component={Link} to="/favorites">{t('nav.favorites', 'Favorites')}</Button>
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
  
  // Apply mode override to static themes that don't accept mode parameter
  const themedWithMode = React.useMemo(() => {
    const mode = settings.mode || 'light';
    // If theme is already a function (mode-aware), it's handled above
    if (typeof themeMap[settings.theme] === 'function') {
      return baseTheme;
    }
    // For static themes, create a new theme with mode override
    return createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        mode,
        // Adjust background colors based on mode
        background: mode === 'dark' 
          ? { default: '#121212', paper: '#1e1e1e' }
          : baseTheme.palette.background,
        text: mode === 'dark'
          ? { primary: '#ffffff', secondary: 'rgba(255,255,255,0.7)' }
          : baseTheme.palette.text,
      },
    });
  }, [baseTheme, settings.theme, settings.mode]);
  
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
    settings.highContrast ? getHighContrastTheme(themedWithMode) : themedWithMode
  ), [settings.highContrast, themedWithMode]);
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
      // Try localStorage first (persists across Electron app restarts)
      const persistedUser = localStorage.getItem('user');
      if (persistedUser) return JSON.parse(persistedUser);
      // Fallback to sessionStorage for backward compatibility
      return JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [searchValue, setSearchValue] = React.useState('');
  const [searchLoading, setSearchLoading] = React.useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [searchParams] = useSearchParams();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const { t } = useTranslation();

  // Playback control callbacks for command palette and shortcuts
  const handleTogglePlay = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('meloamp-toggle-play'));
  }, []);

  const handleNextTrack = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('meloamp-next-track'));
  }, []);

  const handlePrevTrack = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('meloamp-prev-track'));
  }, []);

  const handleOpenSearch = React.useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleOpenQueue = React.useCallback(() => {
    navigate('/queue');
  }, [navigate]);

  // Listen for player state updates
  React.useEffect(() => {
    const handlePlayerState = (e: CustomEvent) => {
      if (e.detail && typeof e.detail.playing === 'boolean') {
        setIsPlaying(e.detail.playing);
      }
    };
    window.addEventListener('meloamp-player-state', handlePlayerState as EventListener);
    return () => window.removeEventListener('meloamp-player-state', handlePlayerState as EventListener);
  }, []);

  // Get default commands for the command palette
  const commands = useDefaultCommands({
    onTogglePlay: handleTogglePlay,
    onNextTrack: handleNextTrack,
    onPrevTrack: handlePrevTrack,
    onOpenSearch: handleOpenSearch,
    onOpenQueue: handleOpenQueue,
    isPlaying,
  });

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'ctrl+k',
      description: t('shortcuts.focusSearch', 'Focus search'),
      action: handleOpenSearch,
      category: 'navigation',
    },
    {
      key: 'ctrl+shift+p',
      description: t('shortcuts.openCommandPalette', 'Open command palette'),
      action: () => setCommandPaletteOpen(true),
      category: 'general',
    },
    {
      key: 'space',
      description: t('shortcuts.playPause', 'Play/Pause'),
      action: handleTogglePlay,
      category: 'playback',
    },
    {
      key: 'ctrl+ArrowRight',
      description: t('shortcuts.nextTrack', 'Next track'),
      action: handleNextTrack,
      category: 'playback',
    },
    {
      key: 'ctrl+ArrowLeft',
      description: t('shortcuts.prevTrack', 'Previous track'),
      action: handlePrevTrack,
      category: 'playback',
    },
    {
      key: 'ctrl+q',
      description: t('shortcuts.goToQueue', 'Go to queue'),
      action: handleOpenQueue,
      category: 'navigation',
    },
    {
      key: 'ctrl+,',
      description: t('shortcuts.goToSettings', 'Go to settings'),
      action: () => navigate('/settings'),
      category: 'navigation',
    },
    {
      key: 'Escape',
      description: t('commandPalette.close', 'Close'),
      action: () => setCommandPaletteOpen(false),
      enabled: commandPaletteOpen,
      category: 'general',
    },
  ], { enabled: isAuthenticated });

  // Sync search value from URL when navigating to /search with ?q= parameter
  React.useEffect(() => {
    if (location.pathname === '/search') {
      const urlQuery = searchParams.get('q') || '';
      if (urlQuery !== searchValue) {
        setSearchValue(urlQuery);
      }
    }
  }, [location.pathname, searchParams]);

  React.useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

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

  // Always load user from storage on mount and when authentication changes
  // Also validates the JWT token is still valid by fetching user profile
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        // First check localStorage (persistent across Electron restarts)
        let storedUser = null;
        try {
          storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch {}
        
        // Fallback to sessionStorage
        if (!storedUser) {
          try {
            storedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
          } catch {}
        }
        
        // If there's a JWT, validate it by fetching the user profile
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
          try {
            const res: any = await apiRequest('/users/me');
            const userFromApi = res && res.data ? res.data : null;
            if (userFromApi) {
              // Token is valid, update stored user data
              localStorage.setItem('user', JSON.stringify(userFromApi));
              sessionStorage.setItem('user', JSON.stringify(userFromApi));
              setUser(userFromApi);
              return;
            }
          } catch (e: any) {
            // If 401, token is expired - this will be handled by axios interceptor
            // For other errors, use cached user if available
            if (e?.response?.status !== 401 && storedUser) {
              setUser(storedUser);
              return;
            }
            console.error('Failed to fetch user profile', e);
          }
        }
        
        // Use cached user if available and no JWT validation needed
        if (storedUser && !jwt) {
          setUser(storedUser);
          return;
        }
        
        setUser(null);
      } catch {
        setUser(null);
      }
    };
    loadUser();
    const storageHandler = () => { loadUser(); };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [isAuthenticated]);

  // Replace local user variable with state
  const apiVersion = localStorage.getItem('apiVersion') || '';

  const queue = useQueueStore((state: any) => state.queue);
  const current = useQueueStore((state: any) => state.current);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {
      setIsAuthenticated(true);
      // Update user state after login (check localStorage first, then sessionStorage)
      try {
        const persistedUser = localStorage.getItem('user');
        if (persistedUser) {
          setUser(JSON.parse(persistedUser));
        } else {
          setUser(JSON.parse(sessionStorage.getItem('user') || 'null'));
        }
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
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      // Navigate with query param
      const query = e.target.value.trim();
      if (query) {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      } else if (location.pathname === '/search') {
        navigate('/search');
      }
      setSearchLoading(false);
    }, 200);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      const query = searchValue.trim();
      if (query) {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      } else {
        navigate('/search');
      }
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
                inputRef={searchInputRef}
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
            <IconButton
                color="inherit"
                onClick={handleMenu}
                aria-label="user menu"
                sx={{ ml: 0.5, borderRadius: 1 }} // Less rounded
            >
              <Avatar
                  alt={user?.username || user?.name || ''}
                  src={user?.thumbnailUrl || user?.imageUrl || ''}
                  sx={{ borderRadius: 1, width: 32, height: 32 }} // Square avatar
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {user?.username || user?.name || ''}
              </Typography>
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem component={Link} to="/settings" onClick={handleClose}><Settings sx={{ mr: 1 }} />{t('nav.settings')}</MenuItem>
              <MenuItem onClick={() => { handleClose(); handleLogout(); }}><Logout sx={{ mr: 1 }} />{t('nav.logout')}</MenuItem>
              <MenuItem divider disabled style={{ margin: '4px 0', padding: 0, minHeight: 0, height: 0, background: 'transparent' }}>
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', width: '100%' }} />
              </MenuItem>
              <MenuItem disabled><Dns sx={{ mr: 1 }} />{localStorage.getItem('serverUrl') || 'localhost'}</MenuItem>
              <MenuItem disabled><Info sx={{ mr: 1 }} />MeloAmp {user?.version || 'v0.1.0'}</MenuItem>
              <MenuItem disabled><Info sx={{ mr: 1 }} />API v{apiVersion}</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3, pb: queue.length > 0 ? 10 : 3 }}>
        <Routes>
          <Route path="/" element={<DashboardWrapper />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/search" element={<SearchPage query={searchValue} />} />
          <Route path="/settings" element={<UserSettings settings={settings} onChange={setSettings} />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/artists/:id" element={<ArtistDetailView />} />
            <Route path="/albums/:id" element={<AlbumDetailView />} />
            <Route path="/playlists/:id" element={<PlaylistDetailView />} />
            <Route path="/songs/:id" element={<SongDetailView />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/genres/:genreId" element={<GenresPage />} />
          </Routes>
      </Box>
      {/* Sticky Player at bottom if queue is not empty */}
      {queue.length > 0 && (
        <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
          <Player src={queue[current]?.url || ''} />
        </Box>
      )}
      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
        isPlaying={isPlaying}
      />
    </>
  );
}
