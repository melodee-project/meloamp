import { debugLog, debugError } from '../debug';
import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent, IconButton, Tooltip, Stack, Snackbar, Alert } from '@mui/material';
import { Favorite, FavoriteBorder, ThumbDown, ThumbDownOffAlt, QueueMusic, SkipNext, PlaylistAdd } from '@mui/icons-material';
import { Song } from '../apiModels';
import { useNavigate } from 'react-router-dom';
import { useQueueStore } from '../queueStore';
import { toQueueSong } from './toQueueSong';
import { useTranslation } from 'react-i18next';
import api from '../api';
import PlaylistPickerDialog from './PlaylistPickerDialog';

interface SongCardProps {
  song: Song;
  maxWidth?: number | string;
  displaySongNumber?: boolean;
}

const SongCardComponent = function SongCard({ song, maxWidth = 345, displaySongNumber = false }: SongCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Use stable selectors for each store value/action
  const playNow = useQueueStore(state => state.playNow);
  const addToQueue = useQueueStore(state => state.addToQueue);
  const addToQueueNext = useQueueStore(state => state.addToQueueNext);
  const [favorite, setFavorite] = React.useState(song.userStarred);
  const [playlistDialogOpen, setPlaylistDialogOpen] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [hated, setHated] = React.useState(song.userRating === -1);
  const [hovered, setHovered] = React.useState(false);

  // Play now: clear queue, add song, set current
  const handlePlayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    debugLog('SongCard', 'Play now clicked:', {
      songId: song.id,
      title: song.title,
      streamUrl: song.streamUrl,
      hasStreamUrl: !!song.streamUrl
    });
    playNow(toQueueSong(song));
  };

  // Play next: insert after current
  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueueNext(toQueueSong(song));
  };

  // Add as last in queue
  const handleAddLast = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(toQueueSong(song));
  };

  // Toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !favorite;
    try {
      debugLog('SongCard', ` Toggling favorite for song ${song.id} to ${newVal}`);
      await api.post(`/songs/starred/${song.id}/${newVal}`);
      setFavorite(newVal);
      // If starring, clear hated state
      if (newVal && hated) {
        setHated(false);
      }
      debugLog('SongCard', ` Favorite updated successfully`);
    } catch (err) {
      debugError('SongCard', 'Failed to update favorite:', err);
    }
  };

  // Toggle hated
  const handleToggleHated = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !hated;
    try {
      debugLog('SongCard', ` Toggling hated for song ${song.id} to ${newVal}`);
      await api.post(`/songs/hated/${song.id}/${newVal}`);
      setHated(newVal);
      // If hating, clear favorite
      if (newVal && favorite) {
        setFavorite(false);
      }
      debugLog('SongCard', ` Hated updated successfully`);
    } catch (err) {
      debugError('SongCard', 'Failed to update hated:', err);
    }
  };

  // Add to playlist
  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylistDialogOpen(true);
  };

  const handlePlaylistSuccess = (playlistName: string, action: 'created' | 'added') => {
    const message = action === 'created' 
      ? t('playlist.createSuccess', { name: playlistName })
      : t('playlist.addSuccess', { name: playlistName });
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const handlePlaylistError = (message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  return (
    <>
    <Card sx={{
      minWidth: 250,
      maxWidth,
      m: 1,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      p: 1,
    }}>
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
        <Typography variant="subtitle1" noWrap>
          {displaySongNumber && (
            <Box component="span" sx={{
              fontWeight: 700,
              mr: 1,
              color: 'background.paper',
              bgcolor: 'secondary.main',
              px: 1.2,
              borderRadius: 2,
              boxShadow: 2,
              letterSpacing: 1,
              fontSize: '0.95em',
              display: 'inline-block',
              lineHeight: 1.2,
            }}>
              {song.songNumber}
            </Box>
          )}
          {song.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          [
          {song.album?.releaseYear || '----'}
          ]{' '}
          <Box component="span" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/albums/${song.album?.id}`); }}>
            {song.album?.name || t('songCard.unknownAlbum')}
          </Box>
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          <Box component="span" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/artists/${song.artist?.id}`); }}>
            {song.artist?.name || t('songCard.unknownArtist')}
          </Box>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {song.durationFormatted} | #{song.songNumber}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Tooltip title={t('songCard.playNext')}>
            <IconButton size="small" onClick={handlePlayNext}><SkipNext /></IconButton>
          </Tooltip>
          <Tooltip title={favorite ? t('songCard.unfavorite') : t('songCard.favorite')}>
            <IconButton size="small" color={favorite ? 'primary' : 'default'} onClick={handleToggleFavorite}>
              {favorite ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title={hated ? t('songCard.unhate') : t('songCard.hate')}>
            <IconButton size="small" color={hated ? 'error' : 'default'} onClick={handleToggleHated}>
              {hated ? <ThumbDown /> : <ThumbDownOffAlt />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('songCard.addLast')}>
            <IconButton size="small" onClick={handleAddLast}><QueueMusic /></IconButton>
          </Tooltip>
          <Tooltip title={t('songCard.addToPlaylist')}>
            <IconButton size="small" onClick={handleAddToPlaylist}><PlaylistAdd /></IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
    
    {/* Playlist picker dialog */}
    <PlaylistPickerDialog
      open={playlistDialogOpen}
      onClose={() => setPlaylistDialogOpen(false)}
      songIds={[song.id]}
      onSuccess={handlePlaylistSuccess}
      onError={handlePlaylistError}
    />
    
    {/* Snackbar for feedback */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
        severity={snackbar.severity}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
}

export default React.memo(SongCardComponent);
