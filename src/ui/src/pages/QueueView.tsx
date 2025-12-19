import React, { useRef, ReactElement, useState } from 'react';
import { Box, Typography, IconButton, List, ListItem, ListItemAvatar, Avatar, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert } from '@mui/material';
import { Delete, DragIndicator, ImageOutlined } from '@mui/icons-material';
import api from '../api';
import { useQueueStore, QueueState, Song } from '../queueStore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { List as VirtualList, RowComponentProps } from 'react-window';
import './QueueView.css'; // <-- Add this import for custom CSS
import { useTranslation } from 'react-i18next';

// Threshold for enabling virtualization (for smaller lists, regular rendering is fine)
const VIRTUALIZATION_THRESHOLD = 50;
const ITEM_HEIGHT = 72; // Height of each queue item in pixels

// Custom props passed to the virtualized row component via react-window v2 rowProps
interface CustomRowProps {
  queue: Song[];
  playerCurrent: number;
  playing: boolean;
  removeFromQueue: (index: number) => void;
  t: (key: string) => string;
}

// Virtualized row component for react-window v2
// Uses RowComponentProps<CustomRowProps> which includes ariaAttributes, index, style + custom props
function VirtualizedRow({ 
  ariaAttributes, 
  index, 
  style, 
  queue, 
  playerCurrent, 
  playing, 
  removeFromQueue, 
  t 
}: RowComponentProps<CustomRowProps>): ReactElement {
  const song = queue[index];
  
  // Return empty div if no song (should not happen, but satisfies type requirement)
  if (!song) {
    return <div style={style} {...ariaAttributes} />;
  }
  
  return (
    <div style={style} {...ariaAttributes}>
      <ListItem
        secondaryAction={
          <IconButton edge="end" onClick={() => removeFromQueue(index)}><Delete /></IconButton>
        }
        className={song.played ? 'played-song' : 'unplayed-song'}
        sx={{
          mb: 0.5,
          borderRadius: 2,
          border: index === playerCurrent && playing ? '3px solid transparent' : '2px solid',
          borderColor: index === playerCurrent && playing ? 'transparent' : song.played ? 'grey.300' : 'primary.main',
          fontWeight: song.played ? 400 : 700,
          opacity: song.played ? 0.5 : 1,
          background: index === playerCurrent ? 'rgba(0,0,0,0.04)' : 'none',
          height: ITEM_HEIGHT - 8,
          transition: 'background 0.2s, opacity 0.2s',
        }}
      >
        <ListItemAvatar>
          <Avatar src={song.imageUrl} alt={song.title} />
        </ListItemAvatar>
        <ListItemText
          primary={song.title}
          secondary={song.artist?.name || t('queue.unknownArtist')}
          primaryTypographyProps={{ fontWeight: song.played ? 'normal' : 'bold' }}
        />
      </ListItem>
    </div>
  );
}

