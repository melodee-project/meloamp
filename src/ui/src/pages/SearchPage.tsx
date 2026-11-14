import { debugLog, debugError } from '../debug';
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  IconButton, 
  CircularProgress, 
  Button, 
  Chip,
  Stack,
  Paper,
  Collapse
} from '@mui/material';
import { Search, History, Clear, ExpandMore, ExpandLess } from '@mui/icons-material';
import api, { unwrapApiResponse } from '../api';
import { getErrorMessage } from '../utils/errors';
import { useApiEffect } from '../hooks/useApiEffect';
import { SearchResultData, Song, Artist, Album, Playlist } from '../apiModels';
import ArtistCard from '../components/ArtistCard';
import AlbumCard from '../components/AlbumCard';
import SongCard from '../components/SongCard';
import PlaylistCard from '../components/PlaylistCard';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';

// Recent searches helper
const RECENT_SEARCHES_KEY = 'meloamp_recent_searches';
const MAX_RECENT_SEARCHES = 10;

const getRecentSearches = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
};

const addRecentSearch = (query: string) => {
  if (!query.trim()) return;
  const searches = getRecentSearches();
  // Remove if already exists, then add to front
  const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
};

const clearRecentSearches = () => {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
};

// Filter types
type FilterType = 'artists' | 'albums' | 'songs' | 'playlists';

