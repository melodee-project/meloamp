import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, InputBase, Box, Tooltip, ThemeProvider, CssBaseline, CircularProgress } from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Search,
  QueueMusic,
  Menu as MenuIcon,
} from '@mui/icons-material';
import logo from './logo.svg';
import './App.css';
import Badge from '@mui/material/Badge';
import UserSettingsPage from './pages/UserSettings';
import LoginPage from './pages/LoginPage';
import { apiRequest, unwrapApiResponse } from './api';
import BrowseAlbums from './pages/BrowseAlbums';
import PlaylistManager from './pages/PlaylistManager';
import BrowseArtists from './pages/BrowseArtists';
import BrowseSongs from './pages/BrowseSongs';
import SearchPage from './pages/SearchPage';
import Player from './pages/Player';
import QueueView from './pages/QueueView';
import DashboardWrapper from './pages/Dashboard';
import ArtistDetailView from './detailViews/ArtistDetailView';
import AlbumDetailView from './detailViews/AlbumDetailView';
import PlaylistDetailView from './detailViews/PlaylistDetailView';
import SongDetailView from './detailViews/SongDetailView';
import FavoritesPage from './pages/FavoritesPage';
import GenresPage from './pages/GenresPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ChartsPage from './pages/ChartsPage';
import SmartPlaylistsPage from './pages/SmartPlaylistsPage';
import HistoryPage from './pages/HistoryPage';
import EqualizerPage from './pages/EqualizerPage';
import LocalThemeGallery from './pages/LocalThemeGallery';
import SharesPage from './pages/SharesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SearchAdvancedPage from './pages/SearchAdvancedPage';
import RequestsPage from './pages/RequestsPage';
import PlaybackToolsPage from './pages/PlaybackToolsPage';
import ArtistLookupPage from './pages/ArtistLookupPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PublicSharePage from './pages/PublicSharePage';
import { useTranslation } from 'react-i18next';
import CommandPalette, { useDefaultCommands } from './components/CommandPalette';
import { KeyboardShortcut, useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useApiEffect } from './hooks/useApiEffect';
import { useQueueStore } from './queueStore';
import Sidebar from './components/Sidebar';
import { User } from './apiModels';
import ErrorBoundary from './components/ErrorBoundary';
import { UserSettings } from './types/settings';
import { readUser, writeUser } from './storage';
import { readUserSettings, subscribeToUserSettings, updateUserSettings } from './settings';
import { getHighContrastTheme, resolveThemedTheme } from './themes/registry';
import { getErrorStatus } from './utils/errors';
import i18n from './i18n';

function Albums() { return <BrowseAlbums />; }
function Playlists() { return <PlaylistManager />; }
function Artists() { return <BrowseArtists />; }
function Songs() { return <BrowseSongs />; }
function Queue() { return <QueueView />; }

