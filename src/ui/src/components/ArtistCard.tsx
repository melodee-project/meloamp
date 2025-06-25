import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Artist } from '../apiModels';
import { useTranslation } from 'react-i18next';

export default function ArtistCard({ artist }: { artist: Artist }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Card
      sx={{ width: 200, m: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
      onClick={() => navigate(`/artists/${artist.id}`)}
    >
      <Box sx={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
        <CardMedia
          component="img"
          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
          image={artist.thumbnailUrl}
          alt={artist.name}
        />
      </Box>
      <CardContent sx={{ width: '100%', textAlign: 'center' }}>
        <Typography variant="h6">{artist.name}</Typography>
        {artist.albumCount > 0 && (
          <Typography variant="body2">{t('artistCard.albums', { count: artist.albumCount })}</Typography>
        )}
        {artist.songCount > 0 &&
          <Typography variant="body2">{t('artistCard.songs', { count: artist.songCount })}</Typography>
        }
      </CardContent>
    </Card>
  );
}
