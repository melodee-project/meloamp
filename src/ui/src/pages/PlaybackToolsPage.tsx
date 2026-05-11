import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  DeveloperBoard,
  Refresh,
  Settings as SettingsIcon,
  PowerSettingsNew,
  Sync,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { API_ROUTES } from '../apiRoutes';
import apiRequest, { buildEndpoint, unwrapApiResponse } from '../api';
import {
  AttachEndpointRequest,
  BackendCapabilities,
  BackendStatus,
  EndpointDto,
  PlaybackSettings,
  UpdatePlaybackSettingsRequest,
} from '../apiModels';

function endpointListFromResponse(data: unknown): EndpointDto[] {
  const normalized = unwrapApiResponse<unknown>(data);
  if (Array.isArray(normalized)) {
    return normalized as EndpointDto[];
  }
  if (normalized && typeof normalized === 'object') {
    const candidate = (normalized as { data?: unknown }).data;
    if (Array.isArray(candidate)) return candidate as EndpointDto[];
  }
  return [];
}

type LoadingState = {
  capabilities: boolean;
  status: boolean;
  settings: boolean;
  endpointList: boolean;
  action: boolean;
};

function boolLabel(value: boolean | undefined | null, t: (key: string, fallback?: string) => string) {
  return value ? t('common.yes') : t('common.no');
}

