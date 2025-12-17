import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Pagination } from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Album, PaginatedResponse } from '../apiModels';
import AlbumCard from '../components/AlbumCard';

export default function BrowseAlbums() {
  const { t } = useTranslation();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse<Album>>('/albums', { params: { page, pageSize: 20 } })
      .then((res) => {
        setAlbums(res.data.data);
        setTotal(res.data.meta?.totalCount || 0);
      })
      .catch(() => {})
    setLoading(false);
  }, [page]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{t('nav.albums')}</Typography>
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
