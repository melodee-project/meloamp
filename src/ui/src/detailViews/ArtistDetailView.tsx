import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, CardContent, CardMedia, Button, Chip, Stack, IconButton, Tooltip } from '@mui/material';
import { apiRequest } from '../api';
import api from '../api';
import { Artist, Album, PaginatedResponse } from '../apiModels';
import { useTranslation } from 'react-i18next';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import AlbumCard from '../components/AlbumCard';

export default function ArtistDetailView() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [dislike, setDislike] = useState(false);
  const { t } = useTranslation();

  // Fetch artist and albums
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiRequest(`/artists/${id}`),
      apiRequest(`/artists/${id}/albums`)
    ])
      .then(([artistRes, albumsRes]) => {
        setArtist(artistRes.data as Artist);
        setAlbums((albumsRes.data as PaginatedResponse<Album>).data || []);
        setDislike((artistRes.data as Artist).userRating === -1);
      })
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load artist.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Favorite/Unfavorite
  const handleFavorite = async () => {
    if (!artist) return;
    setFavLoading(true);
    try {
      await api.post(`/artists/starred/${artist.id}/${!artist.userStarred}`);
      setArtist({ ...artist, userStarred: !artist.userStarred, userRating: !artist.userStarred ? 1 : 0 });
      setDislike(false);
    } catch {
      // Optionally show error
    } finally {
      setFavLoading(false);
    }
  };

  // Dislike/Undislike
  const handleDislike = async () => {
    if (!artist) return;
    setFavLoading(true);
    try {
      // If already disliked, reset to 0; else set to -1
      const newRating = dislike ? 0 : -1;
      await api.post(`/artists/rating/${artist.id}/${newRating}`);
      setArtist({ ...artist, userStarred: false, userRating: newRating });
      setDislike(!dislike);
    } catch {
      // Optionally show error
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{error}</Box>;
  if (!artist) return null;

  return (
    <Box sx={{ maxWidth: 800, m: 'auto', mt: 4 }}>
      <Card sx={{ maxWidth: 600, m: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
          <CardMedia
            component="img"
            sx={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 2, mb: { xs: 2, sm: 0 } }}
            image={artist.imageUrl || artist.thumbnailUrl}
            alt={artist.name}
          />
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>{artist.name}</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Tooltip title={artist.userStarred ? t('songCard.unfavorite') : t('songCard.favorite')}>
                <span>
                  <IconButton color={artist.userStarred ? 'primary' : 'default'} onClick={handleFavorite} disabled={favLoading} size="large">
                    {artist.userStarred ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={dislike ? t('songCard.unhate') : t('songCard.hate')}>
                <span>
                  <IconButton color={dislike ? 'error' : 'default'} onClick={handleDislike} disabled={favLoading} size="large">
                    {dislike ? <ThumbDownIcon /> : <ThumbDownOffAltIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            <Typography variant="subtitle1">{t('artistDetail.albums')}: {artist.albumCount}</Typography>
            <Typography variant="subtitle1">{t('artistDetail.songs')}: {artist.songCount}</Typography>
            {artist.genres && artist.genres.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {artist.genres.map((g) => <Chip key={g} label={g} size="small" sx={{ mr: 0.5 }} />)}
              </Box>
            )}
            {artist.biography && <Typography variant="body2" sx={{ mt: 2 }}>{artist.biography}</Typography>}
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
              {t('common.createdAt', { date: new Date(artist.createdAt).toLocaleDateString() })} | {t('common.updatedAt', { date: new Date(artist.updatedAt).toLocaleDateString() })}
            </Typography>
          </CardContent>
        </Box>
      </Card>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{t('artistDetail.albums')}</Typography>
        {albums.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t('artistDetail.noAlbums') || 'No albums found.'}</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {albums.map(album => <AlbumCard key={album.id} album={album} />)}
          </Box>
        )}
      </Box>
    </Box>
  );
}
