import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { Statistic, Artist, Album, Playlist, PaginatedResponse } from './apiModels';
import { apiRequest } from './api';
import ArtistCard from './components/ArtistCard';
import PlaylistCard from './components/PlaylistCard';
import StatisticCard from './components/StatisticCard';
import AlbumCard from './components/AlbumCard';
import { ArrowBackIos, ArrowForwardIos, Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Playlist Card
// ...moved to components/PlaylistCard.tsx...

function Dashboard({ recentLimit }: { recentLimit?: number }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Statistic[] | null>(null);
  const [recentArtists, setRecentArtists] = useState<Artist[]>([]);
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refetch dashboard data
  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiRequest('/system/stats'),
      apiRequest(`/artists/recent?limit=${recentLimit}`),
      apiRequest(`/albums/recent?limit=${recentLimit}`),
      apiRequest('/users/playlists'),
    ])
      .then(([statsRes, artistsRes, albumsRes, playlistsRes]) => {
        setStats((statsRes.data as Statistic[]));
        setRecentArtists(((artistsRes.data as PaginatedResponse<Artist>).data));
        setRecentAlbums(((albumsRes.data as PaginatedResponse<Album>).data));
        setPlaylists(((playlistsRes.data as PaginatedResponse<Playlist>).data));
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load dashboard data. Please try again.'
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentLimit]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{t('common.error')}</Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {stats && stats.map((s, i) => <StatisticCard key={i} stat={s} />)}
        </Box>
        <IconButton
          aria-label={t('common.refresh')}
          onClick={fetchDashboardData}
          sx={{ ml: 2, animation: loading ? 'spin 1s linear infinite' : 'none' }}
          disabled={loading}
        >
          <Refresh sx={{
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
            animation: loading ? 'spin 1s linear infinite' : 'none',
          }} />
        </IconButton>
      </Box>
      <Typography variant="h5" gutterBottom>{t('dashboard.recentArtists')}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start', mb: 3 }}>
        {recentArtists.map(a => (
          <Box key={a.id} sx={{ flex: '1 1 200px', maxWidth: 250, minWidth: 180, display: 'flex', justifyContent: 'center' }}>
            <ArtistCard artist={a} />
          </Box>
        ))}
      </Box>
      <Typography variant="h5" gutterBottom>{t('dashboard.recentAlbums')}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start', mb: 3 }}>
        {recentAlbums.map(a => (
          <Box key={a.id} sx={{ flex: '1 1 200px', maxWidth: 250, minWidth: 180, display: 'flex', justifyContent: 'center' }}>
            <AlbumCard album={a} />
          </Box>
        ))}
      </Box>
      <Typography variant="h5" gutterBottom>{t('dashboard.yourPlaylists')}</Typography>
      <Box sx={{ width: '100%' }}>
        <PlaylistScroller playlists={playlists} />
      </Box>
    </Box>
  );
}

// Horizontal Infinite Scroll for Playlists
function PlaylistScroller({ playlists }: { playlists: Playlist[] }) {
  const [start, setStart] = useState(0);
  const visibleCount = 5;
  const max = playlists.length;
  const canBack = start > 0;
  const canForward = start + visibleCount < max;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
      <IconButton onClick={() => setStart(Math.max(0, start - visibleCount))} disabled={!canBack}>
        <ArrowBackIos />
      </IconButton>
      <Box sx={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
        {playlists.slice(start, start + visibleCount).map(p => <PlaylistCard key={p.id} playlist={p} />)}
      </Box>
      <IconButton onClick={() => setStart(Math.min(max - visibleCount, start + visibleCount))} disabled={!canForward}>
        <ArrowForwardIos />
      </IconButton>
    </Box>
  );
}

export default function DashboardWrapper(props: any) {
  // Get from localStorage userSettings
  let limit = 10;
  try {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    limit = settings.dashboardRecentLimit || 10;
  } catch {}
  return <Dashboard recentLimit={limit} {...props} />;
}
