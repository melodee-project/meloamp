import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { Playlist, Song } from '../apiModels';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useQueueStore } from '../queueStore';
import { PlayArrow } from '@mui/icons-material';

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const navigate = useNavigate();
  const clearQueue = useQueueStore((state: any) => state.clearQueue);
  const addToQueue = useQueueStore((state: any) => state.addToQueue);
  const setCurrent = useQueueStore((state: any) => state.setCurrent);
  const playNow = useQueueStore((state: any) => state.playNow);
  const [hovered, setHovered] = React.useState(false);

  // Handler for clicking the playlist image
  const handlePlayPlaylist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.get<{ data: Song[] }>(`/playlists/${playlist.id}/songs`);
      const songs: Song[] = res.data.data;
      if (songs.length === 0) return;
      playNow(songs); // Play the entire playlist at once
    } catch (err) {
      // Optionally show error
    }
  };

  return (
    <Card
      sx={{ minWidth: 250, maxWidth: 345, m: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
      onClick={() => navigate(`/playlists/${playlist.id}`)}
    >
      <Box
        sx={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardMedia
          component="img"
          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', filter: hovered ? 'brightness(0.7)' : 'none', transition: 'filter 0.2s' }}
          image={playlist.thumbnailUrl}
          alt={playlist.name}
          onClick={handlePlayPlaylist}
        />
        {hovered && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 1,
          }}>
            <PlayArrow sx={{ fontSize: 40, color: 'white', opacity: 0.9 }} />
          </Box>
        )}
      </Box>
      <CardContent sx={{ width: '100%', textAlign: 'center' }}>
        <Typography variant="h6">{playlist.name}</Typography>
        <Typography variant="body2">{playlist.songCount} | {playlist.durationFormatted }</Typography>
      </CardContent>
    </Card>
  );
}
