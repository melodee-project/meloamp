import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Artist } from '../apiModels';

export default function ArtistCard({ artist }: { artist: Artist }) {
  const navigate = useNavigate();
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
        <Typography variant="body2">Albums: {artist.albumCount}</Typography>
        <Typography variant="body2">Songs: {artist.songCount}</Typography>
      </CardContent>
    </Card>
  );
}
