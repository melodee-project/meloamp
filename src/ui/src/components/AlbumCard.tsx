import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Album, Song } from '../apiModels';
import api from '../api';
import { useQueueStore } from '../queueStore';
import { PlayArrow } from '@mui/icons-material';
import { toQueueSong } from './toQueueSong';
import { useTranslation } from 'react-i18next';

export default function AlbumCard({ album }: { album: Album }) {
  const navigate = useNavigate();
  const playNow = useQueueStore((state: any) => state.playNow);
  const [hovered, setHovered] = React.useState(false);
  const { t } = useTranslation();

  // Handler for clicking the album image
  const handlePlayAlbum = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.get<{ data: Song[] }>(`/albums/${album.id}/songs`);
      const songs: Song[] = res.data.data;
      if (songs.length === 0) return;
      // Map songs to include url property for the player
      const queueSongs = songs.map(toQueueSong);
      playNow(queueSongs); // Play the entire album at once
    } catch (err) {
      // Optionally show error
    }
  };

  return (
    <Card
      sx={{ width: 200, m: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
      onClick={() => navigate(`/albums/${album.id}`)}
    >
      <Box
        sx={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardMedia
          component="img"
          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', filter: hovered ? 'brightness(0.7)' : 'none', transition: 'filter 0.2s' }}
          image={album.thumbnailUrl}
          alt={album.name}
          onClick={handlePlayAlbum}
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
        <Typography
          variant="subtitle1"
          noWrap
          title={album.name}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            display: 'block',
            cursor: 'pointer',
          }}
          onClick={e => {
            e.stopPropagation();
            navigate(`/albums/${album.id}`);
          }}
        >
          {album.name}
        </Typography>
        <Typography variant="body2">{album.artist.name}</Typography>
        <Typography variant="body2">{album.releaseYear} | {t('albumCard.songs', { count: album.songCount })} | {album.durationFormatted}</Typography>
      </CardContent>
    </Card>    
  );
}
