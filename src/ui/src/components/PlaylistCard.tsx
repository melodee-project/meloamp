import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { Playlist } from '../apiModels';

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Card sx={{ minWidth: 250, maxWidth: 345, m: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
        <CardMedia
          component="img"
          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
          image={playlist.thumbnailUrl}
          alt={playlist.name}
        />
      </Box>
      <CardContent sx={{ width: '100%', textAlign: 'center' }}>
        <Typography variant="h6">{playlist.name}</Typography>
        <Typography variant="body2">{playlist.songCount} | {playlist.durationFormatted }</Typography>
      </CardContent>
    </Card>
  );
}
