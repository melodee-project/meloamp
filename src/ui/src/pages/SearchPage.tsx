import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, Button, ListItem, ListItemText } from '@mui/material';
import { Search } from '@mui/icons-material';
import api from '../api';
import { SearchResultData, Song, Artist, Album, Playlist } from '../apiModels';
import ArtistCard from '../components/ArtistCard';
import AlbumCard from '../components/AlbumCard';
import SongCard from '../components/SongCard';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export default function SearchPage({ query, onClose }: { query?: string, onClose?: () => void }) {
  const [search, setSearch] = useState(query || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultData | null>(null);
  const [error, setError] = useState('');
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Pagination state for each type
  const [artistPage, setArtistPage] = useState(1);
  const [albumPage, setAlbumPage] = useState(1);
  const [songPage, setSongPage] = useState(1);
  const [playlistPage, setPlaylistPage] = useState(1);
  const pageSize = 10;

  const { t } = useTranslation();
  const location = useLocation();

  // Sync search state when query prop changes
  useEffect(() => {
    console.log('[SearchPage] Query prop effect - query:', query, 'current search:', search);
    if (query !== undefined && query !== search) {
      console.log('[SearchPage] Query prop changed, updating search from', search, 'to', query);
      setSearch(query);
    }
  }, [query, search]);

  // Debounced search effect
  useEffect(() => {
    console.log('[SearchPage] Search effect triggered, search:', search);
    if (!search) {
      console.log('[SearchPage] Search is empty, clearing results');
      setResults(null);
      return;
    }
    console.log('[SearchPage] Search has value, starting API call process');
    setLoading(true);
    setError('');
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const searchRequest = {
        query: search,
        pageSize,
        artistPage,
        albumPage,
        songPage,
        playlistPage,
      };
      console.log('[SearchPage] Sending search request:', searchRequest);
      api.post<SearchResultData>('/search', searchRequest)
        .then((res) => {
          console.log('[SearchPage] Search response:', res.data);
          setResults(res.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('[SearchPage] Search error:', error);
          console.error('[SearchPage] Error response:', error.response?.data);
          setError(`Search failed: ${error.response?.data?.message || error.message}`);
          setLoading(false);
        });
    }, 500);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, artistPage, albumPage, songPage, playlistPage]);

  // Reset pages when search changes
  useEffect(() => {
    setArtistPage(1);
    setAlbumPage(1);
    setSongPage(1);
    setPlaylistPage(1);
  }, [search]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <TextField
        fullWidth
        placeholder={t('search.placeholder')}
        value={search}
        onChange={e => {
          console.log('[SearchPage] Search input changed:', e.target.value);
          setSearch(e.target.value);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton disabled>
                <Search />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {onClose && <Button onClick={onClose} sx={{ mt: 2 }}>{t('common.close', 'Close')}</Button>}
      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Typography color="error" sx={{ mt: 2 }}>{t('search.error', { error })}</Typography>}
      {results && (
        <Box sx={{ mt: 4 }}>
          {/* Artists Grid */}
          {results.data.artists?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('search.artists', 'Artists')}</Typography>
              {((results.data.totalArtists ?? results.data.artists.length) > pageSize) && (
                <Typography variant="body2" sx={{ mb: 1 }}>{t('common.viewing', {
                  from: (artistPage - 1) * pageSize + 1,
                  to: Math.min(artistPage * pageSize, results.data.totalArtists ?? results.data.artists.length),
                  total: results.data.totalArtists ?? results.data.artists.length
                })}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                {results.data.artists.map((a: Artist) => (
                  <Box key={a.id} sx={{ flex: '1 1 200px', maxWidth: 250, minWidth: 180, display: 'flex', justifyContent: 'center' }}>
                    <ArtistCard artist={a} />
                  </Box>
                ))}
              </Box>
              {((results.data.totalArtists ?? results.data.artists.length) > pageSize) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                  <Button size="small" disabled={artistPage === 1} onClick={() => setArtistPage(p => Math.max(1, p - 1))}>{t('common.back', 'Back')}</Button>
                  <Button size="small" disabled={artistPage * pageSize >= (results.data.totalArtists ?? results.data.artists.length)} onClick={() => setArtistPage(p => p + 1)}>{t('common.next', 'Next')}</Button>
                </Box>
              )}
            </Box>
          )}
          {/* Albums Grid */}
          {results.data.albums?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('search.albums', 'Albums')}</Typography>
              {((results.data.totalAlbums ?? results.data.albums.length) > pageSize) && (
                <Typography variant="body2" sx={{ mb: 1 }}>{t('common.viewing', {
                  from: (albumPage - 1) * pageSize + 1,
                  to: Math.min(albumPage * pageSize, results.data.totalAlbums ?? results.data.albums.length),
                  total: results.data.totalAlbums ?? results.data.albums.length
                })}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                {results.data.albums.map((a: Album) => (
                  <Box key={a.id} sx={{ flex: '1 1 200px', maxWidth: 250, minWidth: 180, display: 'flex', justifyContent: 'center' }}>
                    <AlbumCard album={a} />
                  </Box>
                ))}
              </Box>
              {((results.data.totalAlbums ?? results.data.albums.length) > pageSize) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                  <Button size="small" disabled={albumPage === 1} onClick={() => setAlbumPage(p => Math.max(1, p - 1))}>{t('common.back', 'Back')}</Button>
                  <Button size="small" disabled={albumPage * pageSize >= (results.data.totalAlbums ?? results.data.albums.length)} onClick={() => setAlbumPage(p => p + 1)}>{t('common.next', 'Next')}</Button>
                </Box>
              )}
            </Box>
          )}
          {/* Songs Grid */}
          {results.data.songs?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('search.songs', 'Songs')}</Typography>
              {((results.data.totalSongs ?? results.data.songs.length) > pageSize) && (
                <Typography variant="body2" sx={{ mb: 1 }}>{t('common.viewing', {
                  from: (songPage - 1) * pageSize + 1,
                  to: Math.min(songPage * pageSize, results.data.totalSongs ?? results.data.songs.length),
                  total: results.data.totalSongs ?? results.data.songs.length
                })}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                {results.data.songs.map((s: Song) => (
                  <Box key={s.id} sx={{ width: 300, minWidth: 300, maxWidth: 300, display: 'flex', justifyContent: 'center' }}>
                    <SongCard song={s} />
                  </Box>
                ))}
              </Box>
              {((results.data.totalSongs ?? results.data.songs.length) > pageSize) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                  <Button size="small" disabled={songPage === 1} onClick={() => setSongPage(p => Math.max(1, p - 1))}>{t('common.back', 'Back')}</Button>
                  <Button size="small" disabled={songPage * pageSize >= (results.data.totalSongs ?? results.data.songs.length)} onClick={() => setSongPage(p => p + 1)}>{t('common.next', 'Next')}</Button>
                </Box>
              )}
            </Box>
          )}
          {/* Playlists Grid */}
          {results.data.playlists?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('search.playlists', 'Playlists')}</Typography>
              {((results.data.totalPlaylists ?? results.data.playlists.length) > pageSize) && (
                <Typography variant="body2" sx={{ mb: 1 }}>{t('common.viewing', {
                  from: (playlistPage - 1) * pageSize + 1,
                  to: Math.min(playlistPage * pageSize, results.data.totalPlaylists ?? results.data.playlists.length),
                  total: results.data.totalPlaylists ?? results.data.playlists.length
                })}</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                {results.data.playlists.map((p: Playlist) => (
                  <Box key={p.id} sx={{ flex: '1 1 250px', maxWidth: 350, minWidth: 220, display: 'flex', justifyContent: 'center' }}>
                    <ListItem disableGutters sx={{ width: '100%' }}>
                      <ListItemText primary={p.name} secondary={t('search.playlist')} />
                    </ListItem>
                  </Box>
                ))}
              </Box>
              {((results.data.totalPlaylists ?? results.data.playlists.length) > pageSize) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                  <Button size="small" disabled={playlistPage === 1} onClick={() => setPlaylistPage(p => Math.max(1, p - 1))}>{t('common.back', 'Back')}</Button>
                  <Button size="small" disabled={playlistPage * pageSize >= (results.data.totalPlaylists ?? results.data.playlists.length)} onClick={() => setPlaylistPage(p => p + 1)}>{t('common.next', 'Next')}</Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