export default function QueueView() {
  const queue = useQueueStore((state: QueueState) => state.queue);
  const removeFromQueue = useQueueStore((state: QueueState) => state.removeFromQueue);
  const reorderQueue = useQueueStore((state: QueueState) => state.reorderQueue);
  const clearQueue = useQueueStore((state: QueueState) => state.clearQueue);
  const lastAction = useQueueStore((state: QueueState) => state.lastAction);
  const undo = useQueueStore((state: QueueState) => state.undo);
  // Get playing state from Player (global store or context)
  const [playing, setPlaying] = React.useState(false);
  const [playerCurrent, setPlayerCurrent] = React.useState<number>(-1);
  const { t } = useTranslation();

  // State for save playlist dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for snackbar notifications
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error'; showUndo?: boolean }>({ 
    open: false, 
    message: '', 
    severity: 'success',
    showUndo: false
  });

  // Auto-hide undo snackbar after timeout
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    // Listen for playing state and current index from Player via window event
    function handlePlayerState(e: any) {
      if (e?.detail) {
        if (typeof e.detail.playing === 'boolean') setPlaying(e.detail.playing);
        if (typeof e.detail.current === 'number') setPlayerCurrent(e.detail.current);
      }
    }
    window.addEventListener('meloamp-player-state', handlePlayerState);
    return () => window.removeEventListener('meloamp-player-state', handlePlayerState);
  }, []);

  // Handle remove with undo snackbar
  const handleRemove = (index: number) => {
    const songTitle = queue[index]?.title || 'Song';
    removeFromQueue(index);
    
    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    setSnackbar({ 
      open: true, 
      message: t('queue.songRemoved', { title: songTitle }), 
      severity: 'success',
      showUndo: true
    });
    
    // Auto-clear undo after 5 seconds
    undoTimeoutRef.current = setTimeout(() => {
      setSnackbar(prev => ({ ...prev, showUndo: false }));
    }, 5000);
  };

  // Handle clear with undo snackbar
  const handleClearQueue = () => {
    const songCount = queue.length;
    clearQueue();
    
    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    setSnackbar({ 
      open: true, 
      message: t('queue.queueCleared', { count: songCount }), 
      severity: 'success',
      showUndo: true
    });
    
    // Auto-clear undo after 5 seconds
    undoTimeoutRef.current = setTimeout(() => {
      setSnackbar(prev => ({ ...prev, showUndo: false }));
    }, 5000);
  };

  // Handle undo action
  const handleUndo = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    const success = undo();
    if (success) {
      setSnackbar({ 
        open: true, 
        message: t('queue.undoSuccess'), 
        severity: 'success',
        showUndo: false
      });
    }
  };

  const shuffleQueue = () => {
    const shuffled = [...queue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Reorder queue to match shuffled order
    shuffled.forEach((song, idx) => {
      const origIdx = queue.findIndex((s: typeof song) => s.id === song.id);
      if (origIdx !== idx) reorderQueue(origIdx, idx);
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderQueue(result.source.index, result.destination.index);
  };

  const handleOpenSaveDialog = () => {
    setPlaylistName('');
    setSelectedImage(null);
    setImagePreview(null);
    setSaveDialogOpen(true);
  };

  const handleCloseSaveDialog = () => {
    setSaveDialogOpen(false);
    setPlaylistName('');
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: t('queue.invalidImageType'), severity: 'error' });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: t('queue.imageTooLarge'), severity: 'error' });
        return;
      }
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveAsPlaylist = async () => {
    if (!playlistName.trim()) {
      setSnackbar({ open: true, message: t('queue.playlistNameRequired'), severity: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const songIds = queue.map(song => song.id);
      const response = await api.post('/Playlists', {
        name: playlistName.trim(),
        comment: '',
        isPublic: false,
        songIds
      });

      // Extract playlist ID from response - handle different response structures
      const responseData = response.data as { data?: { id?: string }; id?: string } | undefined;
      const playlistId = responseData?.data?.id || responseData?.id;
      
      // If an image was selected, upload it
      if (selectedImage && playlistId) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        await api.post(`/Playlists/${playlistId}/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setSnackbar({ open: true, message: t('queue.saveSuccess'), severity: 'success' });
      handleCloseSaveDialog();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || t('queue.saveError');
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper to sum total duration in seconds using song.durationMs (guaranteed present and always a number)
  const totalDuration = queue.reduce((sum, song) => sum + song.durationMs, 0);
  // Helper to format ms as mm:ss or h:mm:ss
  function formatMs(ms: number) {
    if (typeof ms !== 'number' || isNaN(ms) || ms <= 0) return '';
    const sec = Math.round(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Use virtualization for large lists (50+ songs)
  const useVirtualization = queue.length >= VIRTUALIZATION_THRESHOLD;
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Props for the virtualized row component (react-window v2 uses rowProps)
  const rowProps: CustomRowProps = {
    queue,
    playerCurrent,
    playing,
    removeFromQueue: handleRemove,
    t
  };

  // Regular draggable row for smaller lists
  const DraggableRow = ({ song, idx, provided }: { song: Song; idx: number; provided: any }) => (
    <ListItem 
      ref={provided.innerRef} 
      {...provided.draggableProps} 
      secondaryAction={
        <IconButton edge="end" onClick={() => handleRemove(idx)}><Delete /></IconButton>
      }
      className={song.played ? 'played-song' : 'unplayed-song'}
      sx={{
        mb: 1,
        borderRadius: 2,
        border: idx === playerCurrent && playing ? '3px solid transparent' : '2px solid',
        borderColor: idx === playerCurrent && playing ? 'transparent' : song.played ? 'grey.300' : 'primary.main',
        fontWeight: song.played ? 400 : 700,
        opacity: song.played ? 0.5 : 1,
        background: idx === playerCurrent ? 'rgba(0,0,0,0.04)' : 'none',
        position: 'relative',
        zIndex: idx === playerCurrent ? 1 : 'auto',
        bgcolor: song.played ? 'background.paper' : (idx > 0 && !queue[idx-1].played ? 'background.default' : 'background.paper'),
        transition: 'background 0.2s, opacity 0.2s',
      }}
    >
      <span {...provided.dragHandleProps}><DragIndicator /></span>
      <ListItemAvatar>
        <Avatar src={song.imageUrl} alt={song.title} />
      </ListItemAvatar>
      <ListItemText 
        primary={song.title} 
        secondary={song.artist?.name || t('queue.unknownArtist')} 
        primaryTypographyProps={{ fontWeight: song.played ? 'normal' : 'bold' }}
      />
    </ListItem>
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>{t('queue.title')}</Typography>
      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
        {queue.length} song{queue.length === 1 ? '' : 's'}
        {queue.length > 0 ? ` • ${formatMs(totalDuration)}` : ''}
        {useVirtualization && <span> • Virtualized for performance</span>}
      </Typography>
      <Button onClick={handleClearQueue} color="error" sx={{ mr: 2 }}>{t('queue.clear')}</Button>
      <Button onClick={shuffleQueue} sx={{ mr: 2 }}>{t('queue.shuffle')}</Button>
      <Button onClick={handleOpenSaveDialog} sx={{ mr: 2 }} disabled={queue.length === 0}>{t('queue.save')}</Button>
      <Button onClick={() => {}} color="primary">{t('queue.playAll')}</Button>
      {queue.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary', fontSize: 24 }}>
          No Songs
        </Box>
      ) : useVirtualization ? (
        // Virtualized list for large queues (50+ songs) - no drag-drop for performance
        <Box 
          ref={listContainerRef} 
          sx={{ 
            mt: 2, 
            height: Math.min(600, queue.length * ITEM_HEIGHT), 
            minHeight: 400,
            overflow: 'hidden'
          }}
        >
          <VirtualList<CustomRowProps>
            style={{ height: '100%', width: '100%' }}
            defaultHeight={600}
            rowCount={queue.length}
            rowHeight={ITEM_HEIGHT}
            overscanCount={5}
            rowComponent={VirtualizedRow}
            rowProps={rowProps}
          />
        </Box>
      ) : (
        // Regular drag-drop list for smaller queues
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="queue">
            {(provided: any) => (
              <List ref={provided.innerRef} {...provided.droppableProps}>
                {queue.map((song: Song, idx: number) => (
                  <Draggable key={song.id} draggableId={song.id.toString()} index={idx}>
                    {(provided: any) => <DraggableRow song={song} idx={idx} provided={provided} />}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Save to Playlist Dialog */}
      <Dialog open={saveDialogOpen} onClose={handleCloseSaveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('queue.saveDialogTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('queue.playlistNameLabel')}
            fullWidth
            variant="outlined"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isSaving && playlistName.trim() && handleSaveAsPlaylist()}
            disabled={isSaving}
            sx={{ mb: 2 }}
          />
          
          {/* Image picker */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('queue.playlistImageLabel')}
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="playlist-image-input"
            />
            {imagePreview ? (
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Box
                  component="img"
                  src={imagePreview}
                  alt={t('queue.playlistImagePreview')}
                  sx={{
                    width: 150,
                    height: 150,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleRemoveImage}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'error.light', color: 'white' }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <label htmlFor="playlist-image-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ImageOutlined />}
                  disabled={isSaving}
                >
                  {t('queue.selectImage')}
                </Button>
              </label>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              {t('queue.imageHint')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSaveDialog} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveAsPlaylist} variant="contained" disabled={isSaving || !playlistName.trim()}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={snackbar.showUndo ? 10000 : 6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          action={
            snackbar.showUndo && lastAction ? (
              <Button color="inherit" size="small" onClick={handleUndo}>
                {t('queue.undo')}
              </Button>
            ) : undefined
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
