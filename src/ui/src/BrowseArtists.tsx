import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Pagination } from '@mui/material';
import api from './api';
import { Artist, PaginatedResponse } from './apiModels';
import ArtistCard from './components/ArtistCard';

export default function BrowseArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

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
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Browse Artists</Typography>
      {loading ? <CircularProgress /> : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {artists.map((artist) => (
            <Box key={artist.id} sx={{ flex: '1 1 200px', maxWidth: 250, minWidth: 180, display: 'flex', justifyContent: 'center' }}>
              <ArtistCard artist={artist} />
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
