import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Album as AlbumIcon,
  Person as ArtistIcon,
  MusicNote as SongIcon,
  PlaylistPlay as PlaylistIcon,
  Category as GenreIcon,
  Favorite as FavoriteIcon,
  ExpandLess,
  ExpandMore,
  Lightbulb as RecommendationsIcon,
  BarChart as ChartsIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  SmartToy as SmartPlaylistIcon,
  History as HistoryIcon,
  Equalizer as EqualizerIcon,
  Palette as ThemeIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { clearJwt } from '../api';

interface SidebarProps {
  user: any;
  isOpen: boolean;
  onToggle: () => void;
  onThemeToggle: () => void;
  themeMode: 'light' | 'dark';
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const DRAWER_WIDTH = 240;

export default function Sidebar({ user, isOpen, onToggle, onThemeToggle, themeMode }: SidebarProps) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['browse', 'library', 'discover'])
  );

  const handleLogout = () => {
    clearJwt();
    window.location.href = '/';
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const navSections: NavSection[] = [
    {
      id: 'browse',
      label: t('sidebar.browse', 'Browse'),
      items: [
        { label: t('nav.dashboard', 'Dashboard'), path: '/', icon: <DashboardIcon /> },
        { label: t('nav.albums', 'Albums'), path: '/albums', icon: <AlbumIcon /> },
        { label: t('nav.artists', 'Artists'), path: '/artists', icon: <ArtistIcon /> },
        { label: t('nav.songs', 'Songs'), path: '/songs', icon: <SongIcon /> },
        { label: t('nav.genres', 'Genres'), path: '/genres', icon: <GenreIcon /> },
      ],
    },
    {
      id: 'library',
      label: t('sidebar.library', 'Library'),
      items: [
        { label: t('nav.playlists', 'Playlists'), path: '/playlists', icon: <PlaylistIcon /> },
        { label: t('nav.smartPlaylists', 'Smart Playlists'), path: '/smart-playlists', icon: <SmartPlaylistIcon /> },
        { label: t('nav.myLibrary', 'My Library'), path: '/favorites', icon: <FavoriteIcon /> },
        { label: t('nav.history', 'History'), path: '/history', icon: <HistoryIcon /> },
      ],
    },
    {
      id: 'discover',
      label: t('sidebar.discover', 'Discover'),
      items: [
        { label: t('nav.recommendations', 'Recommendations'), path: '/recommendations', icon: <RecommendationsIcon /> },
        { label: t('nav.charts', 'Charts'), path: '/charts', icon: <ChartsIcon /> },
      ],
    },
    {
      id: 'tools',
      label: t('sidebar.tools', 'Tools'),
      items: [
        { label: t('nav.equalizer', 'Equalizer'), path: '/equalizer', icon: <EqualizerIcon /> },
        { label: t('nav.themes', 'Themes'), path: '/themes', icon: <ThemeIcon /> },
        { label: t('nav.shares', 'Shares'), path: '/shares', icon: <ShareIcon /> },
      ],
    },
  ];

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    return (
      <ListItem key={item.path} disablePadding sx={{ pl: 1 }}>
        <ListItemButton
          component={Link}
          to={item.path}
          selected={isActive}
          onClick={() => isMobile && onToggle()}
          sx={{
            borderRadius: 1,
            mx: 1,
            '&.Mui-selected': {
              backgroundColor: 'action.selected',
              '&:hover': {
                backgroundColor: 'action.selected',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'inherit' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label} 
            primaryTypographyProps={{ 
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
            }} 
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderSection = (section: NavSection) => {
    const isExpanded = expandedSections.has(section.id);
    return (
      <Box key={section.id}>
        <ListItemButton
          onClick={() => toggleSection(section.id)}
          sx={{ py: 0.5, px: 2 }}
        >
          <ListItemText
            primary={section.label}
            primaryTypographyProps={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          />
          {isExpanded ? (
            <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
          ) : (
            <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} />
          )}
        </ListItemButton>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {section.items.map(renderNavItem)}
          </List>
        </Collapse>
      </Box>
    );
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: 'primary.main',
          }}
          src={user?.thumbnailUrl || user?.imageUrl}
        >
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap fontWeight={600}>
            {user?.username || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
        {isMobile && (
          <IconButton size="small" onClick={onToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      <List sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {navSections.map(renderSection)}
      </List>

      <Divider />

      <List sx={{ py: 0 }}>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/settings"
            onClick={() => isMobile && onToggle()}
            sx={{ borderRadius: 1, mx: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t('nav.settings', 'Settings')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, mx: 1 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary={t('nav.logout', 'Logout')} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={isOpen}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      open={isOpen}
      sx={{
        width: isOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          ...(!isOpen && {
            width: 0,
            overflowX: 'hidden',
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
