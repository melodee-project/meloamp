import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { Album } from '../apiModels';

export default function AlbumCard({ album }: { album: Album }) {
  return (
    <Card sx={{ width: 200, m: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
        <CardMedia
          component="img"
          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
          image={album.thumbnailUrl}
          alt={album.name}
        />
      </Box>
      <CardContent sx={{ width: '100%', textAlign: 'center' }}>
        <Typography variant="subtitle1">{album.name}</Typography>
        <Typography variant="body2">{album.artist.name}</Typography>
        <Typography variant="body2">{album.releaseYear} | {album.songCount} | {album.durationFormatted}</Typography>

      </CardContent>
    </Card>    
  );
}
