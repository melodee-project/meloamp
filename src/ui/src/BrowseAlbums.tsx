import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Pagination, Button, Avatar } from '@mui/material';
import api from './api';
import { useQueueStore } from './queueStore';
import { Album, PaginatedResponse } from './apiModels';

export default function BrowseAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const addToQueue = useQueueStore((state: any) => state.addToQueue);

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse<Album>>('/albums', { params: { page, pageSize: 20 } })
      .then((res) => {
        setAlbums(res.data.data);
        setTotal(res.data.meta?.totalCount || 0);
      })
      .catch(() => {})
    setLoading(false);
  }, [page]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Browse Albums</Typography>
      {loading ? <CircularProgress /> : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {albums.map((album) => (
            <Box key={album.id} sx={{ flex: '1 1 200px', maxWidth: 250, minWidth: 180, display: 'flex', justifyContent: 'center' }}>
              {/* Optionally, replace with <AlbumCard album={album} /> for consistency */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Avatar src={album.thumbnailUrl || album.imageUrl} alt={album.name} sx={{ width: 80, height: 80, mb: 1 }} />
                <Typography variant="subtitle1" noWrap>{album.name}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>{album.artist?.name}</Typography>
                <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => addToQueue(album)}>Add to Queue</Button>
              </Box>
            </Box>
          ))}
        </Box>
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
