import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Pagination, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Album, PaginatedResponse } from '../apiModels';
import AlbumCard from '../components/AlbumCard';

type AlbumSortField = 'Name' | 'ReleaseDate' | 'SongCount' | 'Duration' | 'LastPlayedAt' | 'PlayedCount' | 'CalculatedRating';

export default function BrowseAlbums() {
  const { t } = useTranslation();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<AlbumSortField>('ReleaseDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse<Album>>('/albums', { 
      params: { 
        page, 
        pageSize: 20,
        orderBy: sortBy,
        orderDirection: sortDirection
      } 
    })
      .then((res) => {
        setAlbums(res.data.data);
        setTotal(res.data.meta?.totalCount || 0);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [page, sortBy, sortDirection]);

  const handleSortChange = (field: AlbumSortField) => {
    if (field === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection(field === 'ReleaseDate' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">{t('nav.albums')}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="album-sort-label">{t('sort.sortBy')}</InputLabel>
            <Select
              labelId="album-sort-label"
              value={sortBy}
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
      {loading ? <CircularProgress /> : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} compact />
          ))}
        </Box>
      )}
      <Pagination
        count={Math.ceil(total / 20)}
        page={page}
        onChange={(_, value) => setPage(value)}
        sx={{ mt: 2 }}
      />
      <Typography variant="body2" sx={{ mt: 1 }}>
        {t('common.viewing', {
          from: (page - 1) * 20 + 1,
          to: Math.min(page * 20, total),
          total
        })}
      </Typography>
    </Box>
  );
}
