/**
 * FavoritesPage - Shows user's liked/disliked/top-rated songs, albums, and artists
 */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Pagination,
  Alert,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  Favorite, 
  ThumbDown, 
  Star,
  StarHalf,
  MusicNote,
  Album as AlbumIcon,
  Person
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Song, Album, Artist, PaginatedResponse } from '../apiModels';
import SongCard from '../components/SongCard';
import AlbumCard from '../components/AlbumCard';
import ArtistCard from '../components/ArtistCard';

type RatingFilter = 'liked' | 'disliked' | 'topRated' | 'rated';
type EntityType = 'songs' | 'albums' | 'artists';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial values from URL or defaults
  const initialFilter = (searchParams.get('filter') as RatingFilter) || 'liked';
  const initialEntity = (searchParams.get('type') as EntityType) || 'songs';
  
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(initialFilter);
  const [entityType, setEntityType] = useState<EntityType>(initialEntity);
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Build endpoint based on entity type and rating filter
  // Uses /user/ endpoints for user-specific data
  const getEndpoint = (): string => {
    switch (ratingFilter) {
      case 'liked':
        return `/user/${entityType}/liked`;
      case 'disliked':
        return `/user/${entityType}/disliked`;
      case 'topRated':
        return `/user/${entityType}/top-rated`;
      case 'rated':
        return `/user/${entityType}/rated`;
    }
  };

  // Fetch data based on current filters
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = getEndpoint();
        
        if (entityType === 'songs') {
          const res = await api.get<PaginatedResponse<Song>>(endpoint, {
            params: { page, pageSize }
          });
          setSongs(res.data.data || []);
          setAlbums([]);
          setArtists([]);
          setTotal(res.data.meta?.totalCount || 0);
        } else if (entityType === 'albums') {
          const res = await api.get<PaginatedResponse<Album>>(endpoint, {
            params: { page, pageSize }
          });
          setAlbums(res.data.data || []);
          setSongs([]);
          setArtists([]);
          setTotal(res.data.meta?.totalCount || 0);
        } else if (entityType === 'artists') {
          const res = await api.get<PaginatedResponse<Artist>>(endpoint, {
            params: { page, pageSize }
          });
          setArtists(res.data.data || []);
          setSongs([]);
          setAlbums([]);
          setTotal(res.data.meta?.totalCount || 0);
        }
      } catch (err: any) {
        // If endpoint doesn't exist, show empty state
        if (err?.response?.status === 404) {
          setSongs([]);
          setAlbums([]);
          setArtists([]);
          setTotal(0);
        } else {
          setError(err?.response?.data?.message || t('common.error'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ratingFilter, entityType, page, t]);

  // Update URL when filters change
  const updateUrl = (filter: RatingFilter, entity: EntityType) => {
    setSearchParams({ filter, type: entity });
  };

  const handleFilterChange = (_event: React.SyntheticEvent, newValue: RatingFilter) => {
    if (newValue !== null) {
      setRatingFilter(newValue);
      setPage(1);
      updateUrl(newValue, entityType);
    }
  };

  const handleEntityChange = (_event: React.MouseEvent<HTMLElement>, newValue: EntityType | null) => {
    if (newValue !== null) {
      setEntityType(newValue);
      setPage(1);
      updateUrl(ratingFilter, newValue);
    }
  };

  const getFilterIcon = (filter: RatingFilter) => {
    switch (filter) {
      case 'liked':
        return <Favorite />;
      case 'disliked':
        return <ThumbDown />;
      case 'topRated':
        return <Star />;
      case 'rated':
        return <StarHalf />;
    }
  };

  const getEmptyMessage = () => {
    const entityName = t(`favorites.entity.${entityType}`, entityType);
    switch (ratingFilter) {
      case 'liked':
        return t('favorites.noLiked', { entity: entityName });
      case 'disliked':
        return t('favorites.noDisliked', { entity: entityName });
      case 'topRated':
        return t('favorites.noTopRated', { entity: entityName });
      case 'rated':
        return t('favorites.noRated', { entity: entityName });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    const isEmpty = songs.length === 0 && albums.length === 0 && artists.length === 0;
    
    if (isEmpty) {
      return (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          {getFilterIcon(ratingFilter)}
          <Typography variant="body1" sx={{ mt: 2 }}>
            {getEmptyMessage()}
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
          {entityType === 'songs' && songs.map((song) => (
            <Box key={song.id} sx={{ width: 300, minWidth: 300, maxWidth: 300 }}>
              <SongCard song={song} />
            </Box>
          ))}
          {entityType === 'albums' && albums.map((album) => (
            <AlbumCard key={album.id} album={album} compact />
          ))}
          {entityType === 'artists' && artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} compact />
          ))}
        </Box>
        
        {total > pageSize && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={page}
              onChange={(_, value) => setPage(value)}
            />
          </Box>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('common.viewing', { 
            from: (page - 1) * pageSize + 1, 
            to: Math.min(page * pageSize, total), 
            total 
          })}
        </Typography>
      </>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t('favorites.title', 'My Library')}
      </Typography>
      
      {/* Entity type toggle (Songs/Albums/Artists) */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={entityType}
          exclusive
          onChange={handleEntityChange}
          aria-label={t('favorites.entityType', 'Content type')}
          size="small"
        >
          <ToggleButton value="songs" aria-label={t('favorites.entity.songs', 'Songs')}>
            <MusicNote sx={{ mr: 0.5 }} />
            {t('favorites.entity.songs', 'Songs')}
          </ToggleButton>
          <ToggleButton value="albums" aria-label={t('favorites.entity.albums', 'Albums')}>
            <AlbumIcon sx={{ mr: 0.5 }} />
            {t('favorites.entity.albums', 'Albums')}
          </ToggleButton>
          <ToggleButton value="artists" aria-label={t('favorites.entity.artists', 'Artists')}>
            <Person sx={{ mr: 0.5 }} />
            {t('favorites.entity.artists', 'Artists')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Rating filter tabs (Liked/Disliked/Top Rated/Rated) */}
      <Tabs 
        value={ratingFilter} 
        onChange={handleFilterChange} 
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          value="liked" 
          label={t('favorites.liked', 'Liked')} 
          icon={getFilterIcon('liked')} 
          iconPosition="start"
        />
        <Tab 
          value="disliked" 
          label={t('favorites.disliked', 'Disliked')} 
          icon={getFilterIcon('disliked')} 
          iconPosition="start"
        />
        <Tab 
          value="topRated" 
          label={t('favorites.topRated', 'Top Rated')} 
          icon={getFilterIcon('topRated')} 
          iconPosition="start"
        />
        <Tab 
          value="rated" 
          label={t('favorites.rated', 'Rated')} 
          icon={getFilterIcon('rated')} 
          iconPosition="start"
        />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderContent()}
    </Box>
  );
}
