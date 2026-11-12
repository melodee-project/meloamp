import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Pagination, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { API_ROUTES } from '../apiRoutes';
import { Album } from '../apiModels';
import AlbumCard from '../components/AlbumCard';
import ErrorState from '../components/ErrorState';
import { usePaginatedList } from '../hooks/usePaginatedList';

type AlbumSortField = 'Name' | 'ReleaseDate' | 'SongCount' | 'Duration' | 'LastPlayedAt' | 'PlayedCount' | 'CalculatedRating';

export default function BrowseAlbums() {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<AlbumSortField>('ReleaseDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { items: albums, total, page, pageSize, setPage, loading, error, reload } = usePaginatedList<Album>({
    path: API_ROUTES.albums.list,
    params: { orderBy: sortBy, orderDirection: sortDirection },
  });

  const handleSortChange = (field: AlbumSortField) => {
    if (field === sortBy) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
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
              onChange={(event) => handleSortChange(event.target.value as AlbumSortField)}
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
          <IconButton
            onClick={() => setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'))}
            size="small"
            aria-label={t('sort.toggleDirection', 'Toggle sort direction')}
          >
            {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
          </IconButton>
        </Box>
      </Box>
      {error ? (
        <ErrorState message={error} onRetry={reload} fullPage={false} />
      ) : loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} compact />
          ))}
        </Box>
      )}
      <Pagination
        count={Math.max(1, Math.ceil(total / pageSize))}
        page={page}
        onChange={(_, value) => setPage(value)}
        sx={{ mt: 2 }}
      />
      <Typography variant="body2" sx={{ mt: 1 }}>
        {t('common.viewing', {
          from: (page - 1) * pageSize + 1,
          to: Math.min(page * pageSize, total),
          total,
        })}
      </Typography>
    </Box>
  );
}
