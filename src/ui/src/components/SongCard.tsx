import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent, IconButton, Tooltip, Stack } from '@mui/material';
import { Favorite, FavoriteBorder, ThumbDown, ThumbDownOffAlt, QueueMusic, SkipNext } from '@mui/icons-material';
import { Song } from '../apiModels';
import { useNavigate } from 'react-router-dom';
import { useQueueStore } from '../queueStore';

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  const navigate = useNavigate();
  const clearQueue = useQueueStore((state: any) => state.clearQueue);
  const addToQueue = useQueueStore((state: any) => state.addToQueue);
  const setCurrent = useQueueStore((state: any) => state.setCurrent);
  const queue = useQueueStore((state: any) => state.queue);
  const [favorite, setFavorite] = React.useState(song.userStarred);
  const [hated, setHated] = React.useState(song.userRating === -1);
  const [hovered, setHovered] = React.useState(false);

  // Play now: clear queue, add song, set current
  const handlePlayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearQueue();
    addToQueue(song);
    setCurrent(0);
  };

  // Play next: insert after current
  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Insert after current song in queue
    // (Assume addToQueue can take an index, otherwise append)
    // For now, just append
    addToQueue(song);
  };

  // Add as last in queue
  const handleAddLast = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
  };

  // Toggle favorite
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite((prev) => !prev);
    // TODO: Call API to update favorite
  };

  // Toggle hated
  const handleToggleHated = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHated((prev) => !prev);
    // TODO: Call API to update hated
  };

  return (
    <Card sx={{ minWidth: 250, maxWidth: 345, m: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', p: 1 }}>
      <Box
        sx={{ width: 64, height: 64, mr: 2, position: 'relative', cursor: 'pointer' }}
        onClick={handlePlayNow}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardMedia
          component="img"
          sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, filter: hovered ? 'brightness(0.7)' : 'brightness(0.95)', transition: 'filter 0.2s' }}
          image={song.imageUrl || song.thumbnailUrl}
          alt={song.title}
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
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="black" fillOpacity="0.4" />
              <polygon points="16,12 30,20 16,28" fill="white" />
            </svg>
          </Box>
        )}
      </Box>
      <CardContent sx={{ flex: 1, p: 0 }}>
        <Typography variant="subtitle1" noWrap>{song.title}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          [
          {song.album?.releaseYear || '----'}
          ]{' '}
          <Box component="span" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/albums/${song.album?.id}`); }}>
            {song.album?.name || 'Unknown Album'}
          </Box>
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          <Box component="span" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/artists/${song.artist?.id}`); }}>
            {song.artist?.name || 'Unknown Artist'}
          </Box>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {song.durationFormatted} | #{song.songNumber}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Tooltip title="Play Next">
            <IconButton size="small" onClick={handlePlayNext}><SkipNext /></IconButton>
          </Tooltip>
          <Tooltip title={favorite ? 'Unfavorite' : 'Favorite'}>
            <IconButton size="small" color={favorite ? 'primary' : 'default'} onClick={handleToggleFavorite}>
              {favorite ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title={hated ? 'Unhate' : 'Hate'}>
            <IconButton size="small" color={hated ? 'error' : 'default'} onClick={handleToggleHated}>
              {hated ? <ThumbDown /> : <ThumbDownOffAlt />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Add as Last in Queue">
            <IconButton size="small" onClick={handleAddLast}><QueueMusic /></IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}
