import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText, Pagination } from '@mui/material';
import api from './api';

export default function BrowseArtists() {
  const [artists, setArtists] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/artists', { params: { page, pageSize: 20 } })
      .then((res: any) => {
        setArtists(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => {})
    setLoading(false);
  }, [page]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Browse Artists</Typography>
      {loading ? <CircularProgress /> : (
        <List>
          {artists.map((artist: any) => (
            <ListItem key={artist.id}>
              <ListItemAvatar>
                <Avatar src={artist.imageUrl || artist.thumbnailUrl} alt={artist.name} />
              </ListItemAvatar>
              <ListItemText primary={artist.name} />
            </ListItem>
          ))}
        </List>
      )}
      <Pagination
        count={Math.ceil(total / 20)}
        page={page}
        onChange={(_, value) => setPage(value)}
        sx={{ mt: 2 }}
      />
      <Typography variant="body2" sx={{ mt: 1 }}>
        Viewing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
      </Typography>
    </Box>
  );
}
