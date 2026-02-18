import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Slider,
  Button,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Save, Delete, MoreVert, Refresh } from '@mui/icons-material';
import { apiRequest } from '../api';
import { EqualizerPreset, EqualizerBand, CreateEqualizerPresetRequest } from '../apiModels';

const FREQUENCY_LABELS: Record<number, string> = {
  32: '32 Hz',
  64: '64 Hz',
  125: '125 Hz',
  250: '250 Hz',
  500: '500 Hz',
  1000: '1 kHz',
  2000: '2 kHz',
  4000: '4 kHz',
  8000: '8 kHz',
  16000: '16 kHz',
};

export default function EqualizerPage() {
  const [presets, setPresets] = React.useState<EqualizerPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = React.useState<EqualizerPreset | null>(null);
  const [bands, setBands] = React.useState<EqualizerBand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newPresetName, setNewPresetName] = React.useState('');
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const fetchPresets = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/equalizer/presets');
      let presetList: EqualizerPreset[] = [];
      if (Array.isArray(response.data)) {
        presetList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        presetList = response.data.data;
      } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        presetList = response.data.data.data;
      }
      setPresets(presetList);
      if (presetList.length > 0 && !selectedPreset) {
        const defaultPreset = presetList.find((p: EqualizerPreset) => p.isDefault) || presetList[0];
        setSelectedPreset(defaultPreset);
        setBands(defaultPreset.bands || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load equalizer presets');
    } finally {
      setLoading(false);
    }
  }, [selectedPreset]);

  React.useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleBandChange = (index: number, gain: number) => {
    const newBands = [...bands];
    newBands[index] = { ...newBands[index], gain };
    setBands(newBands);
  };

  const handleCreatePreset = async () => {
    try {
      const request: CreateEqualizerPresetRequest = {
        name: newPresetName,
        bands: bands,
      };
      await apiRequest('/equalizer/presets', {
        method: 'POST',
        data: request,
      });
      setCreateDialogOpen(false);
      setNewPresetName('');
      fetchPresets();
    } catch (err: any) {
      console.error('Failed to create preset:', err);
    }
  };

  const handleDeletePreset = async (id: string) => {
    try {
      await apiRequest(`/equalizer/presets/${id}`, { method: 'DELETE' });
      fetchPresets();
      if (selectedPreset?.id === id) {
        setSelectedPreset(null);
        setBands([]);
      }
    } catch (err: any) {
      console.error('Failed to delete preset:', err);
    }
    setMenuAnchor(null);
  };

  const handleResetBands = () => {
    setBands(bands.map((b) => ({ ...b, gain: 0 })));
  };

  const getFrequencyLabel = (freq: number) => {
    return FREQUENCY_LABELS[freq] || `${freq} Hz`;
  };

  if (loading && presets.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Equalizer
        </Typography>
        <Card>
          <CardContent>
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Equalizer
        </Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Equalizer</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleResetBands}
            disabled={!selectedPreset}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={bands.length === 0}
          >
            Save as Preset
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Card sx={{ minWidth: { md: 250 } }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Presets
            </Typography>
            {presets.map((preset) => (
              <Box
                key={preset.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  mb: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: selectedPreset?.id === preset.id ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => {
                  setSelectedPreset(preset);
                  setBands(preset.bands);
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>{preset.name}</Typography>
                  {preset.isDefault && (
                    <Chip size="small" label="Default" />
                  )}
                </Box>
                {!preset.isDefault && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAnchor(e.currentTarget);
                      setSelectedPreset(preset);
                    }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
            <CardContent>
              {selectedPreset && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Typography variant="h6">{selectedPreset.name}</Typography>
                  {selectedPreset.isDefault && <Chip size="small" label="Built-in" />}
                </Box>
              )}

              {!selectedPreset ? (
                <Typography color="text.secondary">
                  Select a preset to view and adjust the equalizer bands.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    height: 300,
                    gap: 2,
                    px: 2,
                  }}
                >
                  {bands.map((band, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          mb: 1,
                          fontWeight: band.gain === 0 ? 400 : 700,
                          color: band.gain > 0 ? 'success.main' : band.gain < 0 ? 'error.main' : 'text.secondary',
                        }}
                      >
                        {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)} dB
                      </Typography>
                      <Slider
                        orientation="vertical"
                        value={band.gain}
                        onChange={(_, value) => handleBandChange(index, value as number)}
                        min={-12}
                        max={12}
                        step={0.5}
                        sx={{
                          height: 200,
                          '& .MuiSlider-thumb': {
                            color: 'primary.main',
                          },
                          '& .MuiSlider-track': {
                            width: 4,
                          },
                          '& .MuiSlider-rail': {
                            width: 4,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ mt: 1, textAlign: 'center', fontSize: '0.65rem' }}
                      >
                        {getFrequencyLabel(band.frequency)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => selectedPreset && handleDeletePreset(selectedPreset.id)}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Save as New Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePreset} variant="contained" disabled={!newPresetName}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
