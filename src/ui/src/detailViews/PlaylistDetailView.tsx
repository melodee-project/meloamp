import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import { Delete, DragIndicator, Edit, EditOff, PlayArrow } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import api, { apiRequest } from '../api';
import { Playlist, Song, User, Meta } from '../apiModels';
import { useTranslation } from 'react-i18next';
import { useQueueStore } from '../queueStore';
import { toQueueSong } from '../components/toQueueSong';
import SongCard from '../components/SongCard';

export default function PlaylistDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const playNow = useQueueStore(state => state.playNow);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [songsLoading, setSongsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Play all loading state
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load current user from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }, []);

  // Check if current user is owner
  useEffect(() => {
    if (playlist && currentUser) {
      setIsOwner(playlist.owner?.id === currentUser.id);
    } else {
      setIsOwner(false);
    }
  }, [playlist, currentUser]);

  // Fetch playlist details
  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest(`/Playlists/${id}`)
      .then(res => {
        const responseData = res.data as { data?: Playlist } | Playlist;
        const playlistData = (responseData && 'data' in responseData && responseData.data) ? responseData.data : responseData;
        setPlaylist(playlistData as Playlist);
      })
      .catch(err => setError(err?.response?.data?.message || err?.message || t('playlistDetail.loadError')))
      .finally(() => setLoading(false));
  }, [id, t]);

  // Fetch playlist songs
  const fetchSongs = useCallback(async () => {
    if (!id) return;
    setSongsLoading(true);
    try {
      const res = await apiRequest(`/Playlists/${id}/songs?pageSize=200`);
      // The API returns { meta: {...}, data: Song[] }
      // apiRequest returns { data: { meta: {...}, data: Song[] } }
      const responseData = res.data as { meta?: any; data?: Song[] };
      const songsData = responseData?.data || [];
      setSongs(Array.isArray(songsData) ? songsData : []);
    } catch (err: any) {
      console.error('Failed to load playlist songs', err);
    } finally {
      setSongsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  // Handle drag end for reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const reordered = Array.from(songs);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, removed);

    setSongs(reordered);
    setHasChanges(true);
  };

  // Remove song from playlist (local state only until save)
  const handleRemoveSong = (songId: string) => {
    setSongs(prev => prev.filter(s => s.id !== songId));
    setHasChanges(true);
  };

  // Save changes (reorder/remove)
  const handleSaveChanges = async () => {
    if (!id || !hasChanges) return;

    setIsSaving(true);
    try {
      const songIds = songs.map(s => s.id);
      await api.put(`/Playlists/${id}/songs/reorder`, { songIds });
      setHasChanges(false);
      setEditMode(false);
      setSnackbar({ open: true, message: t('playlistDetail.saveSuccess'), severity: 'success' });
      // Refresh playlist to get updated song count
      const res = await apiRequest(`/Playlists/${id}`);
      const responseData = res.data as { data?: Playlist } | Playlist;
      const playlistData = (responseData && 'data' in responseData && responseData.data) ? responseData.data : responseData;
      setPlaylist(playlistData as Playlist);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || t('playlistDetail.saveError');
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setHasChanges(false);
    fetchSongs(); // Reload original songs
  };

  // Delete playlist
  const handleDeletePlaylist = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await api.delete(`/Playlists/${id}`);
      setDeleteDialogOpen(false);
      setSnackbar({ open: true, message: t('playlistDetail.deleteSuccess'), severity: 'success' });
      // Navigate back to playlists after a short delay
      setTimeout(() => navigate('/playlists'), 1500);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || t('playlistDetail.deleteError');
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setIsDeleting(false);
    }
  };

  // Fetch all songs (handles pagination)
  const fetchAllSongs = useCallback(async (): Promise<Song[]> => {
    if (!id) return [];
    
    const PAGE_SIZE = 200;
    let allSongs: Song[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await apiRequest(`/Playlists/${id}/songs?pageSize=${PAGE_SIZE}&page=${currentPage}`);
      const responseData = res.data as { meta?: Meta; data?: Song[] };
      const pageSongs = responseData?.data || [];
      
      if (Array.isArray(pageSongs)) {
        allSongs = [...allSongs, ...pageSongs];
      }

      // Check if there are more pages
      const meta = responseData?.meta;
      hasMore = meta?.hasNext ?? false;
      currentPage++;

      // Safety limit to prevent infinite loops
      if (currentPage > 100) break;
    }

    return allSongs;
  }, [id]);

  // Play all songs
  const handlePlayAll = async () => {
    // If we already have all songs loaded (single page), just play them
    if (songs.length > 0 && playlist && songs.length >= (playlist.songCount || 0)) {
      playNow(songs.map(toQueueSong));
      return;
    }

    // Otherwise, fetch all pages first
    setIsLoadingAll(true);
    try {
      const allSongs = await fetchAllSongs();
      if (allSongs.length > 0) {
        playNow(allSongs.map(toQueueSong));
        // Update local state with all songs
        setSongs(allSongs);
      }
    } catch (err: any) {
      console.error('Failed to load all playlist songs', err);
      setSnackbar({ open: true, message: t('playlistDetail.loadError'), severity: 'error' });
    } finally {
      setIsLoadingAll(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{error}</Box>;
  if (!playlist) return null;

  return (
    <Box sx={{ maxWidth: 800, m: 'auto', mt: 4, p: 2 }}>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, p: 2 }}>
          <CardMedia
            component="img"
            sx={{ width: { xs: '100%', sm: 200 }, height: { xs: 200, sm: 200 }, objectFit: 'cover', borderRadius: 2 }}
            image={playlist.imageUrl || playlist.thumbnailUrl || '/placeholder-playlist.png'}
            alt={playlist.name}
          />
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>{playlist.name}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('playlistDetail.createdBy')}: {playlist.owner?.username || playlist.owner?.email}
            </Typography>
            {playlist.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>{playlist.description}</Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {playlist.songCount} {t('playlistDetail.tracks')} • {playlist.durationFormatted}
            </Typography>

            {/* Action buttons */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={isLoadingAll ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                onClick={handlePlayAll}
                disabled={songs.length === 0 || isLoadingAll}
              >
                {isLoadingAll ? t('playlistDetail.loadingAll') : t('playlistDetail.playAll')}
              </Button>

              {isOwner && (
                <>
                  {editMode ? (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<EditOff />}
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleSaveChanges}
                        disabled={!hasChanges || isSaving}
                      >
                        {isSaving ? t('common.saving') : t('common.save')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => setEditMode(true)}
                    >
                      {t('playlistDetail.edit')}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    {t('playlistDetail.delete')}
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Box>
      </Card>

      {/* Songs List */}
      <Typography variant="h6" sx={{ mb: 2 }}>{t('playlistDetail.tracks')}</Typography>

      {songsLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>
      ) : songs.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {t('playlistDetail.noSongs')}
        </Typography>
      ) : editMode ? (
        // Edit mode with drag-and-drop
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="playlist-songs">
            {(provided) => (
              <List ref={provided.innerRef} {...provided.droppableProps}>
                {songs.map((song, index) => (
                  <Draggable key={song.id} draggableId={song.id} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                          transition: 'background-color 0.2s'
                        }}
                        secondaryAction={
                          <Tooltip title={t('playlistDetail.removeSong')}>
                            <IconButton edge="end" onClick={() => handleRemoveSong(song.id)}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        }
                      >
                        <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <DragIndicator sx={{ color: 'text.secondary' }} />
                        </Box>
                        <ListItemAvatar>
                          <Avatar
                            src={song.thumbnailUrl || song.album?.thumbnailUrl}
                            alt={song.title}
                            variant="rounded"
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={song.title}
                          secondary={`${song.artist?.name || t('queue.unknownArtist')} • ${song.durationFormatted}`}
                        />
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        // Normal view with SongCard components
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {songs.map((song) => (
            <SongCard key={song.id} song={song} maxWidth="100%" />
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)}>
        <DialogTitle>{t('playlistDetail.deleteDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('playlistDetail.deleteDialogMessage', { name: playlist.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDeletePlaylist} color="error" disabled={isDeleting}>
            {isDeleting ? t('common.deleting') : t('playlistDetail.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