export default function PlaybackToolsPage() {
  const { t } = useTranslation();
  const [capabilities, setCapabilities] = React.useState<BackendCapabilities | null>(null);
  const [status, setStatus] = React.useState<BackendStatus | null>(null);
  const [settings, setSettings] = React.useState<PlaybackSettings | null>(null);
  const [endpoints, setEndpoints] = React.useState<EndpointDto[]>([]);
  const [sessionEndpoints, setSessionEndpoints] = React.useState<EndpointDto[]>([]);

  const [settingsForm, setSettingsForm] = React.useState<UpdatePlaybackSettingsRequest>({});
  const [attachSessionApiKey, setAttachSessionApiKey] = React.useState('');
  const [forSessionId, setForSessionId] = React.useState('');
  const [heartbeatSessionId, setHeartbeatSessionId] = React.useState('');
  const [heartbeatResult, setHeartbeatResult] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<LoadingState>({
    status: false,
    capabilities: false,
    settings: false,
    endpointList: false,
    action: false,
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const setLoadingAction = React.useCallback((action: keyof LoadingState, value: boolean) => {
    setLoading((current) => ({ ...current, [action]: value }));
  }, []);

  const clearMessages = React.useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const loadCapabilities = React.useCallback(async () => {
    setLoadingAction('capabilities', true);
    try {
      const response = await apiRequest<BackendCapabilities>(API_ROUTES.playback.backends);
      const payload = unwrapApiResponse<BackendCapabilities>(response.data);
      setCapabilities(payload || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('capabilities', false);
    }
  }, [setLoadingAction, t]);

  const loadStatus = React.useCallback(async () => {
    setLoadingAction('status', true);
    try {
      const response = await apiRequest<BackendStatus>(API_ROUTES.playback.status);
      const payload = unwrapApiResponse<BackendStatus>(response.data);
      setStatus(payload || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('status', false);
    }
  }, [setLoadingAction, t]);

  const loadSettings = React.useCallback(async () => {
    setLoadingAction('settings', true);
    try {
      const response = await apiRequest<PlaybackSettings>(API_ROUTES.playback.settings);
      const payload = unwrapApiResponse<PlaybackSettings>(response.data);
      if (payload) {
        setSettings(payload);
        setSettingsForm({
          crossfadeDuration: payload.crossfadeDuration,
          gaplessPlayback: payload.gaplessPlayback,
          volumeNormalization: payload.volumeNormalization,
          replayGain: payload.replayGain,
          audioQuality: payload.audioQuality,
          equalizerPreset: payload.equalizerPreset || '',
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('settings', false);
    }
  }, [setLoadingAction, t]);

  const loadEndpoints = React.useCallback(async () => {
    setLoadingAction('endpointList', true);
    try {
      const response = await apiRequest(API_ROUTES.playback.endpoints);
      setEndpoints(endpointListFromResponse(response.data));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('endpointList', false);
    }
  }, [setLoadingAction, t]);

  const refreshAll = React.useCallback(async () => {
    clearMessages();
    await Promise.all([loadCapabilities(), loadStatus(), loadSettings(), loadEndpoints()]);
  }, [clearMessages, loadCapabilities, loadEndpoints, loadSettings, loadStatus]);

  React.useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const saveSettings = async () => {
    clearMessages();
    setLoadingAction('action', true);
    try {
      await apiRequest(API_ROUTES.playback.settings, {
        method: 'POST',
        data: settingsForm,
      });
      await loadSettings();
      setSuccess(t('playbackTools.settingsSaved', 'Playback settings saved.'));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('action', false);
    }
  };

  const registerBackend = async () => {
    clearMessages();
    setLoadingAction('action', true);
    try {
      await apiRequest(API_ROUTES.playback.registerBackend, { method: 'POST' });
      await loadEndpoints();
      setSuccess(t('playbackTools.backendRegistered', 'Backend registered.'));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('action', false);
    }
  };

  const initializeBackend = async () => {
    clearMessages();
    setLoadingAction('action', true);
    try {
      await apiRequest(API_ROUTES.playback.initializeBackend, { method: 'POST' });
      await Promise.all([loadStatus(), loadCapabilities()]);
      setSuccess(t('playbackTools.backendInitialized', 'Playback backend initialized.'));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('action', false);
    }
  };

  const shutdownBackend = async () => {
    clearMessages();
    setLoadingAction('action', true);
    try {
      await apiRequest(API_ROUTES.playback.shutdownBackend, { method: 'POST' });
      await Promise.all([loadStatus(), loadCapabilities()]);
      setSuccess(t('playbackTools.backendShutdown', 'Playback backend shutdown.'));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('action', false);
    }
  };

  const loadSessionEndpoints = async () => {
    if (!forSessionId.trim()) {
      setError(t('playbackTools.enterSessionId', 'Enter a session ID'));
      return;
    }

    clearMessages();
    setLoadingAction('action', true);
    try {
      const route = buildEndpoint(API_ROUTES.playback.endpointForSession, { sessionId: forSessionId });
      const response = await apiRequest(route);
      setSessionEndpoints(endpointListFromResponse(response.data));
      if (forSessionId.trim()) {
        setSuccess(t('playbackTools.sessionEndpointsLoaded', 'Session endpoints loaded.'));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('action', false);
    }
  };

  const runHeartbeat = async () => {
    if (!heartbeatSessionId.trim()) {
      setError(t('playbackTools.enterHeartbeatSessionId', 'Enter a heartbeat session ID'));
      return;
    }

    clearMessages();
    setLoadingAction('action', true);
    try {
      const route = buildEndpoint(API_ROUTES.playback.heartbeat, { sessionId: heartbeatSessionId });
      const response = await apiRequest(route, { method: 'POST' });
      const payload = response?.data;
      const unwrapped = unwrapApiResponse(payload as any);
      const result = typeof unwrapped === 'boolean'
        ? unwrapped
        : typeof payload === 'boolean'
          ? payload
          : !!payload;
      setHeartbeatResult(String(result));
    } catch (err: any) {
      setHeartbeatResult(err?.response?.data?.message || t('common.error', 'An error occurred'));
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('action', false);
    }
  };

  const attachEndpoint = async (endpointId: string) => {
    if (!attachSessionApiKey.trim()) {
      setError(t('playbackTools.enterSessionApiKey', 'Enter a session API key.'));
      return;
    }

    clearMessages();
    setLoadingAction('action', true);
    const payload: AttachEndpointRequest = { sessionApiKey: attachSessionApiKey };
    try {
      const route = buildEndpoint(API_ROUTES.playback.endpointAttach, { endpointId });
      await apiRequest(route, { method: 'POST', data: payload });
      await loadEndpoints();
      setSuccess(t('playbackTools.endpointAttached', 'Endpoint attached.'));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('action', false);
    }
  };

  const detachEndpoint = async (endpointId: string) => {
    clearMessages();
    setLoadingAction('action', true);
    try {
      const route = buildEndpoint(API_ROUTES.playback.endpointDetach, { endpointId });
      await apiRequest(route, { method: 'POST' });
      await loadEndpoints();
      setSuccess(t('playbackTools.endpointDetached', 'Endpoint detached.'));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoadingAction('action', false);
    }
  };

  const endpointCapabilityLabels = (capabilitiesJson: string | null | undefined) => {
    if (!capabilitiesJson) {
      return null;
    }

    try {
      const parsed = JSON.parse(capabilitiesJson) as Record<string, boolean>;
      const pairs = Object.entries(parsed).filter(([, value]) => typeof value === 'boolean');
      if (!pairs.length) return null;
      return pairs.map(([key, value]) => `${key}: ${value ? t('common.yes', 'Yes') : t('common.no', 'No')}`).join(' · ');
    } catch {
      return null;
    }
  };

  const isBusy = loading.capabilities || loading.status || loading.settings || loading.endpointList || loading.action;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SettingsIcon />
        <Typography variant="h4">{t('playbackTools.title', 'Playback Tools')}</Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refreshAll}
          disabled={isBusy}
        >
          {t('playbackTools.refresh', 'Refresh')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading.action && (
        <Box sx={{ mb: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('playbackTools.backendStatus', 'Playback backend status')}
            </Typography>
            {loading.status ? (
              <CircularProgress size={24} />
            ) : status ? (
              <Stack spacing={1}>
                <Chip
                  label={status.isConnected ? t('playbackTools.connected', 'Connected') : t('playbackTools.disconnected', 'Disconnected')}
                  color={status.isConnected ? 'success' : 'default'}
                  size="small"
                />
                <Typography variant="body2">
                  {t('playbackTools.playing', 'Playing')}: {boolLabel(status.isPlaying, t)}
                </Typography>
                <Typography variant="body2">
                  {t('playbackTools.position', 'Position')}: {status.positionSeconds || 0}s
                </Typography>
                <Typography variant="body2">
                  {t('playbackTools.volume', 'Volume')}: {status.volume ?? t('common.unknown', 'Unknown')}
                </Typography>
                <Typography variant="body2">
                  {t('playbackTools.currentItem', 'Current item')}: {status.currentItemApiKey || t('common.unknown', 'Unknown')}
                </Typography>
                {status.statusMessage && (
                  <Typography color="text.secondary" variant="body2">
                    {status.statusMessage}
                  </Typography>
                )}
                {status.errorMessage && (
                  <Typography color="error" variant="body2">
                    {status.errorMessage}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography color="text.secondary">{t('playbackTools.noStatus', 'No status data.')}</Typography>
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('playbackTools.capabilities', 'Backend capabilities')}
            </Typography>
            {loading.capabilities ? (
              <CircularProgress size={24} />
            ) : capabilities ? (
              <Stack spacing={1}>
                <Chip icon={<PowerSettingsNew />} label={`${t('playbackTools.play', 'Play')}: ${boolLabel(capabilities.canPlay, t)}`} />
                <Chip icon={<PowerSettingsNew />} label={`${t('playbackTools.pause', 'Pause')}: ${boolLabel(capabilities.canPause, t)}`} />
                <Chip icon={<PowerSettingsNew />} label={`${t('playbackTools.stop', 'Stop')}: ${boolLabel(capabilities.canStop, t)}`} />
                <Chip icon={<PowerSettingsNew />} label={`${t('playbackTools.seek', 'Seek')}: ${boolLabel(capabilities.canSeek, t)}`} />
                <Chip icon={<PowerSettingsNew />} label={`${t('playbackTools.skip', 'Skip')}: ${boolLabel(capabilities.canSkip, t)}`} />
                <Chip icon={<PowerSettingsNew />} label={`${t('playbackTools.volume', 'Volume')}: ${boolLabel(capabilities.canSetVolume, t)}`} />
                <Chip icon={<PowerSettingsNew />} label={`${t('playbackTools.reportPosition', 'Report position')}: ${boolLabel(capabilities.canReportPosition, t)}`} />
                <Typography variant="body2">
                  {t('playbackTools.backendInfo', 'Backend info')}: {capabilities.backendInfo || t('common.unknown', 'Unknown')}
                </Typography>
              </Stack>
            ) : (
              <Typography color="text.secondary">{t('playbackTools.noCapabilities', 'No capability data.')}</Typography>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('playbackTools.sessionControl', 'Session control')}
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          <Button variant="contained" onClick={initializeBackend} disabled={loading.action} startIcon={<PowerSettingsNew />}>
            {t('playbackTools.initialize', 'Initialize backend')}
          </Button>
          <Button variant="outlined" onClick={shutdownBackend} disabled={loading.action} startIcon={<PowerSettingsNew />}>
            {t('playbackTools.shutdown', 'Shutdown backend')}
          </Button>
          <TextField
            size="small"
            label={t('playbackTools.sessionId', 'Session ID')}
            value={forSessionId}
            onChange={(event) => setForSessionId(event.target.value)}
          />
          <Button onClick={loadSessionEndpoints} disabled={loading.action || !forSessionId} startIcon={<Sync />}>
            {t('playbackTools.loadForSession', 'Load for session')}
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            size="small"
            label={t('playbackTools.heartbeatSessionId', 'Heartbeat session ID')}
            value={heartbeatSessionId}
            onChange={(event) => setHeartbeatSessionId(event.target.value)}
          />
          <Button onClick={runHeartbeat} disabled={loading.action || !heartbeatSessionId}>
            {t('playbackTools.runHeartbeat', 'Run heartbeat')}
          </Button>
          {heartbeatResult !== null && (
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
              {t('playbackTools.heartbeatResult', 'Heartbeat result')}: {heartbeatResult}
            </Typography>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('playbackTools.playbackSettings', 'Playback settings')}
        </Typography>
        {!settings ? (
          <Typography color="text.secondary">{t('playbackTools.noSettings', 'Settings are unavailable until loaded.')}</Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
              <TextField
                type="number"
                size="small"
                label={t('playbackTools.crossfadeDuration', 'Crossfade duration')}
                value={settingsForm.crossfadeDuration ?? settings.crossfadeDuration ?? 0}
                onChange={(event) => setSettingsForm((current) => ({
                  ...current,
                  crossfadeDuration: event.target.value,
                }))}
                sx={{ width: 220 }}
              />
              <TextField
                select
                size="small"
                label={t('playbackTools.replayGain', 'Replay gain')}
                value={settingsForm.replayGain || settings.replayGain || 'none'}
                onChange={(event) => setSettingsForm((current) => ({ ...current, replayGain: event.target.value }))}
                sx={{ width: 220 }}
              >
                <MenuItem value="none">none</MenuItem>
                <MenuItem value="track">track</MenuItem>
                <MenuItem value="album">album</MenuItem>
                <MenuItem value="auto">auto</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label={t('playbackTools.audioQuality', 'Audio quality')}
                value={settingsForm.audioQuality || settings.audioQuality || 'auto'}
                onChange={(event) => setSettingsForm((current) => ({ ...current, audioQuality: event.target.value }))}
                sx={{ width: 220 }}
              >
                <MenuItem value="auto">auto</MenuItem>
                <MenuItem value="high">high</MenuItem>
                <MenuItem value="low">low</MenuItem>
              </TextField>
              <TextField
                size="small"
                label={t('playbackTools.equalizerPreset', 'Equalizer preset')}
                value={settingsForm.equalizerPreset || ''}
                onChange={(event) => setSettingsForm((current) => ({ ...current, equalizerPreset: event.target.value || null }))}
                sx={{ width: 220 }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
              <FormControlLabel
                control={(
                  <Switch
                    checked={Boolean(settingsForm.gaplessPlayback ?? settings.gaplessPlayback)}
                    onChange={(event) => setSettingsForm((current) => ({
                      ...current,
                      gaplessPlayback: event.target.checked,
                    }))}
                  />
                )}
                label={t('playbackTools.gaplessPlayback', 'Gapless playback')}
              />
              <FormControlLabel
                control={(
                  <Switch
                    checked={Boolean(settingsForm.volumeNormalization ?? settings.volumeNormalization)}
                    onChange={(event) => setSettingsForm((current) => ({
                      ...current,
                      volumeNormalization: event.target.checked,
                    }))}
                  />
                )}
                label={t('playbackTools.volumeNormalization', 'Volume normalization')}
              />
            </Stack>
            <Button variant="contained" onClick={saveSettings} disabled={loading.action}>
              {t('playbackTools.saveSettings', 'Save settings')}
            </Button>
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{t('playbackTools.endpointRegistry', 'Endpoint registry')}</Typography>
          <Button onClick={registerBackend} disabled={loading.action}>
            {t('playbackTools.registerEndpoint', 'Register endpoint')}
          </Button>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            size="small"
            label={t('playbackTools.sessionApiKey', 'Session API key')}
            value={attachSessionApiKey}
            onChange={(event) => setAttachSessionApiKey(event.target.value)}
            sx={{ width: 320 }}
          />
        </Stack>

        {loading.endpointList ? (
          <CircularProgress />
        ) : (
          <List dense>
            {endpoints.length === 0 && (
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {t('playbackTools.noEndpoints', 'No endpoints found')}
              </Typography>
            )}
            {endpoints.map((endpoint, index) => {
              const capabilitiesText = endpointCapabilityLabels(endpoint.capabilitiesJson);
              return (
                <React.Fragment key={endpoint.apiKey}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" onClick={() => attachEndpoint(endpoint.apiKey)}>
                          {t('playbackTools.attach', 'Attach')}
                        </Button>
                        <Button size="small" variant="outlined" color="secondary" onClick={() => detachEndpoint(endpoint.apiKey)}>
                          {t('playbackTools.detach', 'Detach')}
                        </Button>
                      </Stack>
                    }
                  >
                    <DeveloperBoard sx={{ mr: 1, mt: 0.5 }} color="action" />
                    <ListItemText
                      primary={`${endpoint.name} (${endpoint.type})`}
                      secondary={(
                        <>
                          <Typography variant="body2">
                            {endpoint.isOwner ? t('playbackTools.owner', 'Owner') : t('playbackTools.shared', 'Shared')}
                            {' · '}
                            {endpoint.room || t('playbackTools.noRoom', 'No room')}
                          </Typography>
                          {capabilitiesText && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {capabilitiesText}
                            </Typography>
                          )}
                        </>
                      )}
                    />
                  </ListItem>
                  {index < endpoints.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>

      {sessionEndpoints.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('playbackTools.sessionEndpoints', 'Endpoints for session {{sessionId}}', { sessionId: forSessionId })}
          </Typography>
          <List dense>
            {sessionEndpoints.map((endpoint, index) => (
              <React.Fragment key={endpoint.apiKey}>
                <ListItem>
                  <ListItemText
                    primary={`${endpoint.name} (${endpoint.type})`}
                    secondary={endpoint.room || t('common.unknown', 'Unknown')}
                  />
                </ListItem>
                {index < sessionEndpoints.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
