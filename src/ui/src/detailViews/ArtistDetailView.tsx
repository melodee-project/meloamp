import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, CardContent, CardMedia } from '@mui/material';
import { apiRequest } from '../api';
import { Artist } from '../apiModels';

export default function ArtistDetailView() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest(`/artists/${id}`)
      .then(res => setArtist(res.data as Artist))
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load artist.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{error}</Box>;
  if (!artist) return null;

  return (
    <Card sx={{ maxWidth: 400, m: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CardMedia
          component="img"
          sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, mb: 2 }}
          image={artist.thumbnailUrl}
          alt={artist.name}
        />
        <CardContent sx={{ width: '100%', textAlign: 'center' }}>
          <Typography variant="h5">{artist.name}</Typography>
          <Typography variant="body2">Albums: {artist.albumCount}</Typography>
          <Typography variant="body2">Songs: {artist.songCount}</Typography>
          {artist.biography && <Typography variant="body2" sx={{ mt: 2 }}>{artist.biography}</Typography>}
        </CardContent>
      </Box>
    </Card>
  );
}
