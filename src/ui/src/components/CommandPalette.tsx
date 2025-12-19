import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material';
import {
  Search,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  QueueMusic,
  Home,
  Person,
  Album,
  MusicNote,
  PlaylistPlay,
  Settings,
  Keyboard,
  Favorite,
  Category,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatShortcut } from '../hooks/useKeyboardShortcuts';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category: 'navigation' | 'playback' | 'queue' | 'other';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
  isPlaying?: boolean;
}

/**
 * Command palette component for quick keyboard-driven navigation and actions.
 * Similar to VS Code's command palette (Ctrl+Shift+P) or Spotlight on Mac.
 */
export default function CommandPalette({ 
  open, 
  onClose, 
  commands,
  isPlaying = false,
}: CommandPaletteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter and group commands based on query
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commands;

    return commands.filter(cmd => {
      const searchText = [
        cmd.title,
        cmd.description,
        ...(cmd.keywords || []),
      ].join(' ').toLowerCase();
      
      return searchText.includes(q);
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      playback: [],
      queue: [],
      other: [],
    };

    filteredCommands.forEach(cmd => {
      if (groups[cmd.category]) {
        groups[cmd.category].push(cmd);
      } else {
        groups.other.push(cmd);
      }
    });

    return groups;
  }, [filteredCommands]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const result: CommandItem[] = [];
    ['navigation', 'playback', 'queue', 'other'].forEach(cat => {
      result.push(...groupedCommands[cat]);
    });
    return result;
  }, [groupedCommands]);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatList.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (flatList[selectedIndex]) {
          flatList[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }, [flatList, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const categoryLabels: Record<string, string> = {
    navigation: t('commandPalette.navigation', 'Navigation'),
    playback: t('commandPalette.playback', 'Playback'),
    queue: t('commandPalette.queue', 'Queue'),
    other: t('commandPalette.other', 'Other'),
  };

  const renderCommandGroup = (category: string, items: CommandItem[], startIndex: number) => {
    if (items.length === 0) return null;

    return (
      <React.Fragment key={category}>
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary" fontWeight="medium">
            {categoryLabels[category]}
          </Typography>
        </Box>
        {items.map((cmd, idx) => {
          const globalIndex = startIndex + idx;
          return (
            <ListItem
              key={cmd.id}
              data-index={globalIndex}
              onClick={() => {
                cmd.action();
                onClose();
              }}
              sx={{
                cursor: 'pointer',
                bgcolor: globalIndex === selectedIndex ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: globalIndex === selectedIndex ? 'action.selected' : 'action.hover',
                },
              }}
            >
              {cmd.icon && (
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {cmd.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={cmd.title}
                secondary={cmd.description}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              {cmd.shortcut && (
                <ListItemSecondaryAction>
                  <Chip
                    label={formatShortcut(cmd.shortcut)}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                </ListItemSecondaryAction>
              )}
            </ListItem>
          );
        })}
      </React.Fragment>
    );
  };

  // Calculate start indices for each category
  let currentIndex = 0;
  const categoryStartIndices: Record<string, number> = {};
  ['navigation', 'playback', 'queue', 'other'].forEach(cat => {
    categoryStartIndices[cat] = currentIndex;
    currentIndex += groupedCommands[cat].length;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '15%',
          m: 0,
          maxHeight: '70vh',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder={t('commandPalette.placeholder', 'Type a command or search...')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            sx: {
              '& fieldset': { border: 'none' },
              borderBottom: 1,
              borderColor: 'divider',
              borderRadius: 0,
            },
          }}
          autoFocus
        />
        
        {flatList.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {t('commandPalette.noResults', 'No commands found')}
            </Typography>
          </Box>
        ) : (
          <List ref={listRef} sx={{ py: 0, maxHeight: 400, overflow: 'auto' }}>
            {renderCommandGroup('navigation', groupedCommands.navigation, categoryStartIndices.navigation)}
            {renderCommandGroup('playback', groupedCommands.playback, categoryStartIndices.playback)}
            {renderCommandGroup('queue', groupedCommands.queue, categoryStartIndices.queue)}
            {renderCommandGroup('other', groupedCommands.other, categoryStartIndices.other)}
          </List>
        )}
        
        <Divider />
        <Box sx={{ px: 2, py: 1, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ↑↓ {t('commandPalette.navigate', 'Navigate')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ↵ {t('commandPalette.select', 'Select')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Esc {t('commandPalette.close', 'Close')}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to get default commands for the application.
 */
export function useDefaultCommands(options: {
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onOpenSearch: () => void;
  onOpenQueue: () => void;
  isPlaying: boolean;
}): CommandItem[] {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return useMemo(() => [
    // Navigation
    {
      id: 'nav-home',
      title: t('nav.dashboard'),
      description: t('commandPalette.goToDashboard', 'Go to dashboard'),
      icon: <Home />,
      category: 'navigation' as const,
      action: () => navigate('/dashboard'),
      keywords: ['home', 'main'],
    },
    {
      id: 'nav-artists',
      title: t('nav.artists'),
      description: t('commandPalette.browseArtists', 'Browse artists'),
      icon: <Person />,
      category: 'navigation' as const,
      action: () => navigate('/artists'),
    },
    {
      id: 'nav-albums',
      title: t('nav.albums'),
      description: t('commandPalette.browseAlbums', 'Browse albums'),
      icon: <Album />,
      category: 'navigation' as const,
      action: () => navigate('/albums'),
    },
    {
      id: 'nav-songs',
      title: t('nav.songs'),
      description: t('commandPalette.browseSongs', 'Browse songs'),
      icon: <MusicNote />,
      category: 'navigation' as const,
      action: () => navigate('/songs'),
    },
    {
      id: 'nav-playlists',
      title: t('nav.playlists'),
      description: t('commandPalette.browsePlaylists', 'Browse playlists'),
      icon: <PlaylistPlay />,
      category: 'navigation' as const,
      action: () => navigate('/playlists'),
    },
    {
      id: 'nav-genres',
      title: t('nav.genres'),
      description: t('commandPalette.browseGenres', 'Browse by genre'),
      icon: <Category />,
      category: 'navigation' as const,
      action: () => navigate('/genres'),
    },
    {
      id: 'nav-favorites',
      title: t('nav.favorites'),
      description: t('commandPalette.viewFavorites', 'View favorites'),
      icon: <Favorite />,
      category: 'navigation' as const,
      action: () => navigate('/favorites'),
    },
    {
      id: 'nav-settings',
      title: t('nav.settings'),
      description: t('commandPalette.openSettings', 'Open settings'),
      icon: <Settings />,
      category: 'navigation' as const,
      action: () => navigate('/settings'),
      shortcut: 'ctrl+,',
    },
    {
      id: 'nav-search',
      title: t('commandPalette.search', 'Search'),
      description: t('commandPalette.searchDesc', 'Search for music'),
      icon: <Search />,
      category: 'navigation' as const,
      action: () => {
        options.onOpenSearch();
        navigate('/search');
      },
      shortcut: 'ctrl+k',
      keywords: ['find', 'lookup'],
    },
    // Playback
    {
      id: 'playback-toggle',
      title: options.isPlaying ? t('commandPalette.pause', 'Pause') : t('commandPalette.play', 'Play'),
      description: t('commandPalette.togglePlayback', 'Toggle playback'),
      icon: options.isPlaying ? <Pause /> : <PlayArrow />,
      category: 'playback' as const,
      action: options.onTogglePlay,
      shortcut: 'space',
    },
    {
      id: 'playback-next',
      title: t('commandPalette.nextTrack', 'Next Track'),
      description: t('commandPalette.playNextTrack', 'Play next track'),
      icon: <SkipNext />,
      category: 'playback' as const,
      action: options.onNextTrack,
      shortcut: 'ctrl+ArrowRight',
    },
    {
      id: 'playback-prev',
      title: t('commandPalette.prevTrack', 'Previous Track'),
      description: t('commandPalette.playPrevTrack', 'Play previous track'),
      icon: <SkipPrevious />,
      category: 'playback' as const,
      action: options.onPrevTrack,
      shortcut: 'ctrl+ArrowLeft',
    },
    // Queue
    {
      id: 'queue-open',
      title: t('commandPalette.openQueue', 'Open Queue'),
      description: t('commandPalette.viewQueue', 'View playback queue'),
      icon: <QueueMusic />,
      category: 'queue' as const,
      action: () => {
        options.onOpenQueue();
        navigate('/queue');
      },
      shortcut: 'ctrl+q',
    },
    // Other
    {
      id: 'other-shortcuts',
      title: t('commandPalette.keyboardShortcuts', 'Keyboard Shortcuts'),
      description: t('commandPalette.viewShortcuts', 'View all keyboard shortcuts'),
      icon: <Keyboard />,
      category: 'other' as const,
      action: () => {
        // This would typically open a shortcuts help dialog
        console.log('Show keyboard shortcuts');
      },
      shortcut: 'ctrl+/',
    },
  ], [t, navigate, options]);
}
