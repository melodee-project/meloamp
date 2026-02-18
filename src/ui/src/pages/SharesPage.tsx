import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  MoreVert,
  Share,
  ContentCopy,
  Link as LinkIcon,
  Album,
  Person,
  MusicNote,
  PlaylistPlay,
} from '@mui/icons-material';
import { apiRequest } from '../api';
import { Share as ShareModel, ShareType, CreateShareRequest } from '../apiModels';
import { useNavigate } from 'react-router-dom';

const SHARE_TYPE_ICONS: Record<string, React.ReactNode> = {
  Album: <Album />,
  Artist: <Person />,
  Song: <MusicNote />,
  Playlist: <PlaylistPlay />,
};

export default function SharesPage() {
  const [shares, setShares] = React.useState<ShareModel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editShare, setEditShare] = React.useState<ShareModel | null>(null);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedShare, setSelectedShare] = React.useState<ShareModel | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = React.useState({
    resourceId: '',
    shareType: ShareType.Album,
    description: '',
    isDownloadable: false,
    expiresAt: '',
  });

  const fetchShares = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/shares');
      let shareList: ShareModel[] = [];
      if (Array.isArray(response.data)) {
        shareList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        shareList = response.data.data;
      } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        shareList = response.data.data.data;
      }
      setShares(shareList);
    } catch (err: any) {
      setError(err.message || 'Failed to load shares');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleCreate = async () => {
    try {
      const request: CreateShareRequest = {
        resourceId: formData.resourceId,
        shareType: formData.shareType,
        description: formData.description || undefined,
        isDownloadable: formData.isDownloadable,
        expiresAt: formData.expiresAt || undefined,
      };
      await apiRequest('/shares', {
        method: 'POST',
        data: request,
      });
      setCreateDialogOpen(false);
      resetFormData();
      fetchShares();
    } catch (err: any) {
      console.error('Failed to create share:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editShare) return;
    try {
      await apiRequest(`/shares/${editShare.id}`, {
        method: 'PUT',
        data: {
          description: formData.description,
          isDownloadable: formData.isDownloadable,
          expiresAt: formData.expiresAt || undefined,
        },
      });
      setEditShare(null);
      resetFormData();
      fetchShares();
    } catch (err: any) {
      console.error('Failed to update share:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/shares/${id}`, { method: 'DELETE' });
      fetchShares();
    } catch (err: any) {
      console.error('Failed to delete share:', err);
    }
    setMenuAnchor(null);
  };

  const handleCopyLink = async (share: ShareModel) => {
    try {
      await navigator.clipboard.writeText(share.shareUrl);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const resetFormData = () => {
    setFormData({
      resourceId: '',
      shareType: ShareType.Album,
      description: '',
      isDownloadable: false,
      expiresAt: '',
    });
  };

  const openEditDialog = (share: ShareModel) => {
    setEditShare(share);
    setFormData({
      resourceId: share.resourceId,
      shareType: share.shareType as ShareType,
      description: share.description || '',
      isDownloadable: share.isDownloadable,
      expiresAt: share.expiresAt || '',
    });
    setMenuAnchor(null);
  };

  const handleNavigate = (share: ShareModel) => {
    switch (share.shareType) {
      case 'Album':
        navigate(`/albums/${share.resourceId}`);
        break;
      case 'Artist':
        navigate(`/artists/${share.resourceId}`);
        break;
      case 'Song':
        navigate(`/songs/${share.resourceId}`);
        break;
      case 'Playlist':
        navigate(`/playlists/${share.resourceId}`);
        break;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading && shares.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Shares
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
          Shares
        </Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Share color="primary" />
          <Typography variant="h4">Shares</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetFormData();
            setCreateDialogOpen(true);
          }}
        >
          Create Share
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Shares allow you to create public links to your music that can be accessed by anyone without logging in.
      </Alert>

      {shares.length === 0 ? (
        <Typography color="text.secondary">
          No shares yet. Create a share to share your music with others!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {shares.map((share) => (
            <Card key={share.id} sx={{ width: 280 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                      onClick={() => handleNavigate(share)}
                    >
                      {SHARE_TYPE_ICONS[share.shareType]}
                      <Typography variant="subtitle1" noWrap fontWeight={600}>
                        {share.resourceName}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setSelectedShare(share);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, my: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" label={share.shareType} />
                    <Chip
                      size="small"
                      label={`${share.visitCount} views`}
                      variant="outlined"
                    />
                    {share.isDownloadable && (
                      <Chip size="small" label="Downloadable" color="primary" variant="outlined" />
                    )}
                  </Box>

                  {share.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {share.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Tooltip title={copiedId === share.id ? 'Copied!' : 'Copy link'}>
                      <IconButton
                        size="small"
                        color={copiedId === share.id ? 'success' : 'default'}
                        onClick={() => handleCopyLink(share)}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Open share link">
                      <IconButton
                        size="small"
                        onClick={() => window.open(share.shareUrl, '_blank')}
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Created: {formatDate(share.createdAt)}
                    </Typography>
                    {share.expiresAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Expires: {formatDate(share.expiresAt)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
          ))}
        </Box>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {selectedShare && (
          <MenuItem onClick={() => openEditDialog(selectedShare)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {selectedShare && (
          <MenuItem onClick={() => handleDelete(selectedShare.id)}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Share</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Resource ID (Album, Artist, Song, or Playlist ID)"
            fullWidth
            value={formData.resourceId}
            onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Share Type"
            fullWidth
            value={formData.shareType}
            onChange={(e) => setFormData({ ...formData, shareType: e.target.value as ShareType })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Album">Album</MenuItem>
            <MenuItem value="Artist">Artist</MenuItem>
            <MenuItem value="Song">Song</MenuItem>
            <MenuItem value="Playlist">Playlist</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Expiration Date (optional)"
            type="datetime-local"
            fullWidth
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isDownloadable}
                onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
              />
            }
            label="Allow downloads"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.resourceId}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editShare} onClose={() => setEditShare(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Share</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Expiration Date"
            type="datetime-local"
            fullWidth
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isDownloadable}
                onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
              />
            }
            label="Allow downloads"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditShare(null)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
