/**
 * FavoritesPage - Shows user's liked songs, disliked songs, and top rated
 */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Pagination,
  Alert
} from '@mui/material';
import { Favorite, ThumbDown, Star } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Song, PaginatedResponse } from '../apiModels';
import SongCard from '../components/SongCard';

type TabType = 'liked' | 'disliked' | 'topRated';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to 'liked'
  const initialTab = (searchParams.get('tab') as TabType) || 'liked';
  const [tab, setTab] = useState<TabType>(initialTab);
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Fetch songs based on current tab
  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let endpoint = '';
        switch (tab) {
          case 'liked':
            endpoint = '/songs/starred';
            break;
          case 'disliked':
            endpoint = '/songs/hated';
            break;
          case 'topRated':
            endpoint = '/songs/top-rated';
            break;
        }
        
        const res = await api.get<PaginatedResponse<Song>>(endpoint, {
          params: { page, pageSize }
        });
        
        setSongs(res.data.data || []);
        setTotal(res.data.meta?.totalCount || 0);
      } catch (err: any) {
        // If endpoint doesn't exist, show empty state
        if (err?.response?.status === 404) {
          setSongs([]);
          setTotal(0);
        } else {
          setError(err?.response?.data?.message || t('common.error'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [tab, page, t]);

  // Update URL when tab changes
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabType) => {
    setTab(newValue);
    setPage(1);
    setSearchParams({ tab: newValue });
  };

  const getTabIcon = (tabType: TabType) => {
    switch (tabType) {
      case 'liked':
        return <Favorite />;
      case 'disliked':
        return <ThumbDown />;
      case 'topRated':
        return <Star />;
    }
  };

  const getEmptyMessage = () => {
    switch (tab) {
      case 'liked':
        return t('favorites.noLikedSongs', 'No liked songs yet. Click the heart icon on any song to add it here.');
      case 'disliked':
        return t('favorites.noDislikedSongs', 'No disliked songs.');
      case 'topRated':
        return t('favorites.noTopRated', 'No top rated songs yet. Rate songs with 4+ stars to see them here.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t('favorites.title', 'My Library')}
      </Typography>
      
      <Tabs 
        value={tab} 
        onChange={handleTabChange} 
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          value="liked" 
          label={t('favorites.liked', 'Liked')} 
          icon={getTabIcon('liked')} 
          iconPosition="start"
        />
        <Tab 
          value="disliked" 
          label={t('favorites.disliked', 'Disliked')} 
          icon={getTabIcon('disliked')} 
          iconPosition="start"
        />
        <Tab 
          value="topRated" 
          label={t('favorites.topRated', 'Top Rated')} 
          icon={getTabIcon('topRated')} 
          iconPosition="start"
        />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : songs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          {getTabIcon(tab)}
          <Typography variant="body1" sx={{ mt: 2 }}>
            {getEmptyMessage()}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
            {songs.map((song) => (
              <Box key={song.id} sx={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                <SongCard song={song} />
              </Box>
            ))}
          </Box>
          
          {total > pageSize && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.ceil(total / pageSize)}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('common.viewing', { 
              from: (page - 1) * pageSize + 1, 
              to: Math.min(page * pageSize, total), 
              total 
            })}
          </Typography>
        </>
      )}
    </Box>
  );
}
