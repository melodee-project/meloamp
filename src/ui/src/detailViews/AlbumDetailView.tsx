import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, CardContent, CardMedia } from '@mui/material';
import { apiRequest } from '../api';
import { Album } from '../apiModels';

export default function AlbumDetailView() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest(`/albums/${id}`)
      .then(res => setAlbum(res.data as Album))
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load album.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{error}</Box>;
  if (!album) return null;

  return (
    <Card sx={{ maxWidth: 400, m: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CardMedia
          component="img"
          sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, mb: 2 }}
          image={album.thumbnailUrl}
          alt={album.name}
        />
        <CardContent sx={{ width: '100%', textAlign: 'center' }}>
          <Typography variant="h5">{album.name}</Typography>
          <Typography variant="body2">Artist: {album.artist.name}</Typography>
          <Typography variant="body2">Year: {album.releaseYear}</Typography>
          <Typography variant="body2">Songs: {album.songCount}</Typography>
          <Typography variant="body2">Duration: {album.durationFormatted}</Typography>
        </CardContent>
      </Box>
    </Card>
  );
}
