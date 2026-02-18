import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  IconButton,
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Delete,
  Edit,
  MoreVert,
  SmartToy,
  Public,
  Lock,
} from '@mui/icons-material';
import { apiRequest } from '../api';
import { SmartPlaylistModel, SmartPlaylistEvaluateResponse, Song } from '../apiModels';
import { toQueueSong } from '../components/toQueueSong';
import { useQueueStore } from '../queueStore';

export default function SmartPlaylistsPage() {
  const [playlists, setPlaylists] = React.useState<SmartPlaylistModel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editPlaylist, setEditPlaylist] = React.useState<SmartPlaylistModel | null>(null);
  const [formData, setFormData] = React.useState({ name: '', mqlQuery: '', entityType: 'Song' });
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = React.useState<string | null>(null);
  const addToQueue = useQueueStore((state) => state.addToQueue);

  const fetchPlaylists = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/playlists/smart');
      let playlistList: SmartPlaylistModel[] = [];
      if (Array.isArray(response.data)) {
        playlistList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        playlistList = response.data.data;
      } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        playlistList = response.data.data.data;
      }
      setPlaylists(playlistList);
    } catch (err: any) {
      setError(err.message || 'Failed to load smart playlists');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreate = async () => {
    try {
      await apiRequest('/playlists/smart', {
        method: 'POST',
        data: {
          name: formData.name,
          mqlQuery: formData.mqlQuery,
          entityType: formData.entityType,
          isPublic: false,
        },
      });
      setCreateDialogOpen(false);
      setFormData({ name: '', mqlQuery: '', entityType: 'Song' });
      fetchPlaylists();
    } catch (err: any) {
      console.error('Failed to create smart playlist:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editPlaylist) return;
    try {
      await apiRequest(`/playlists/smart/${editPlaylist.apiKey}`, {
        method: 'PUT',
        data: {
          name: formData.name,
          mqlQuery: formData.mqlQuery,
        },
      });
      setEditPlaylist(null);
      setFormData({ name: '', mqlQuery: '', entityType: 'Song' });
      fetchPlaylists();
    } catch (err: any) {
      console.error('Failed to update smart playlist:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/playlists/smart/${id}`, { method: 'DELETE' });
      fetchPlaylists();
    } catch (err: any) {
      console.error('Failed to delete smart playlist:', err);
    }
    setMenuAnchor(null);
  };

  const handlePlay = async (playlist: SmartPlaylistModel) => {
    try {
      const response = await apiRequest(`/playlists/smart/${playlist.apiKey}/evaluate`);
      const data: SmartPlaylistEvaluateResponse = response.data?.data || response.data;
      if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
        data.results.forEach((song: Song) => {
          addToQueue(toQueueSong(song));
        });
      }
    } catch (err: any) {
      console.error('Failed to evaluate smart playlist:', err);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, playlistId: string) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedPlaylistId(playlistId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPlaylistId(null);
  };

  const openEditDialog = (playlist: SmartPlaylistModel) => {
    setEditPlaylist(playlist);
    setFormData({
      name: playlist.name,
      mqlQuery: playlist.mqlQuery,
      entityType: playlist.entityType,
    });
    setMenuAnchor(null);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Smart Playlists
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} sx={{ width: 280 }}>
              <CardContent>
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Smart Playlists
        </Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Smart Playlists</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setFormData({ name: '', mqlQuery: '', entityType: 'Song' });
            setCreateDialogOpen(true);
          }}
        >
          Create
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Smart playlists are dynamically generated based on Melodee Query Language (MQL) rules.
      </Typography>

      {playlists.length === 0 ? (
        <Typography color="text.secondary">
          No smart playlists yet. Create one to get started!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {playlists.map((playlist) => (
            <Card key={playlist.apiKey} sx={{ width: 280 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToy color="primary" />
                    <Typography variant="h6" noWrap>
                      {playlist.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, playlist.apiKey)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                  <Chip
                    size="small"
                    icon={playlist.isPublic ? <Public /> : <Lock />}
                    label={playlist.isPublic ? 'Public' : 'Private'}
                  />
                  {playlist.lastResultCount > 0 && (
                    <Chip
                      size="small"
                      label={`${playlist.lastResultCount} items`}
                      variant="outlined"
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {playlist.mqlQuery}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handlePlay(playlist)}
                  >
                    <PlayArrow />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        {playlists.find((p) => p.apiKey === selectedPlaylistId) && (
          <MenuItem onClick={() => openEditDialog(playlists.find((p) => p.apiKey === selectedPlaylistId)!)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => selectedPlaylistId && handleDelete(selectedPlaylistId)}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Smart Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="MQL Query"
            fullWidth
            multiline
            rows={4}
            value={formData.mqlQuery}
            onChange={(e) => setFormData({ ...formData, mqlQuery: e.target.value })}
            placeholder="e.g., userRating >= 4 AND genre = 'Rock'"
            helperText="Melodee Query Language expression"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.name || !formData.mqlQuery}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editPlaylist} onClose={() => setEditPlaylist(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Smart Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="MQL Query"
            fullWidth
            multiline
            rows={4}
            value={formData.mqlQuery}
            onChange={(e) => setFormData({ ...formData, mqlQuery: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPlaylist(null)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={!formData.name || !formData.mqlQuery}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
