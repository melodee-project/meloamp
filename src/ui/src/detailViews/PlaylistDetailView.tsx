import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, CardContent, CardMedia } from '@mui/material';
import { apiRequest } from '../api';
import { Playlist } from '../apiModels';
import { useTranslation } from 'react-i18next';

export default function PlaylistDetailView() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest(`/playlists/${id}`)
      .then(res => setPlaylist(res.data as Playlist))
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load playlist.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{error}</Box>;
  if (!playlist) return null;

  return (
    <Card sx={{ maxWidth: 400, m: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CardMedia
          component="img"
          sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, mb: 2 }}
          image={playlist.thumbnailUrl}
          alt={playlist.name}
        />
        <CardContent sx={{ width: '100%', textAlign: 'center' }}>
          <Typography variant="h4">{playlist.name}</Typography>
          <Typography variant="subtitle1">{t('playlistDetail.createdBy')}: {playlist.owner?.username || playlist.owner?.email}</Typography>
          <Typography variant="h6" sx={{ mt: 3 }}>{t('playlistDetail.tracks')}</Typography>
          <Typography variant="body2">{playlist.description}</Typography>
        </CardContent>
      </Box>
    </Card>
  );
}
