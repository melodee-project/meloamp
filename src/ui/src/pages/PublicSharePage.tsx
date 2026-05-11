import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Album,
  Group,
  MusicNote,
  PlaylistPlay,
  PlayArrow,
  Person,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiRequest, buildEndpoint } from '../api';
import { API_ROUTES } from '../apiRoutes';
import { PublicShareResponse, PublicSongInfo } from '../apiModels';
import { useQueueStore, Song as QueueSong } from '../queueStore';

function formatDuration(totalMs: number) {
  if (!totalMs || totalMs <= 0) {
    return '0:00';
  }
  const seconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function buildQueueSong(song: PublicSongInfo, share: PublicShareResponse): QueueSong {
  const artistName = song.title ? '' : '';
  const artist = {
    id: share.artist?.id || '',
    thumbnailUrl: '',
    imageUrl: '',
    name: share.artist?.name || 'Unknown Artist',
    userStarred: false,
    userRating: 0,
    albumCount: 0,
    songCount: 0,
    createdAt: '',
    updatedAt: '',
  };

  const album = {
    id: share.album?.id || share.playlist?.id || song.id,
    artist,
    thumbnailUrl: share.thumbnailUrl || share.imageUrl || '',
    imageUrl: share.imageUrl || share.thumbnailUrl || '',
    name: share.album?.name || share.playlist?.name || song.title,
    releaseYear: Number(share.album?.releaseYear || 0),
    userStarred: false,
    userRating: 0,
    songCount: share.album?.songs?.length || share.playlist?.songs?.length || 1,
    durationMs: 0,
    durationFormatted: '',
    createdAt: '',
    updatedAt: '',
    description: null,
    genre: share.playlist ? null : null,
  };

  return {
    id: song.id,
    title: song.title,
    artist: artist as QueueSong['artist'],
    album: album as QueueSong['album'],
    imageUrl: share.imageUrl || share.thumbnailUrl || '',
    url: song.streamUrl,
    durationMs: song.durationMs || 0,
    userStarred: false,
    userRating: 0,
  };
}

function resolveSharedSongs(share: PublicShareResponse): PublicSongInfo[] {
  if (share.song) return [share.song];
  if (share.album?.songs && Array.isArray(share.album.songs)) return share.album.songs;
  if (share.playlist?.songs && Array.isArray(share.playlist.songs)) return share.playlist.songs;
  return [];
}

export default function PublicSharePage() {
  const { shareUniqueId = '' } = useParams<{ shareUniqueId: string }>();
  const { t } = useTranslation();
  const [share, setShare] = useState<PublicShareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addToQueue = useQueueStore((state) => state.addToQueue);

  useEffect(() => {
    const loadShare = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest(buildEndpoint(API_ROUTES.shares.public, { shareUniqueId }));
        const data = response.data?.data ? response.data.data : response.data;
        setShare(data as PublicShareResponse);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    if (shareUniqueId) {
      loadShare();
    }
  }, [shareUniqueId, t]);

  const songs = share ? resolveSharedSongs(share) : [];
  const typeLabel = share?.shareType || '';
  const icon = (() => {
    switch (typeLabel) {
      case 'Album':
        return <Album sx={{ color: 'primary.main' }} />;
      case 'Artist':
        return <Group sx={{ color: 'primary.main' }} />;
      case 'Playlist':
        return <PlaylistPlay sx={{ color: 'primary.main' }} />;
      default:
        return <MusicNote sx={{ color: 'primary.main' }} />;
    }
  })();

  const playAll = () => {
    if (!share) return;
    songs.forEach((song) => {
      addToQueue(buildQueueSong(song, share));
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!share) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t('error.notFound', 'Shared item not found')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Person />
            {icon}
            <Typography variant="h5">{share.resourceName}</Typography>
          </Box>

          <Chip label={typeLabel} sx={{ mr: 1 }} />
          <Chip label={`${songs.length} songs`} variant="outlined" />

          {share.description && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              {share.description}
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {`Expires: ${share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : t('common.unknown', 'Never')}`}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Button
              startIcon={<PlayArrow />}
              variant="contained"
              onClick={playAll}
              disabled={songs.length === 0}
            >
              {t('queue.playAll', 'Play all')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {songs.length ? t('publicShare.songs', 'Songs') : t('publicShare.noSongs', 'No songs in this share')}
          </Typography>

          {!songs.length ? (
            <Typography color="text.secondary">{t('publicShare.noSongs', 'No songs in this share')}</Typography>
          ) : (
            <List dense>
              {songs.map((song, index) => (
                <React.Fragment key={song.id}>
                  <ListItem
                    secondaryAction={
                  <Button
                    size="small"
                    startIcon={<PlayArrow />}
                    onClick={() => addToQueue(buildQueueSong(song, share))}
                  >
                    {t('player.play')}
                  </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={share.imageUrl} alt={share.resourceName}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${index + 1}. ${song.title}`}
                      secondary={`${song.trackNumber ? `${song.trackNumber}. ` : ''}${formatDuration(song.durationMs)}`}
                    />
                  </ListItem>
                  {index < songs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
