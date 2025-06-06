import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { Playlist } from '../apiModels';

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Card sx={{ maxWidth: 345, m: 1 }}>
      <CardMedia
        component="img"
        height="140"
        image={playlist.thumbnailUrl}
        alt={playlist.name}
      />
      <CardContent>
        <Typography variant="h6">{playlist.name}</Typography>
        <Typography variant="body2">Songs: {playlist.songCount}</Typography>
        <Typography variant="body2">Owner: {playlist.owner.username}</Typography>
      </CardContent>
    </Card>
  );
}
