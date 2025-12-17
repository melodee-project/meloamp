import { debugLog, debugError } from '../debug';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, CardContent, CardMedia, IconButton, Tooltip, List, ListItem, Rating } from '@mui/material';
import { Favorite, FavoriteBorder, ThumbDown, ThumbDownOffAlt, PlayArrow } from '@mui/icons-material';
import { apiRequest } from '../api';
import api from '../api';
import { Album, Song, PaginatedResponse } from '../apiModels';
import { useTranslation } from 'react-i18next';
import MiniArtistCard from '../components/MiniArtistCard';
import { useQueueStore } from '../queueStore';
import MiniSongCard from '../components/MiniSongCard';

export default function AlbumDetailView() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const { t } = useTranslation();
  const setQueue = useQueueStore((state: any) => state.setQueue);
  const setCurrent = useQueueStore((state: any) => state.setCurrent);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest(`/albums/${id}`)
      .then(res => {
        const albumData = res.data as Album & { userStarred?: boolean; userDisliked?: boolean; userRating?: number };
        setAlbum(albumData);
        setFavorite(albumData.userStarred ?? false);
        setDisliked(albumData.userDisliked ?? false);
        setRating(albumData.userRating && albumData.userRating > 0 ? albumData.userRating : 0);
      })
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load album.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setSongsLoading(true);
    debugLog('AlbumDetailView', 'Fetching songs for album id:', id);
    apiRequest(`/albums/${id}/songs`, { params: { page: 1, pageSize: 100 } })
      .then(res => {
        debugLog('AlbumDetailView', 'Songs API response:', res.data);
        const response = res.data as PaginatedResponse<Song>;
        setSongs(response.data);
      })
      .catch((err) => {
        debugError('AlbumDetailView', 'Error fetching songs:', err);
        setSongs([])
      })
      .finally(() => {
        setSongsLoading(false);
        debugLog('AlbumDetailView', 'Songs loading finished.');
      });
  }, [id]);

  const handleFavorite = async () => {
    if (!album) return;
    setFavLoading(true);
    try {
      debugLog('AlbumDetailView', 'Toggling favorite for album:', album.id, 'to:', !favorite);
      const response = await api.post(`/albums/starred/${album.id}/${!favorite}`);
      debugLog('AlbumDetailView', 'Favorite response:', response);
      setFavorite(!favorite);
      // If favoriting, clear dislike
      if (!favorite) {
        setDisliked(false);
        setRating(1);
      }
    } catch (err: any) {
      debugError('AlbumDetailView', 'Failed to toggle favorite:', err?.response?.data || err?.message || err);
    }
    setFavLoading(false);
  };

  const handleDislike = async () => {
    if (!album) return;
    setFavLoading(true);
    try {
      const newVal = !disliked;
      debugLog('AlbumDetailView', 'Setting hated for album:', album.id, 'to:', newVal);
      const response = await api.post(`/albums/hated/${album.id}/${newVal}`);
      debugLog('AlbumDetailView', 'Hated response:', response);
      setDisliked(newVal);
      // If disliking, clear favorite
      if (newVal) {
        setFavorite(false);
        setRating(0);
      }
    } catch (err: any) {
      debugError('AlbumDetailView', 'Failed to toggle hated:', err?.response?.data || err?.message || err);
    }
    setFavLoading(false);
  };

  const handleRating = async (newRating: number | null) => {
    if (!album) return;
    const r = newRating === null ? 0 : newRating;
    setRatingLoading(true);
    try {
      debugLog('AlbumDetailView', 'Setting rating for album:', album.id, 'to:', r);
      const response = await api.post(`/albums/setrating/${album.id}/${r}`);
      debugLog('AlbumDetailView', 'Rating response:', response);
      setRating(r);
      // Clear dislike if rating > 0
      if (r > 0) setDisliked(false);
    } catch (err: any) {
      debugError('AlbumDetailView', 'Failed to set rating:', err?.response?.data || err?.message || err);
    }
    setRatingLoading(false);
  };

  const handlePlayAlbum = () => {
    if (!songs || songs.length === 0) return;
    
    // Transform API Song objects to Queue Song objects
    const queueSongs = songs.map(song => ({
      ...song,
      url: song.streamUrl  // Map streamUrl to url for queue compatibility
    }));
    
    setQueue(queueSongs);
    setCurrent(0);
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{error}</Box>;
  if (!album) return null;

  return (
    <Box sx={{ p: 3 }}>
    <Card sx={{ p: { xs: 1, sm: 3 }, bgcolor: 'background.default', boxShadow: 4 }}>
      {/* Album name and artist at the top */}
      <Box sx={{ width: '100%', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        {album.artist && (
          <MiniArtistCard artist={album.artist} />
        )}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            minWidth: 0,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            width: '100%',
            textAlign: 'center',
            flex: 1
          }}
        >
          {album.name}
        </Typography>
      </Box>
      {/* Main content row: image, actions, meta */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%', gap: 4 }}>
        {/* Left: Album image */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 220, flex: '0 0 220px', gap: 2 }}>
          <CardMedia
            component="img"
            sx={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 3, boxShadow: 2, mb: 1 }}
            image={album.imageUrl || album.thumbnailUrl}
          />
        </Box>
        {/* Right: actions and album meta */}
        <CardContent sx={{ flex: 1, width: '100%', pt: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1, minWidth: 0 }}>
            <Tooltip title={t('albumDetail.playAlbum', 'Play Album')}>
              <span>
                <IconButton onClick={handlePlayAlbum} color="success">
                  <PlayArrow />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={favorite ? t('common.unfavorite') : t('common.favorite')}>
              <span>
                <IconButton onClick={handleFavorite} disabled={favLoading} color={favorite ? 'primary' : 'default'}>
                  {favorite ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={disliked ? t('common.undislike') : t('common.dislike')}>
              <span>
                <IconButton onClick={handleDislike} disabled={favLoading} color={disliked ? 'error' : 'default'}>
                  {disliked ? <ThumbDown /> : <ThumbDownOffAlt />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t('common.rating', 'Rating')}>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                {ratingLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Rating
                    value={rating}
                    max={5}
                    onChange={(_, v) => handleRating(v)}
                    size="medium"
                  />
                )}
              </Box>
            </Tooltip>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t('albumDetail.releaseYear')}: <span style={{ fontWeight: 400 }}>{album.releaseYear}</span></Typography>
            {Array.isArray((album as any).genres) && (album as any).genres.length > 0 ? (
              <Typography variant="body2" sx={{ mb: 1 }}>{t('albumDetail.genres')}: {(album as any).genres.join(', ')}</Typography>
            ) : album.genre ? (
              <Typography variant="body2" sx={{ mb: 1 }}>{t('albumDetail.genre')}: {album.genre}</Typography>
            ) : null}
            {album.description && (
              <Typography variant="body2" sx={{ mb: 1 }}>{album.description}</Typography>
            )}
            <Typography variant="body2" sx={{ mb: 1 }}>{t('albumDetail.tracks')}: {album.songCount}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>{t('albumDetail.duration')}: {album.durationFormatted}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>{t('common.created')}: {new Date(album.createdAt).toLocaleDateString()}</Typography>
            {album.updatedAt && !isNaN(Date.parse(album.updatedAt)) && (
              <Typography variant="caption" color="text.secondary">{t('common.updated')}: {new Date(album.updatedAt).toLocaleDateString()}</Typography>
            )}
          </Box>
        </CardContent>
      </Box>
      {/* Song List */}
      <Box sx={{ mt: 4, bgcolor: 'background.paper', borderRadius: 2, p: 2, boxShadow: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('albumDetail.tracks')}</Typography>
        {songsLoading ? (
          <Typography variant="body2" color="text.secondary">{t('albumDetail.loadingTracks', 'Loading songs...')}</Typography>
        ) : songs.length > 0 ? (
          <List disablePadding>
            {songs.map((song: Song, idx: number) => (
              <ListItem key={song.id} disableGutters disablePadding sx={{ width: '100%', px: 0 }}>
                <MiniSongCard song={song} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">{t('albumDetail.noTracks')}</Typography>
        )}
      </Box>
    </Card>
    </Box>
  );
}
