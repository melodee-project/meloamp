import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Pagination } from '@mui/material';
import api from './api';
import { useQueueStore } from './queueStore';
import { Song, PaginatedResponse } from './apiModels';
import SongCard from './components/SongCard';

export default function BrowseSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse<Song>>('/songs', { params: { page, pageSize: 20 } })
      .then((res) => {
        setSongs(res.data.data);
        setTotal(res.data.meta?.totalCount || 0);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [page]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Browse Songs</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {songs.map((song) => (
            <Box key={song.id} sx={{ flex: '1 1 250px', maxWidth: 350, minWidth: 220, display: 'flex', justifyContent: 'center' }}>
              <SongCard song={song} />
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
