import React, { useState } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { Statistic, Artist, Album, Playlist } from '../apiModels';
import { apiRequest, unwrapApiPage, unwrapApiResponse } from '../api';
import { useApiEffect } from '../hooks/useApiEffect';
import ArtistCard from '../components/ArtistCard';
import PlaylistCard from '../components/PlaylistCard';
import StatisticCard from '../components/StatisticCard';
import AlbumCard from '../components/AlbumCard';
import { ArrowBackIos, ArrowForwardIos, Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ErrorState from '../components/ErrorState';
import { readUserSettings } from '../settings';
import { getErrorMessage, getErrorStatus } from '../utils/errors';

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
  const [refetchToken, setRefetchToken] = useState(0);

  useApiEffect(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      // `/system/stats` is administrator-only (the API answers `403 FORBIDDEN`
      // for listener accounts), so its absence must not hide the rest of the
      // dashboard. Any other failure still surfaces as a load error.
      const statsRequest = apiRequest('/system/stats', { signal }).catch((err: unknown) => {
        if (getErrorStatus(err) === 403) return null;
        throw err;
      });

      const [statsRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
        statsRequest,
        apiRequest(`/artists/recent?limit=${recentLimit}`, { signal }),
        apiRequest(`/albums/recent?limit=${recentLimit}`, { signal }),
        apiRequest('/user/playlists', { signal }),
      ]);
      if (signal.aborted) return;

      setStats(statsRes ? unwrapApiResponse<Statistic[]>(statsRes.data) ?? [] : []);
      setRecentArtists(unwrapApiPage<Artist>(artistsRes.data).items);
      setRecentAlbums(unwrapApiPage<Album>(albumsRes.data).items);
      setPlaylists(unwrapApiPage<Playlist>(playlistsRes.data).items);
    } catch (err) {
      if (signal.aborted) return;
      setError(getErrorMessage(err, t('dashboard.loadError', 'Failed to load dashboard data. Please try again.')));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [recentLimit, refetchToken, t]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <ErrorState message={error} onRetry={() => setRefetchToken((token) => token + 1)} fullPage />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {stats && stats.map((s, i) => <StatisticCard key={i} stat={s} />)}
        </Box>
        <IconButton
          aria-label={t('common.refresh')}
          onClick={() => setRefetchToken((token) => token + 1)}
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
          <ArtistCard key={a.id} artist={a} compact />
        ))}
      </Box>
      <Typography variant="h5" gutterBottom>{t('dashboard.recentAlbums')}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start', mb: 3 }}>
        {recentAlbums.map(a => (
          <AlbumCard key={a.id} album={a} compact />
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
  const { t } = useTranslation();
  const [start, setStart] = useState(0);
  const visibleCount = 5;
  const max = playlists.length;
  const canBack = start > 0;
  const canForward = start + visibleCount < max;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
      <IconButton
        onClick={() => setStart(Math.max(0, start - visibleCount))}
        disabled={!canBack}
        aria-label={t('dashboard.scrollBack', 'Scroll playlists back')}
      >
        <ArrowBackIos />
      </IconButton>
      <Box sx={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
        {playlists.slice(start, start + visibleCount).map(p => <PlaylistCard key={p.id} playlist={p} />)}
      </Box>
      <IconButton
        onClick={() => setStart(Math.min(max - visibleCount, start + visibleCount))}
        disabled={!canForward}
        aria-label={t('dashboard.scrollForward', 'Scroll playlists forward')}
      >
        <ArrowForwardIos />
      </IconButton>
    </Box>
  );
}

export default function DashboardWrapper() {
  const { dashboardRecentLimit } = readUserSettings();
  return <Dashboard recentLimit={dashboardRecentLimit} />;
}
