import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  Skeleton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Check, Download, Upload, Warning } from '@mui/icons-material';
import { apiRequest } from '../api';
import { ThemePackInfo } from '../apiModels';

interface ThemeSettings {
  theme: string;
  mode: 'light' | 'dark';
}

interface ThemesPageProps {
  settings: ThemeSettings;
  onChange: (settings: ThemeSettings) => void;
}

export default function ThemesPage({ settings, onChange }: ThemesPageProps) {
  const [themes, setThemes] = React.useState<ThemePackInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = React.useState<ThemePackInfo | null>(null);

  const fetchThemes = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/themes');
      let themeList: ThemePackInfo[] = [];
      if (Array.isArray(response.data)) {
        themeList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        themeList = response.data.data;
      } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        themeList = response.data.data.data;
      }
      setThemes(themeList);
    } catch (err: any) {
      setError(err.message || 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleApplyTheme = async (theme: ThemePackInfo) => {
    try {
      setApplying(theme.id);
      await apiRequest('/themes/me', {
        method: 'POST',
        data: { themeId: theme.id },
      });
      onChange({ ...settings, theme: theme.id });
    } catch (err: any) {
      console.error('Failed to apply theme:', err);
    } finally {
      setApplying(null);
    }
  };

  const isCurrentTheme = (themeId: string) => {
    return settings.theme === themeId;
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Themes
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} sx={{ width: 220 }}>
              <Skeleton variant="rectangular" height={200} />
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
          Themes
        </Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Themes</Typography>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          component="label"
        >
          Import Theme
          <input
            type="file"
            hidden
            accept=".zip,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  await apiRequest('/themes/import', {
                    method: 'POST',
                    data: formData,
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  fetchThemes();
                } catch (err) {
                  console.error('Failed to import theme:', err);
                }
              }
            }}
          />
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Themes are applied from the server and may affect the entire application appearance. 
        Some themes may have warnings about compatibility.
      </Alert>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {themes.map((theme) => (
          <Card
            key={theme.id}
            sx={{
              width: 220,
              position: 'relative',
              border: isCurrentTheme(theme.id) ? 2 : 0,
              borderColor: 'primary.main',
            }}
          >
              {isCurrentTheme(theme.id) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <Check fontSize="small" />
                </Box>
              )}
              
              {theme.hasWarnings && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: 'warning.main',
                    color: 'warning.contrastText',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <Warning fontSize="small" />
                </Box>
              )}

              <CardActionArea onClick={() => setPreviewTheme(theme)}>
                {theme.previewImage ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={theme.previewImage}
                    alt={theme.name}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 140,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      No Preview
                    </Typography>
                  </Box>
                )}
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {theme.name}
                  </Typography>
                  {theme.author && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      by {theme.author}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    {theme.isBuiltIn && (
                      <Chip size="small" label="Built-in" />
                    )}
                    {theme.version && (
                      <Chip size="small" label={`v${theme.version}`} variant="outlined" />
                    )}
                  </Box>
                  {theme.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {theme.description}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
        ))}
      </Box>

      <Dialog open={!!previewTheme} onClose={() => setPreviewTheme(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{previewTheme?.name}</DialogTitle>
        <DialogContent>
          {previewTheme?.previewImage && (
            <Box
              component="img"
              src={previewTheme.previewImage}
              alt={previewTheme.name}
              sx={{ width: '100%', borderRadius: 1, mb: 2 }}
            />
          )}
          
          {previewTheme?.description && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              {previewTheme.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {previewTheme?.author && (
              <Chip label={`Author: ${previewTheme.author}`} />
            )}
            {previewTheme?.version && (
              <Chip label={`Version: ${previewTheme.version}`} />
            )}
          </Box>

          {previewTheme?.hasWarnings && previewTheme.warningDetails && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Warnings:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {previewTheme.warningDetails.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewTheme(null)}>Cancel</Button>
          {previewTheme && !previewTheme.isBuiltIn && (
            <Button
              startIcon={<Download />}
              onClick={async () => {
                try {
                  const response = await fetch(
                    `${localStorage.getItem('serverUrl') || '/api/v1'}/themes/${previewTheme.id}/export`
                  );
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${previewTheme.name}.zip`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Failed to export theme:', err);
                }
              }}
            >
              Export
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => previewTheme && handleApplyTheme(previewTheme)}
            disabled={isCurrentTheme(previewTheme?.id || '') || applying === previewTheme?.id}
          >
            {isCurrentTheme(previewTheme?.id || '') ? 'Current Theme' : applying === previewTheme?.id ? 'Applying...' : 'Apply Theme'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
