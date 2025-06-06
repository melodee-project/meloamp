import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { Artist } from '../apiModels';

export default function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Card sx={{ maxWidth: 345, m: 1 }}>
      <CardMedia
        component="img"
        height="140"
        image={artist.thumbnailUrl}
        alt={artist.name}
      />
      <CardContent>
        <Typography variant="h6">{artist.name}</Typography>
        <Typography variant="body2">Albums: {artist.albumCount}</Typography>
        <Typography variant="body2">Songs: {artist.songCount}</Typography>
      </CardContent>
    </Card>
  );
}
