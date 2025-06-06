import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, List, ListItem, ListItemText, Button } from '@mui/material';
import { Search } from '@mui/icons-material';
import api from './api';
import { useQueueStore } from './queueStore';
import { SearchResultData, Song, Artist, Album, Playlist } from './apiModels';
import ArtistCard from './components/ArtistCard';
import AlbumCard from './components/AlbumCard';
import { toQueueSong } from './components/toQueueSong';

export default function SearchPage({ query, onClose }: { query?: string, onClose?: () => void }) {
  const [search, setSearch] = useState(query || '');
  const [type, setType] = useState<string | undefined>(undefined); // e.g. 'all', 'artist', 'album', 'song', 'playlist'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultData | null>(null);
  const [error, setError] = useState('');
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const addToQueue = useQueueStore((state: any) => state.addToQueue);

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
        type: type || 'data',
        page,
        pageSize,
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
    }, 1000);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, type, page, pageSize]);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <TextField
        fullWidth
        placeholder="Search artists, albums, tracks..."
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
      {onClose && <Button onClick={onClose} sx={{ mt: 2 }}>Close</Button>}
      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      {results && (
        <List>
          {/* Artists as cards */}
          {results.data.artists?.map((a: Artist) => (
            <ListItem key={a.id} disableGutters sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArtistCard artist={a} />
            </ListItem>
          ))}
          {/* Albums as cards */}
          {results.data.albums?.map((a: Album) => (
            <ListItem key={a.id} disableGutters sx={{ display: 'flex', justifyContent: 'center' }}>
              <AlbumCard album={a} />
            </ListItem>
          ))}
          {/* Songs as list items */}
          {results.data.songs?.map((s: Song) => (
            <ListItem key={s.id} secondaryAction={
              <Button variant="outlined" size="small" onClick={() => addToQueue(toQueueSong(s))}>Add to Queue</Button>
            }>
              <ListItemText primary={s.title} secondary="Song" />
            </ListItem>
          ))}
          {/* Playlists as list items */}
          {results.data.playlists?.map((p: Playlist) => (
            <ListItem key={p.id}>
              <ListItemText primary={p.name} secondary="Playlist" />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