export default function SearchPage({ query, onClose }: { query?: string, onClose?: () => void }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramQ = searchParams.get('q') || undefined;
  const urlQueryRef = React.useRef(paramQ);
  urlQueryRef.current = paramQ;
  const [search, setSearch] = useState(() => query ?? paramQ ?? '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultData | null>(null);
  const [error, setError] = useState('');

  // Filter and sort state
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(['artists', 'albums', 'songs', 'playlists']);
  const [showFilters, setShowFilters] = useState(true);

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());

  // Pagination state for each type
  const [artistPage, setArtistPage] = useState(1);
  const [albumPage, setAlbumPage] = useState(1);
  const [songPage, setSongPage] = useState(1);
  const [playlistPage, setPlaylistPage] = useState(1);
  const pageSize = 10;

  const { t } = useTranslation();
  const location = useLocation();

  // URL navigation (including back/forward) updates the draft. Local edits
  // remain local until the debounced search finishes.
  useEffect(() => {
    setSearch(query ?? paramQ ?? '');
  }, [query, paramQ]);

  useApiEffect((signal) => {
    setError('');
    if (!search.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.post('/search', {
          query: search,
          pageSize,
          artistPage,
          albumPage,
          songPage,
          playlistPage,
        }, { signal });
        if (signal.aborted) return;
        setResults(unwrapApiResponse<SearchResultData>(res.data));
        addRecentSearch(search);
        setRecentSearches(getRecentSearches());
        if (urlQueryRef.current !== search) {
          navigate(`${location.pathname}?q=${encodeURIComponent(search)}`, { replace: true });
        }
      } catch (error) {
        if (signal.aborted) return;
        debugError('SearchPage', 'Search error:', error);
        setError(t('search.error', { error: getErrorMessage(error, '') }));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }, 500);
    signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });
  }, [search, artistPage, albumPage, songPage, playlistPage, location.pathname, navigate, t]);

  // Reset pages when search changes
  useEffect(() => {
    setArtistPage(1);
    setAlbumPage(1);
    setSongPage(1);
    setPlaylistPage(1);
  }, [search]);

  // Toggle filter
  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Handle clicking on a recent search
  const handleRecentSearchClick = (searchQuery: string) => {
    setSearch(searchQuery);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // Handle clearing recent searches
  const handleClearRecentSearches = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Check if a section should be shown based on filters
  const shouldShowSection = (type: FilterType): boolean => {
    return activeFilters.includes(type);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Search Input */}
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          placeholder={t('search.placeholder')}
          value={search}
          onChange={e => {
            debugLog('SearchPage', 'Search input changed:', e.target.value);
            setSearch(e.target.value);
            if (!e.target.value) navigate(location.pathname, { replace: true });
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && search.trim()) {
              addRecentSearch(search);
              setRecentSearches(getRecentSearches());
            }
          }}
          slotProps={{ input: {
            startAdornment: (
              <InputAdornment position="start">
                <IconButton aria-label={t('search.search', 'Search')} disabled size="small">
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
          } }}
        />
      </Box>

      {/* Filters and Sort */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Button 
            size="small" 
            onClick={() => setShowFilters(!showFilters)}
            endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
          >
            {t('search.filters', 'Filters')}
          </Button>
        </Box>
        <Collapse in={showFilters}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={t('search.artists', 'Artists')}
              color={activeFilters.includes('artists') ? 'primary' : 'default'}
              onClick={() => toggleFilter('artists')}
              variant={activeFilters.includes('artists') ? 'filled' : 'outlined'}
            />
            <Chip
              label={t('search.albums', 'Albums')}
              color={activeFilters.includes('albums') ? 'primary' : 'default'}
              onClick={() => toggleFilter('albums')}
              variant={activeFilters.includes('albums') ? 'filled' : 'outlined'}
            />
            <Chip
              label={t('search.songs', 'Songs')}
              color={activeFilters.includes('songs') ? 'primary' : 'default'}
              onClick={() => toggleFilter('songs')}
              variant={activeFilters.includes('songs') ? 'filled' : 'outlined'}
            />
            <Chip
              label={t('search.playlists', 'Playlists')}
              color={activeFilters.includes('playlists') ? 'primary' : 'default'}
              onClick={() => toggleFilter('playlists')}
              variant={activeFilters.includes('playlists') ? 'filled' : 'outlined'}
            />
          </Stack>
        </Collapse>
      </Box>

      {/* Recent Searches */}
      {!search && recentSearches.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History fontSize="small" color="action" />
              <Typography variant="subtitle2">{t('search.recentSearches', 'Recent Searches')}</Typography>
            </Box>
            <Button 
              size="small" 
              startIcon={<Clear />} 
              onClick={handleClearRecentSearches}
            >
              {t('search.clearHistory', 'Clear')}
            </Button>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {recentSearches.map((recentQuery, index) => (
              <Chip
                key={index}
                label={recentQuery}
                onClick={() => handleRecentSearchClick(recentQuery)}
                size="small"
                sx={{ mb: 0.5 }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {onClose && <Button onClick={onClose} sx={{ mt: 2 }}>{t('common.close', 'Close')}</Button>}
      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Typography color="error" sx={{ mt: 2 }}>{t('search.error', { error })}</Typography>}
      {results && (
        <Box sx={{ mt: 4 }}>
          {/* Artists Grid */}
          {shouldShowSection('artists') && results.artists?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('search.artists', 'Artists')}</Typography>
              {((results.totalArtists ?? results.artists.length) > pageSize) && (
                <Typography variant="body2" sx={{ mb: 1 }}>{t('common.viewing', {
                  from: (artistPage - 1) * pageSize + 1,
                  to: Math.min(artistPage * pageSize, results.totalArtists ?? results.artists.length),
                  total: results.totalArtists ?? results.artists.length
                })}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                {results.artists.map((a: Artist) => (
                  <Box key={a.id} sx={{ flex: '1 1 200px', maxWidth: 250, minWidth: 180, display: 'flex', justifyContent: 'center' }}>
                    <ArtistCard artist={a} />
                  </Box>
                ))}
              </Box>
              {((results.totalArtists ?? results.artists.length) > pageSize) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                  <Button size="small" disabled={artistPage === 1} onClick={() => setArtistPage(p => Math.max(1, p - 1))}>{t('common.back', 'Back')}</Button>
                  <Button size="small" disabled={artistPage * pageSize >= (results.totalArtists ?? results.artists.length)} onClick={() => setArtistPage(p => p + 1)}>{t('common.next', 'Next')}</Button>
                </Box>
              )}
            </Box>
          )}
          {/* Albums Grid */}
          {shouldShowSection('albums') && results.albums?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('search.albums', 'Albums')}</Typography>
              {((results.totalAlbums ?? results.albums.length) > pageSize) && (
                <Typography variant="body2" sx={{ mb: 1 }}>{t('common.viewing', {
                  from: (albumPage - 1) * pageSize + 1,
                  to: Math.min(albumPage * pageSize, results.totalAlbums ?? results.albums.length),
                  total: results.totalAlbums ?? results.albums.length
                })}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                {results.albums.map((a: Album) => (
                  <Box key={a.id} sx={{ flex: '1 1 200px', maxWidth: 250, minWidth: 180, display: 'flex', justifyContent: 'center' }}>
                    <AlbumCard album={a} />
                  </Box>
                ))}
              </Box>
              {((results.totalAlbums ?? results.albums.length) > pageSize) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                  <Button size="small" disabled={albumPage === 1} onClick={() => setAlbumPage(p => Math.max(1, p - 1))}>{t('common.back', 'Back')}</Button>
                  <Button size="small" disabled={albumPage * pageSize >= (results.totalAlbums ?? results.albums.length)} onClick={() => setAlbumPage(p => p + 1)}>{t('common.next', 'Next')}</Button>
                </Box>
              )}
            </Box>
          )}
          {/* Songs Grid */}
          {shouldShowSection('songs') && results.songs?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('search.songs', 'Songs')}</Typography>
              {((results.totalSongs ?? results.songs.length) > pageSize) && (
                <Typography variant="body2" sx={{ mb: 1 }}>{t('common.viewing', {
                  from: (songPage - 1) * pageSize + 1,
                  to: Math.min(songPage * pageSize, results.totalSongs ?? results.songs.length),
                  total: results.totalSongs ?? results.songs.length
                })}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                {results.songs.map((s: Song) => (
                  <Box key={s.id} sx={{ width: 300, minWidth: 300, maxWidth: 300, display: 'flex', justifyContent: 'center' }}>
                    <SongCard song={s} />
                  </Box>
                ))}
              </Box>
              {((results.totalSongs ?? results.songs.length) > pageSize) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                  <Button size="small" disabled={songPage === 1} onClick={() => setSongPage(p => Math.max(1, p - 1))}>{t('common.back', 'Back')}</Button>
                  <Button size="small" disabled={songPage * pageSize >= (results.totalSongs ?? results.songs.length)} onClick={() => setSongPage(p => p + 1)}>{t('common.next', 'Next')}</Button>
                </Box>
              )}
            </Box>
          )}
          {/* Playlists Grid */}
          {shouldShowSection('playlists') && results.playlists?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('search.playlists', 'Playlists')}</Typography>
              {((results.totalPlaylists ?? results.playlists.length) > pageSize) && (
                <Typography variant="body2" sx={{ mb: 1 }}>{t('common.viewing', {
                  from: (playlistPage - 1) * pageSize + 1,
                  to: Math.min(playlistPage * pageSize, results.totalPlaylists ?? results.playlists.length),
                  total: results.totalPlaylists ?? results.playlists.length
                })}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                {results.playlists.map((p: Playlist) => (
                  <Box key={p.id} sx={{ flex: '1 1 250px', maxWidth: 350, minWidth: 220, display: 'flex', justifyContent: 'center' }}>
                    <PlaylistCard playlist={p} compact />
                  </Box>
                ))}
              </Box>
              {((results.totalPlaylists ?? results.playlists.length) > pageSize) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                  <Button size="small" disabled={playlistPage === 1} onClick={() => setPlaylistPage(p => Math.max(1, p - 1))}>{t('common.back', 'Back')}</Button>
                  <Button size="small" disabled={playlistPage * pageSize >= (results.totalPlaylists ?? results.playlists.length)} onClick={() => setPlaylistPage(p => p + 1)}>{t('common.next', 'Next')}</Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
