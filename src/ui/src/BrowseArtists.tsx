import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText, Pagination, Button } from '@mui/material';
import api from './api';
import { useQueueStore } from './queueStore';
import { Artist, PaginatedResponse } from './apiModels';

export default function BrowseArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const addToQueue = useQueueStore((state: any) => state.addToQueue);

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse<Artist>>('/artists', { params: { page, pageSize: 20 } })
      .then((res) => {
        setArtists(res.data.data);
        setTotal(res.data.meta?.totalCount || 0);
      })
      .catch(() => {})
    setLoading(false);
  }, [page]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Browse Artists</Typography>
      {loading ? <CircularProgress /> : (
        <List>
          {artists.map((artist) => (
            <ListItem key={artist.id} secondaryAction={
              <Button variant="outlined" size="small" onClick={() => addToQueue(artist)}>Add to Queue</Button>
            }>
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
