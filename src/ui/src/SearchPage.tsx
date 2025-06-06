import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, List, ListItem, ListItemText, Button } from '@mui/material';
import { Search } from '@mui/icons-material';
import api from './api';
import { useQueueStore } from './queueStore';
import { SearchResultData, Song, Artist, Album, Playlist } from './apiModels';

export default function SearchPage({ query, onClose }: { query?: string, onClose?: () => void }) {
  const [search, setSearch] = useState(query || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultData | null>(null);
  const [error, setError] = useState('');

  const addToQueue = useQueueStore((state: any) => state.addToQueue);

  useEffect(() => {
    if (!search) return setResults(null);
    setLoading(true);
    setError('');
    api.get<SearchResultData>('/search', { params: { q: search } })
      .then((res) => setResults(res.data))
      .catch(() => setError('Search failed'));
    setLoading(false);
  }, [search]);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Search</Typography>
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
          {results.artists?.map((a: Artist) => <ListItem key={a.id}><ListItemText primary={a.name} secondary="Artist" /></ListItem>)}
          {results.albums?.map((a: Album) => <ListItem key={a.id}><ListItemText primary={a.name} secondary="Album" /></ListItem>)}
          {results.songs?.map((s: Song) => (
            <ListItem key={s.id} secondaryAction={
              <Button variant="outlined" size="small" onClick={() => addToQueue(s)}>Add to Queue</Button>
            }>
              <ListItemText primary={s.title} secondary="Song" />
            </ListItem>
          ))}
          {results.playlists?.map((p: Playlist) => <ListItem key={p.id}><ListItemText primary={p.name} secondary="Playlist" /></ListItem>)}
        </List>
      )}
    </Box>
  );
}
