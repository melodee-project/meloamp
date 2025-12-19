import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { 
  MusicNote, 
  Album, 
  Person, 
  QueueMusic, 
  Search, 
  PlaylistPlay,
  Favorite,
  Category
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export type EmptyStateType = 
  | 'songs' 
  | 'albums' 
  | 'artists' 
  | 'playlists' 
  | 'queue' 
  | 'search' 
  | 'favorites'
  | 'genres'
  | 'generic';

export interface EmptyStateProps {
  /** Type of empty state to determine icon and default message */
  type?: EmptyStateType;
  /** Custom title (overrides default) */
  title?: string;
  /** Custom description (overrides default) */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom icon (overrides type-based icon) */
  icon?: React.ReactNode;
}

const iconMap: Record<EmptyStateType, React.ReactNode> = {
  songs: <MusicNote sx={{ fontSize: 64 }} />,
  albums: <Album sx={{ fontSize: 64 }} />,
  artists: <Person sx={{ fontSize: 64 }} />,
  playlists: <PlaylistPlay sx={{ fontSize: 64 }} />,
  queue: <QueueMusic sx={{ fontSize: 64 }} />,
  search: <Search sx={{ fontSize: 64 }} />,
  favorites: <Favorite sx={{ fontSize: 64 }} />,
  genres: <Category sx={{ fontSize: 64 }} />,
  generic: <MusicNote sx={{ fontSize: 64 }} />,
};

/**
 * Standard empty state component for consistent empty UX across the app.
 */
export default function EmptyState({ 
  type = 'generic',
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  const { t } = useTranslation();

  // Default messages based on type
  const defaultMessages: Record<EmptyStateType, { title: string; description: string }> = {
    songs: { 
      title: t('empty.noSongs', 'No songs found'), 
      description: t('empty.noSongsDesc', 'There are no songs to display.') 
    },
    albums: { 
      title: t('empty.noAlbums', 'No albums found'), 
      description: t('empty.noAlbumsDesc', 'There are no albums to display.') 
    },
    artists: { 
      title: t('empty.noArtists', 'No artists found'), 
      description: t('empty.noArtistsDesc', 'There are no artists to display.') 
    },
    playlists: { 
      title: t('empty.noPlaylists', 'No playlists found'), 
      description: t('empty.noPlaylistsDesc', 'Create a playlist to get started.') 
    },
    queue: { 
      title: t('empty.noQueue', 'Queue is empty'), 
      description: t('empty.noQueueDesc', 'Add songs to the queue to start playing.') 
    },
    search: { 
      title: t('empty.noResults', 'No results found'), 
      description: t('empty.noResultsDesc', 'Try a different search term.') 
    },
    favorites: { 
      title: t('empty.noFavorites', 'No favorites yet'), 
      description: t('empty.noFavoritesDesc', 'Click the heart icon on songs to add them here.') 
    },
    genres: { 
      title: t('empty.noGenres', 'No genres found'), 
      description: t('empty.noGenresDesc', 'Genre browsing requires server support.') 
    },
    generic: { 
      title: t('empty.noContent', 'Nothing here'), 
      description: t('empty.noContentDesc', 'There is no content to display.') 
    },
  };

  const displayTitle = title ?? defaultMessages[type].title;
  const displayDescription = description ?? defaultMessages[type].description;
  const displayIcon = icon ?? iconMap[type];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        p: 4,
        textAlign: 'center',
      }}
      role="status"
      aria-label={displayTitle}
    >
      <Box sx={{ color: 'text.disabled', mb: 2 }}>
        {displayIcon}
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {displayTitle}
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 400 }}>
        {displayDescription}
      </Typography>
      {action && (
        <Button 
          variant="contained" 
          onClick={action.onClick}
          sx={{ mt: 3 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
