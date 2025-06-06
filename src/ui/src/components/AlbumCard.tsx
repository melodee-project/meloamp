import React from 'react';
import { Box, Typography } from '@mui/material';
import { Album } from '../apiModels';

export default function AlbumCard({ album }: { album: Album }) {
  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, minWidth: 180, m: 1 }}>
      <img src={album.thumbnailUrl} alt={album.name} style={{ width: '100%', borderRadius: '4px' }} />
      <Typography variant="h6">{album.name}</Typography>
      <Typography variant="body2">Artist: {album.artist.name}</Typography>
      <Typography variant="body2">Year: {album.releaseYear}</Typography>
    </Box>
  );
}
