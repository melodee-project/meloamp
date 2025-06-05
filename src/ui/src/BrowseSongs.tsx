import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText, Pagination } from '@mui/material';
import api from './api';

export default function BrowseSongs() {
  const [songs, setSongs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/songs', { params: { page, pageSize: 20 } })
      .then((res: any) => {
        setSongs(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => {})
    setLoading(false);
  }, [page]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Browse Songs</Typography>
      {loading ? <CircularProgress /> : (
        <List>
          {songs.map((song: any) => (
            <ListItem key={song.id}>
              <ListItemAvatar>
                <Avatar src={song.imageUrl || song.thumbnailUrl} alt={song.title} />
              </ListItemAvatar>
              <ListItemText primary={song.title} secondary={song.artist?.name} />
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
