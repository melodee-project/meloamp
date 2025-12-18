import { debugLog, debugError } from '../debug';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, CardContent, CardMedia, Chip, Stack, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { apiRequest } from '../api';
import api from '../api';
import { Artist, Album, PaginatedResponse } from '../apiModels';
import { useTranslation } from 'react-i18next';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import AlbumCard from '../components/AlbumCard';

type AlbumSortField = 'Name' | 'ReleaseDate' | 'SongCount' | 'Duration' | 'LastPlayedAt' | 'PlayedCount' | 'CalculatedRating';

export default function ArtistDetailView() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [dislike, setDislike] = useState(false);
  const [albumSort, setAlbumSort] = useState<AlbumSortField>('ReleaseDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { t } = useTranslation();

  // Fetch artist on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest(`/artists/${id}`)
      .then((artistRes) => {
        setArtist(artistRes.data as Artist);
        setDislike((artistRes.data as Artist).userRating === -1);
      })
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load artist.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch albums when sort changes
  useEffect(() => {
    if (!id) return;
    apiRequest(`/artists/${id}/albums`, { 
      params: { 
        page: 1, 
        pageSize: 100,
        orderBy: albumSort,
        orderDirection: sortDirection
      } 
    })
      .then((albumsRes) => {
        setAlbums((albumsRes.data as PaginatedResponse<Album>).data || []);
      })
      .catch(err => debugError('ArtistDetailView', 'Failed to load albums:', err));
  }, [id, albumSort, sortDirection]);

  const handleSortChange = (field: AlbumSortField) => {
    if (field === albumSort) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setAlbumSort(field);
      setSortDirection(field === 'ReleaseDate' ? 'desc' : 'asc');
    }
  };

  // Favorite/Unfavorite
  const handleFavorite = async () => {
    if (!artist) return;
    setFavLoading(true);
    try {
      const newVal = !artist.userStarred;
      debugLog('ArtistDetailView', ` Toggling favorite for artist ${artist.id} to ${newVal}`);
      await api.post(`/artists/starred/${artist.id}/${newVal}`);
      setArtist({ ...artist, userStarred: newVal, userRating: newVal ? 1 : 0 });
      setDislike(false);
      debugLog('ArtistDetailView', ` Favorite updated successfully`);
    } catch (err) {
      debugError('ArtistDetailView', 'Failed to update favorite:', err);
    } finally {
      setFavLoading(false);
    }
  };

  // Dislike/Undislike
  const handleDislike = async () => {
    if (!artist) return;
    setFavLoading(true);
    try {
      const newVal = !dislike;
      debugLog('ArtistDetailView', ` Toggling hated for artist ${artist.id} to ${newVal}`);
      await api.post(`/artists/hated/${artist.id}/${newVal}`);
      setArtist({ ...artist, userStarred: newVal ? false : artist.userStarred, userRating: newVal ? -1 : 0 });
      setDislike(newVal);
      debugLog('ArtistDetailView', ` Hated updated successfully`);
    } catch (err) {
      debugError('ArtistDetailView', 'Failed to update hated:', err);
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{error}</Box>;
  if (!artist) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
          <CardMedia
            component="img"
            sx={{ width: 210, height: 210, objectFit: 'cover', borderRadius: 2, mb: { xs: 2, sm: 0 } }}
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
              {t('common.created')}: {artist.createdAt && !isNaN(new Date(artist.createdAt).getTime()) ? new Date(artist.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '---'} | {t('common.updated')}: {artist.updatedAt && !isNaN(new Date(artist.updatedAt).getTime()) ? new Date(artist.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '---'}
            </Typography>
          </CardContent>
        </Box>
      </Card>
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">{t('artistDetail.albums')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="album-sort-label">{t('sort.sortBy')}</InputLabel>
              <Select
                labelId="album-sort-label"
                value={albumSort}
                label={t('sort.sortBy')}
                onChange={(e) => handleSortChange(e.target.value as AlbumSortField)}
              >
                <MenuItem value="Name">{t('sort.name')}</MenuItem>
                <MenuItem value="ReleaseDate">{t('sort.releaseDate')}</MenuItem>
                <MenuItem value="SongCount">{t('sort.songCount')}</MenuItem>
                <MenuItem value="Duration">{t('sort.duration')}</MenuItem>
                <MenuItem value="LastPlayedAt">{t('sort.lastPlayed')}</MenuItem>
                <MenuItem value="PlayedCount">{t('sort.playCount')}</MenuItem>
                <MenuItem value="CalculatedRating">{t('sort.rating')}</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} size="small">
              {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
            </IconButton>
          </Box>
        </Box>
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
