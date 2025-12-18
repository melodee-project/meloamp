import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Pagination, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Song, PaginatedResponse } from '../apiModels';
import SongCard from '../components/SongCard';

type SongSortField = 'Title' | 'SongNumber' | 'AlbumId' | 'PlayedCount' | 'Duration' | 'LastPlayedAt' | 'CalculatedRating';

export default function BrowseSongs() {
  const { t } = useTranslation();
  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SongSortField>('Title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse<Song>>('/songs', { 
      params: { 
        page, 
        pageSize: 20,
        orderBy: sortBy,
        orderDirection: sortDirection
      } 
    })
      .then((res) => {
        setSongs(res.data.data);
        setTotal(res.data.meta?.totalCount || 0);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [page, sortBy, sortDirection]);

  const handleSortChange = (field: SongSortField) => {
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
        <Typography variant="h5">{t('nav.songs')}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="song-sort-label">{t('sort.sortBy')}</InputLabel>
            <Select
              labelId="song-sort-label"
              value={sortBy}
              label={t('sort.sortBy')}
              onChange={(e) => handleSortChange(e.target.value as SongSortField)}
            >
              <MenuItem value="Title">{t('sort.title')}</MenuItem>
              <MenuItem value="SongNumber">{t('sort.trackNumber')}</MenuItem>
              <MenuItem value="AlbumId">{t('sort.album')}</MenuItem>
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
          {songs.map((song) => (
            <Box key={song.id} sx={{ flex: '1 1 250px', maxWidth: 350, minWidth: 220, display: 'flex', justifyContent: 'center' }}>
              <SongCard song={song} />
            </Box>
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
