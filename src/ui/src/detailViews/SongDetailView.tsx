import { debugLog, debugError } from '../debug';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, CardContent, CardMedia, IconButton, Tooltip, Rating, Stack } from '@mui/material';
import { Favorite, FavoriteBorder, ThumbDown, ThumbDownOffAlt, PlayArrow, QueueMusic, SkipNext } from '@mui/icons-material';
import { apiRequest } from '../api';
import api from '../api';
import { Song } from '../apiModels';
import { useTranslation } from 'react-i18next';
import MiniArtistCard from '../components/MiniArtistCard';
import { useQueueStore } from '../queueStore';
import { toQueueSong } from '../components/toQueueSong';
import { useNavigate } from 'react-router-dom';

export default function SongDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [hated, setHated] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [favLoading, setFavLoading] = useState(false);
  const { t } = useTranslation();
  const playNow = useQueueStore(state => state.playNow);
  const addToQueue = useQueueStore(state => state.addToQueue);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest(`/songs/${id}`)
      .then(res => {
        const songData = res.data as Song;
        setSong(songData);
        setFavorite(songData.userStarred ?? false);
        setHated(songData.userRating === -1);
        setRating(songData.userRating && songData.userRating > 0 ? songData.userRating : 0);
      })
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load song.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlayNow = () => {
    if (!song) return;
    playNow(toQueueSong(song));
  };

  const handleAddToQueue = () => {
    if (!song) return;
    addToQueue(toQueueSong(song));
  };

  const handleFavorite = async () => {
    if (!song) return;
    setFavLoading(true);
    try {
      const newVal = !favorite;
      debugLog('SongDetailView', ` Toggling favorite for song ${song.id} to ${newVal}`);
      await api.post(`/songs/starred/${song.id}/${newVal}`);
      setFavorite(newVal);
      if (newVal && hated) {
        setHated(false);
      }
      debugLog('SongDetailView', ` Favorite updated successfully`);
    } catch (err) {
      debugError('SongDetailView', 'Failed to update favorite:', err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleHated = async () => {
    if (!song) return;
    setFavLoading(true);
    try {
      const newVal = !hated;
      debugLog('SongDetailView', ` Toggling hated for song ${song.id} to ${newVal}`);
      await api.post(`/songs/hated/${song.id}/${newVal}`);
      setHated(newVal);
      if (newVal && favorite) {
        setFavorite(false);
      }
      if (newVal) {
        setRating(0);
      }
      debugLog('SongDetailView', ` Hated updated successfully`);
    } catch (err) {
      debugError('SongDetailView', 'Failed to update hated:', err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleRatingChange = async (_e: React.SyntheticEvent, newValue: number | null) => {
    if (!song) return;
    const r = newValue ?? 0;
    try {
      debugLog('SongDetailView', ` Setting rating for song ${song.id} to ${r}`);
      await api.post(`/songs/setrating/${song.id}/${r}`);
      setRating(r);
      if (r > 0 && hated) {
        setHated(false);
      }
      debugLog('SongDetailView', ` Rating updated successfully`);
    } catch (err) {
      debugError('SongDetailView', 'Failed to update rating:', err);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{error}</Box>;
  if (!song) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default', boxShadow: 4 }}>
        {/* Song title at top */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            mb: 3,
            wordBreak: 'break-word',
          }}
        >
          {song.title}
        </Typography>

        {/* Main content: image + details */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* Left: Song/Album image */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 220, flex: '0 0 220px', gap: 2 }}>
            <CardMedia
              component="img"
              sx={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 3, boxShadow: 2 }}
              image={song.imageUrl || song.thumbnailUrl || song.album?.imageUrl || song.album?.thumbnailUrl}
              alt={song.title}
            />
            {/* Play controls */}
            <Stack direction="row" spacing={1}>
              <Tooltip title={t('songCard.playNow', 'Play Now')}>
                <IconButton onClick={handlePlayNow} color="success" size="large">
                  <PlayArrow fontSize="large" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('songCard.playNext', 'Play Next')}>
                <IconButton onClick={handleAddToQueue} color="primary" size="large">
                  <SkipNext fontSize="large" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('songCard.addLast', 'Add to Queue')}>
                <IconButton onClick={handleAddToQueue} color="primary" size="large">
                  <QueueMusic fontSize="large" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Right: Song details */}
          <CardContent sx={{ flex: 1, pt: 0 }}>
            {/* Like/Dislike/Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Tooltip title={favorite ? t('songCard.unfavorite') : t('songCard.favorite')}>
                <span>
                  <IconButton color={favorite ? 'primary' : 'default'} onClick={handleFavorite} disabled={favLoading} size="large">
                    {favorite ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </span>
              </Tooltip>
              <Rating
                value={rating}
                onChange={handleRatingChange}
                size="large"
              />
              <Tooltip title={hated ? t('songCard.unhate') : t('songCard.hate')}>
                <span>
                  <IconButton color={hated ? 'error' : 'default'} onClick={handleHated} disabled={favLoading} size="large">
                    {hated ? <ThumbDown /> : <ThumbDownOffAlt />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {/* Artist */}
            {song.artist && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>{t('songDetail.artist', 'Artist')}</Typography>
                <MiniArtistCard artist={song.artist} />
              </Box>
            )}

            {/* Album */}
            {song.album && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>{t('songDetail.album', 'Album')}</Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                  onClick={() => navigate(`/albums/${song.album?.id}`)}
                >
                  {(song.album.imageUrl || song.album.thumbnailUrl) && (
                    <CardMedia
                      component="img"
                      sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
                      image={song.album.imageUrl || song.album.thumbnailUrl}
                      alt={song.album.name}
                    />
                  )}
                  <Box>
                    <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {song.album.name}
                    </Typography>
                    {song.album.releaseYear && (
                      <Typography variant="caption" color="text.secondary">
                        {song.album.releaseYear}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Song metadata */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('songDetail.trackNumber', 'Track')}:</strong> {song.songNumber || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('songDetail.duration', 'Duration')}:</strong> {song.durationFormatted || '—'}
              </Typography>
              {song.genre && (
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('songDetail.genre', 'Genre')}:</strong> {song.genre}
                </Typography>
              )}
              {song.playCount !== undefined && (
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('songDetail.playCount', 'Play Count')}:</strong> {song.playCount}
                </Typography>
              )}
            </Box>

            {/* Timestamps */}
            <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.secondary' }}>
              {t('common.created')}: {song.createdAt && !isNaN(new Date(song.createdAt).getTime()) ? new Date(song.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} | {t('common.updated')}: {song.updatedAt && !isNaN(new Date(song.updatedAt).getTime()) ? new Date(song.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </Typography>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
}
