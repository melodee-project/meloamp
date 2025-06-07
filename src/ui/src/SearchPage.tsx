import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, Button, ListItem, ListItemText } from '@mui/material';
import { Search } from '@mui/icons-material';
import api from './api';
import { SearchResultData, Song, Artist, Album, Playlist } from './apiModels';
import ArtistCard from './components/ArtistCard';
import AlbumCard from './components/AlbumCard';
import { useTranslation } from 'react-i18next';
import SongCard from './components/SongCard';
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

  // Debounced search effect
  useEffect(() => {
    if (!search) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError('');
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const searchRequest: any = {
        query: search,
        type: 'data',
        pageSize,
        artistPage,
        albumPage,
        songPage,
        playlistPage,
      };
      api.post<SearchResultData>('/search', searchRequest)
        .then((res) => {
          setResults(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Search failed');
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

  // Close the search modal/overlay if the route changes away from /search
  useEffect(() => {
    if (onClose && location.pathname !== '/search') {
      onClose();
    }
  }, [location.pathname, onClose]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <TextField
        fullWidth
        placeholder={t('search.placeholder')}
        value={search}
        onChange={e => setSearch(e.target.value)}
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
