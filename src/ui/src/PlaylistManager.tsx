import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Add, Delete, Shuffle, Save } from '@mui/icons-material';

export default function PlaylistManager() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name) return;
    setPlaylists([...playlists, { id: Date.now(), name }]);
    setName('');
  };

  const handleDelete = (id: number) => {
    setPlaylists(playlists.filter(p => p.id !== id));
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h6">Playlists</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New playlist name" />
        <Button variant="contained" onClick={handleCreate} startIcon={<Add />}>Create</Button>
      </Box>
      <List>
        {playlists.map(p => (
          <ListItem key={p.id} secondaryAction={
            <IconButton edge="end" onClick={() => handleDelete(p.id)}><Delete /></IconButton>
          }>
            <ListItemText primary={p.name} />
          </ListItem>
        ))}
      </List>
      <Button variant="outlined" startIcon={<Shuffle />}>Shuffle</Button>
      <Button variant="outlined" startIcon={<Save />} sx={{ ml: 1 }}>Save</Button>
    </Box>
  );
}
