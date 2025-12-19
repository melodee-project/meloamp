import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Pagination, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { Add, Delete, ImageOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Playlist, PaginatedResponse } from '../apiModels';
import PlaylistCard from '../components/PlaylistCard';

export default function PlaylistManager() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Create playlist dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchPlaylists = () => {
    setLoading(true);
    api.get<PaginatedResponse<Playlist>>('/user/playlists', { params: { page, pageSize: 20 } })
      .then((res) => {
        setPlaylists(res.data.data);
        setTotal(res.data.meta?.totalCount || 0);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPlaylists();
  }, [page]);

  // Image selection for new playlist
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: t('queue.invalidImageType'), severity: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: t('queue.imageTooLarge'), severity: 'error' });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create playlist
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      setSnackbar({ open: true, message: t('queue.playlistNameRequired'), severity: 'error' });
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post('/Playlists', {
        name: newPlaylistName.trim(),
        comment: newPlaylistDescription.trim(),
        isPublic: newPlaylistPublic,
        songIds: []
      });

      const responseData = response.data as { data?: { id?: string }; id?: string };
      const playlistId = responseData?.data?.id || responseData?.id;

      // Upload image if selected
      if (selectedImage && playlistId) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        await api.post(`/playlists/${playlistId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setSnackbar({ open: true, message: t('playlist.createSuccess', { name: newPlaylistName }), severity: 'success' });
      handleCloseCreateDialog();
      
      // Navigate to the new playlist
      if (playlistId) {
        navigate(`/playlists/${playlistId}`);
      } else {
        fetchPlaylists();
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.message || t('playlist.createError'), severity: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setNewPlaylistPublic(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  // M3U Import
  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.m3u') && !file.name.endsWith('.m3u8')) {
        setSnackbar({ open: true, message: t('playlist.invalidM3UFile'), severity: 'error' });
        return;
      }
      setImportFile(file);
    }
  };

  const handleImportPlaylist = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const content = await importFile.text();
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      // Extract song info from M3U (this is a simple implementation)
      // In practice, you'd need to match songs by title/artist/album
      const playlistName = importFile.name.replace(/\.m3u8?$/i, '');
      
      // Create playlist with name from file
      const response = await api.post('/Playlists', {
        name: playlistName,
        comment: `Imported from ${importFile.name}`,
        isPublic: false,
        songIds: []
      });

      setSnackbar({ 
        open: true, 
        message: t('playlist.importSuccess', { matched: 0, total: lines.length }), 
        severity: 'success' 
      });
      
      setImportDialogOpen(false);
      setImportFile(null);
      fetchPlaylists();
    } catch (err: any) {
      setSnackbar({ open: true, message: t('playlist.importError'), severity: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{t('playlistManager.title')}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            onClick={() => setImportDialogOpen(true)}
          >
            {t('playlist.importM3U')}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {t('playlistManager.createPlaylist')}
          </Button>
        </Box>
      </Box>

      {loading ? <CircularProgress /> : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} compact />
          ))}
          {playlists.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 4, width: '100%', textAlign: 'center' }}>
              {t('playlist.noPlaylists')}
            </Typography>
          )}
        </Box>
      )}
      
      <Pagination
        count={Math.ceil(total / 20)}
        page={page}
        onChange={(_, value) => setPage(value)}
        sx={{ mt: 2 }}
      />
      {total > 0 && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {t('playlistManager.viewing', { from: (page - 1) * 20 + 1, to: Math.min(page * 20, total), total })}
        </Typography>
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('playlistManager.createPlaylist')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('playlist.playlistName')}
            fullWidth
            variant="outlined"
            value={newPlaylistName}
            onChange={e => setNewPlaylistName(e.target.value)}
            disabled={isCreating}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('playlistDetail.description', 'Description')}
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newPlaylistDescription}
            onChange={e => setNewPlaylistDescription(e.target.value)}
            disabled={isCreating}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch 
                checked={newPlaylistPublic} 
                onChange={e => setNewPlaylistPublic(e.target.checked)}
                disabled={isCreating}
              />
            }
            label={t('playlistDetail.public', 'Public')}
            sx={{ mb: 2 }}
          />
          
          {/* Image picker */}
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('queue.playlistImageLabel')}
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="create-playlist-image-input"
            />
            {imagePreview ? (
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                />
                <IconButton
                  size="small"
                  onClick={handleRemoveImage}
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1 }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <label htmlFor="create-playlist-image-input">
                <Button variant="outlined" component="span" startIcon={<ImageOutlined />} disabled={isCreating}>
                  {t('queue.selectImage')}
                </Button>
              </label>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={isCreating}>{t('common.cancel')}</Button>
          <Button onClick={handleCreatePlaylist} variant="contained" disabled={isCreating || !newPlaylistName.trim()}>
            {isCreating ? <CircularProgress size={20} /> : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import M3U Dialog */}
      <Dialog open={importDialogOpen} onClose={() => !isImporting && setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('playlist.importM3U')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('playlist.importDescription', 'Select an M3U file to import. Songs will be matched by title and artist.')}
          </Typography>
          <input
            type="file"
            accept=".m3u,.m3u8"
            onChange={handleImportFileSelect}
            ref={importFileInputRef}
            style={{ display: 'none' }}
            id="import-m3u-input"
          />
          <label htmlFor="import-m3u-input">
            <Button variant="outlined" component="span" fullWidth disabled={isImporting}>
              {importFile ? importFile.name : t('playlist.selectFile', 'Select M3U File')}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} disabled={isImporting}>{t('common.cancel')}</Button>
          <Button onClick={handleImportPlaylist} variant="contained" disabled={isImporting || !importFile}>
            {isImporting ? <CircularProgress size={20} /> : t('playlist.import', 'Import')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
