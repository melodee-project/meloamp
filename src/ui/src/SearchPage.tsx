import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, List, ListItem, ListItemText, Button } from '@mui/material';
import { Search } from '@mui/icons-material';
import api from './api';

export default function SearchPage({ query, onClose }: { query?: string, onClose?: () => void }) {
  const [search, setSearch] = useState(query || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!search) return setResults(null);
    setLoading(true);
    setError('');
    api.get('/search', { params: { q: search } })
      .then(res => setResults(res.data))
      .catch(() => setError('Search failed'))
      .finally(() => setLoading(false));
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
          {results.artists?.map((a: any) => <ListItem key={a.id}><ListItemText primary={a.name} secondary="Artist" /></ListItem>)}
          {results.albums?.map((a: any) => <ListItem key={a.id}><ListItemText primary={a.name} secondary="Album" /></ListItem>)}
          {results.songs?.map((s: any) => <ListItem key={s.id}><ListItemText primary={s.title} secondary="Song" /></ListItem>)}
          {results.playlists?.map((p: any) => <ListItem key={p.id}><ListItemText primary={p.name} secondary="Playlist" /></ListItem>)}
        </List>
      )}
    </Box>
  );
}