export default function App() {
  const [settings, setSettings] = React.useState<UserSettings>(readUserSettings);

  // Keep this component in sync with settings written by other subsystems
  // (queue store, equalizer, i18n) without ever overwriting their keys.
  React.useEffect(() => subscribeToUserSettings(setSettings), []);

  React.useEffect(() => {
    if (i18n.language !== settings.language) {
      void i18n.changeLanguage(settings.language);
    }
  }, [settings.language]);

  const applySettings = React.useCallback((next: UserSettings) => {
    setSettings(updateUserSettings(next));
  }, []);

  const theme = React.useMemo(() => {
    const base = resolveThemedTheme(settings.theme, settings.mode);
    return settings.highContrast ? getHighContrastTheme(base) : base;
  }, [settings.theme, settings.mode, settings.highContrast]);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent settings={settings} onSettingsChange={applySettings} />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

interface AppContentProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

function AppContent({ settings, onSettingsChange }: AppContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => !!localStorage.getItem('jwt'));
  const [user, setUser] = React.useState<User | null>(() => (readUser() as User | null) ?? null);
  const [searchValue, setSearchValue] = React.useState('');
  const [searchLoading, setSearchLoading] = React.useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [searchParams] = useSearchParams();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Subscribe to the slice of queue state the shell actually needs so that
  // queue mutations do not re-render the whole application tree.
  const queueLength = useQueueStore((state) => state.queue.length);
  const unplayedCount = useQueueStore(
    (state) => state.queue.reduce((count, song) => (song.played ? count : count + 1), 0),
  );

  const { t } = useTranslation();

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

  React.useEffect(() => {
    const handlePlayerState = (event: Event) => {
      const detail = (event as CustomEvent<{ playing?: boolean }>).detail;
      if (detail && typeof detail.playing === 'boolean') {
        setIsPlaying(detail.playing);
      }
    };
    window.addEventListener('meloamp-player-state', handlePlayerState);
    return () => window.removeEventListener('meloamp-player-state', handlePlayerState);
  }, []);

  const commands = useDefaultCommands({
    onTogglePlay: handleTogglePlay,
    onNextTrack: handleNextTrack,
    onPrevTrack: handlePrevTrack,
    onOpenSearch: handleOpenSearch,
    onOpenQueue: handleOpenQueue,
    isPlaying,
  });

  const shortcuts = React.useMemo<KeyboardShortcut[]>(() => [
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
  ], [t, handleOpenSearch, handleTogglePlay, handleNextTrack, handlePrevTrack, handleOpenQueue, navigate, commandPaletteOpen]);

  useKeyboardShortcuts(shortcuts, { enabled: isAuthenticated });

  React.useEffect(() => {
    if (location.pathname === '/search') {
      const urlQuery = searchParams.get('q') || '';
      if (urlQuery !== searchValue) {
        setSearchValue(urlQuery);
      }
    }
  }, [location.pathname, searchParams, searchValue]);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--meloamp-font-scale', String(settings.fontScale || 1));
  }, [settings.fontScale]);

  React.useEffect(() => {
    const checkAuth = () => {
      if (!localStorage.getItem('jwt')) setIsAuthenticated(false);
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  React.useEffect(() => () => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  }, []);

  useApiEffect(async (signal) => {
    const storedUser = readUser() as User | null;
    const jwt = localStorage.getItem('jwt');

    if (!jwt) {
      setUser(storedUser);
      return;
    }

    try {
      const response = await apiRequest<User>('/user/me', { signal });
      const userFromApi = unwrapApiResponse<User>(response.data);
      if (userFromApi) {
        writeUser(userFromApi);
        setUser(userFromApi);
        return;
      }
    } catch (error) {
      if (getErrorStatus(error) !== 401 && storedUser) {
        setUser(storedUser);
        return;
      }
      console.error('Failed to fetch user profile', error);
    }

    setUser(storedUser);
  }, [isAuthenticated]);

  const isPublicShareRoute = location.pathname.startsWith('/shares/public/');

  if (!isAuthenticated && !isPublicShareRoute) {
    return (
      <LoginPage
        onLogin={() => {
          setIsAuthenticated(true);
          const persisted = readUser() as User | null;
          if (persisted) setUser(persisted);
        }}
      />
    );
  }

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    setSearchLoading(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const query = event.target.value.trim();
      if (query) {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      } else if (location.pathname === '/search') {
        navigate('/search');
      }
      setSearchLoading(false);
    }, 200);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      const query = searchValue.trim();
      navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
      setSearchLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar
            position="static"
            color="default"
            elevation={1}
            sx={{ backgroundColor: (theme) => theme.palette.background.paper, color: (theme) => theme.palette.text.primary }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                edge="start"
                sx={{ mr: 2 }}
                aria-label={t('nav.toggleSidebar', 'Toggle navigation')}
              >
                <MenuIcon />
              </IconButton>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                <img src={logo} alt="MeloAmp Logo" style={{ height: 32, marginRight: 8 }} />
                <Typography variant="h6" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>MeloAmp</Typography>
              </Link>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <InputBase
                    placeholder={t('search.placeholder')}
                    inputProps={{ 'aria-label': t('search.placeholder') }}
                    startAdornment={<Search sx={{ mr: 1 }} />}
                    sx={{
                      color: (theme) => theme.palette.text.primary,
                      background: (theme) => theme.palette.background.paper,
                      borderRadius: 1,
                      pl: 1,
                      pr: 1,
                      height: 36,
                      width: { xs: 180, sm: 280 },
                      border: (theme) => `1.5px solid ${theme.palette.divider}`,
                      boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 0 0 1px #333' : '0 0 0 1px #ccc'),
                      'input::placeholder': {
                        color: (theme) => theme.palette.text.secondary,
                        opacity: 1,
                      },
                    }}
                    value={searchValue}
                    onChange={handleSearchInput}
                    onKeyDown={handleSearchKeyDown}
                    inputRef={searchInputRef}
                  />
                  {searchLoading && (
                    <CircularProgress
                      size={20}
                      sx={{ position: 'absolute', right: 1, top: '50%', transform: 'translateY(-50%)' }}
                    />
                  )}
                </Box>
                <Tooltip title={t('settings.toggleMode', 'Toggle light/dark mode')}>
                  <IconButton
                    color="inherit"
                    onClick={() => onSettingsChange({ ...settings, mode: settings.mode === 'dark' ? 'light' : 'dark' })}
                    aria-label={t('settings.toggleMode', 'Toggle light/dark mode')}
                  >
                    {settings.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('nav.queue')}>
                  <Badge badgeContent={unplayedCount} color="primary">
                    <IconButton color="inherit" component={Link} to="/queue" aria-label={t('nav.queue')}>
                      <QueueMusic />
                    </IconButton>
                  </Badge>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{ p: 3, pb: queueLength > 0 ? 12 : 3, flex: 1, overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<DashboardWrapper />} />
              <Route path="/dashboard" element={<DashboardWrapper />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/songs" element={<Songs />} />
              <Route path="/search" element={<SearchPage query={searchValue} />} />
              <Route path="/settings" element={<UserSettingsPage settings={settings} onChange={onSettingsChange} />} />
              <Route path="/queue" element={<Queue />} />
              <Route path="/artists/:id" element={<ArtistDetailView />} />
              <Route path="/albums/:id" element={<AlbumDetailView />} />
              <Route path="/playlists/:id" element={<PlaylistDetailView />} />
              <Route path="/songs/:id" element={<SongDetailView />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/genres" element={<GenresPage />} />
              <Route path="/genres/:genreId" element={<GenresPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/smart-playlists" element={<SmartPlaylistsPage />} />
              <Route path="/search-advanced" element={<SearchAdvancedPage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/requests/:requestApiKey" element={<RequestsPage />} />
              <Route path="/playback-tools" element={<PlaybackToolsPage />} />
              <Route path="/artist-lookup" element={<ArtistLookupPage />} />
              {user?.isAdmin && <Route path="/admin/users" element={<AdminUsersPage />} />}
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/equalizer" element={<EqualizerPage />} />
              <Route path="/themes" element={<LocalThemeGallery settings={settings} onChange={onSettingsChange} />} />
              <Route path="/shares" element={<SharesPage />} />
              <Route path="/shares/public/:shareUniqueId" element={<PublicSharePage />} />
            </Routes>
          </Box>
        </Box>
      </Box>
      {queueLength > 0 && <Player sidebarOpen={sidebarOpen} />}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
      />
    </>
  );
}
