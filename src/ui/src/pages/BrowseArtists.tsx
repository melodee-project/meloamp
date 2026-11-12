import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Pagination, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { API_ROUTES } from '../apiRoutes';
import { Artist } from '../apiModels';
import ArtistCard from '../components/ArtistCard';
import ErrorState from '../components/ErrorState';
import { usePaginatedList } from '../hooks/usePaginatedList';

type ArtistSortField = 'Name' | 'AlbumCount' | 'SongCount' | 'LastPlayedAt' | 'PlayedCount' | 'CalculatedRating';

export default function BrowseArtists() {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<ArtistSortField>('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { items: artists, total, page, pageSize, setPage, loading, error, reload } = usePaginatedList<Artist>({
    path: API_ROUTES.artists.list,
    params: { orderBy: sortBy, orderDirection: sortDirection },
  });

  const handleSortChange = (field: ArtistSortField) => {
    if (field === sortBy) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">{t('nav.artists')}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="artist-sort-label">{t('sort.sortBy')}</InputLabel>
            <Select
              labelId="artist-sort-label"
              value={sortBy}
              label={t('sort.sortBy')}
              onChange={(event) => handleSortChange(event.target.value as ArtistSortField)}
            >
              <MenuItem value="Name">{t('sort.name')}</MenuItem>
              <MenuItem value="AlbumCount">{t('sort.albumCount')}</MenuItem>
              <MenuItem value="SongCount">{t('sort.songCount')}</MenuItem>
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
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} compact />
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
