/**
 * PlaylistPickerDialog - Reusable dialog for adding songs to playlists
 * Used by SongCard, Album/Artist detail views, and Search results
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  TextField,
  Typography,
  CircularProgress,
  Box,
  Divider,
  Alert,
  InputAdornment
} from '@mui/material';
import { Search, Add, PlaylistAdd } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Playlist, PaginatedResponse } from '../apiModels';

interface PlaylistPickerDialogProps {
  open: boolean;
  onClose: () => void;
  songIds: string[];
  onSuccess?: (playlistName: string, action: 'created' | 'added') => void;
  onError?: (message: string) => void;
}

export default function PlaylistPickerDialog({
  open,
  onClose,
  songIds,
  onSuccess,
  onError
}: PlaylistPickerDialogProps) {
  const { t } = useTranslation();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch user's playlists when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setSelectedPlaylist(null);
      setShowCreateNew(false);
      setNewPlaylistName('');
      
      api.get<PaginatedResponse<Playlist>>('/user/playlists', { params: { pageSize: 100 } })
        .then(res => {
          setPlaylists(res.data.data || []);
          setLoading(false);
        })
        .catch(err => {
          setError(err?.response?.data?.message || t('playlist.loadError'));
          setLoading(false);
        });
    }
  }, [open, t]);

  // Filter playlists by search query
  const filteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle adding songs to selected playlist
  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      // POST to add songs to playlist
      await api.post(`/playlists/${selectedPlaylist.id}/songs`, { songIds });
      onSuccess?.(selectedPlaylist.name, 'added');
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || t('playlist.addError');
      setError(message);
      onError?.(message);
    } finally {
      setIsAdding(false);
    }
  };

  // Handle creating a new playlist with the songs
  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      // Create new playlist with songs
      await api.post('/playlists', {
        name: newPlaylistName.trim(),
        comment: '',
        isPublic: false,
        songIds
      });
      onSuccess?.(newPlaylistName.trim(), 'created');
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || t('playlist.createError');
      setError(message);
      onError?.(message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PlaylistAdd />
        {t('playlist.addToPlaylist')}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('playlist.addingSongs', { count: songIds.length })}
        </Typography>

        {/* Search field */}
        <TextField
          fullWidth
          size="small"
          placeholder={t('playlist.searchPlaylists')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {/* Playlist list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <List dense>
              {filteredPlaylists.map(playlist => (
                <ListItem key={playlist.id} disablePadding>
                  <ListItemButton
                    selected={selectedPlaylist?.id === playlist.id}
                    onClick={() => {
                      setSelectedPlaylist(playlist);
                      setShowCreateNew(false);
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={playlist.thumbnailUrl || playlist.imageUrl}
                        variant="rounded"
                      >
                        <PlaylistAdd />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={playlist.name}
                      secondary={t('playlist.songCount', { count: playlist.songCount || 0 })}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              
              {filteredPlaylists.length === 0 && !loading && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  {searchQuery ? t('playlist.noMatchingPlaylists') : t('playlist.noPlaylists')}
                </Typography>
              )}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Create new playlist option */}
        {showCreateNew ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('playlist.createNewPlaylist')}
            </Typography>
            <TextField
              fullWidth
              size="small"
              label={t('playlist.playlistName')}
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && newPlaylistName.trim() && handleCreateNewPlaylist()}
            />
          </Box>
        ) : (
          <Button
            startIcon={<Add />}
            onClick={() => {
              setShowCreateNew(true);
              setSelectedPlaylist(null);
            }}
            fullWidth
            variant="outlined"
          >
            {t('playlist.createNewPlaylist')}
          </Button>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isAdding}>
          {t('common.cancel')}
        </Button>
        {showCreateNew ? (
          <Button
            onClick={handleCreateNewPlaylist}
            variant="contained"
            disabled={isAdding || !newPlaylistName.trim()}
          >
            {isAdding ? <CircularProgress size={20} /> : t('common.create')}
          </Button>
        ) : (
          <Button
            onClick={handleAddToPlaylist}
            variant="contained"
            disabled={isAdding || !selectedPlaylist}
          >
            {isAdding ? <CircularProgress size={20} /> : t('playlist.addSongs')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
