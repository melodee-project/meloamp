import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Pagination, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Artist, PaginatedResponse } from '../apiModels';
import ArtistCard from '../components/ArtistCard';

type ArtistSortField = 'Name' | 'AlbumCount' | 'SongCount' | 'LastPlayedAt' | 'PlayedCount' | 'CalculatedRating';

export default function BrowseArtists() {
  const { t } = useTranslation();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<ArtistSortField>('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse<Artist>>('/artists', { 
      params: { 
        page, 
        pageSize: 20,
        orderBy: sortBy,
        orderDirection: sortDirection
      } 
    })
      .then((res) => {
        setArtists(res.data.data);
        setTotal(res.data.meta?.totalCount || 0);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [page, sortBy, sortDirection]);

  const handleSortChange = (field: ArtistSortField) => {
    if (field === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
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
              onChange={(e) => {
                e.preventDefault();
                handleSortChange(e.target.value as ArtistSortField);
              }}
            >
              <MenuItem value="Name">{t('sort.name')}</MenuItem>
              <MenuItem value="AlbumCount">{t('sort.albumCount')}</MenuItem>
              <MenuItem value="SongCount">{t('sort.songCount')}</MenuItem>
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
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} compact />
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
