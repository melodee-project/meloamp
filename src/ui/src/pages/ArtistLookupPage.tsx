import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import apiRequest, { unwrapApiResponse } from '../api';
import { API_ROUTES } from '../apiRoutes';
import { ArtistLookupCandidate, ArtistLookupRequest, ArtistLookupResponse, ProviderInfo } from '../apiModels';

function normalizeProviderList(data: unknown): ProviderInfo[] {
  const payload = unwrapApiResponse<unknown>(data);
  if (Array.isArray(payload)) {
    return payload as ProviderInfo[];
  }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data;
    if (Array.isArray(nested)) {
      return nested as ProviderInfo[];
    }
  }
  return [];
}

function normalizeLookupResponse(data: unknown): ArtistLookupResponse {
  const payload = unwrapApiResponse<unknown>(data);
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'candidates' in payload) {
    const source = payload as { candidates?: unknown; hasPartialFailures?: unknown; providers?: unknown };
    return {
      candidates: Array.isArray(source.candidates) ? source.candidates as ArtistLookupCandidate[] : [],
      hasPartialFailures: Boolean(source.hasPartialFailures),
      providers: Array.isArray(source.providers) ? source.providers as ProviderInfo[] : [],
    };
  }
  return {
    candidates: [],
    hasPartialFailures: false,
    providers: [],
  };
}

function formatCandidate(candidate: ArtistLookupCandidate) {
  const parts: string[] = [];
  if (candidate.sortName) parts.push(`Sort name: ${candidate.sortName}`);
  if (candidate.providerId) parts.push(`Provider ID: ${candidate.providerId}`);
  if (candidate.musicBrainzId) parts.push(`MusicBrainz: ${candidate.musicBrainzId}`);
  if (candidate.spotifyId) parts.push(`Spotify: ${candidate.spotifyId}`);
  if (candidate.discogsId) parts.push(`Discogs: ${candidate.discogsId}`);
  if (candidate.itunesId) parts.push(`iTunes: ${candidate.itunesId}`);
  if (candidate.wikiDataId) parts.push(`WikiData: ${candidate.wikiDataId}`);
  if (candidate.lastFmId) parts.push(`Last.fm: ${candidate.lastFmId}`);
  if (candidate.amgId) parts.push(`AMG: ${candidate.amgId}`);
  return parts;
}

export default function ArtistLookupPage() {
  const { t } = useTranslation();
  const [providers, setProviders] = React.useState<ProviderInfo[]>([]);
  const [selectedProviders, setSelectedProviders] = React.useState<string[]>([]);
  const [artistName, setArtistName] = React.useState('');
  const [limit, setLimit] = React.useState(25);
  const [candidates, setCandidates] = React.useState<ArtistLookupCandidate[]>([]);
  const [hasPartialFailures, setHasPartialFailures] = React.useState(false);
  const [loading, setLoading] = React.useState({
    providers: false,
    search: false,
  });
  const [error, setError] = React.useState<string | null>(null);

  const loadProviders = React.useCallback(async () => {
    setLoading((state) => ({ ...state, providers: true }));
    setError(null);
    try {
      const response = await apiRequest<ProviderInfo[]>(API_ROUTES.artistLookup.providers);
      setProviders(normalizeProviderList(response.data));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoading((state) => ({ ...state, providers: false }));
    }
  }, [t]);

  const search = React.useCallback(async () => {
    if (!artistName.trim()) {
      setError(t('artistLookup.enterArtistName', 'Please enter an artist name.'));
      return;
    }

    setError(null);
    setLoading((state) => ({ ...state, search: true }));
    try {
      const payload: ArtistLookupRequest = {
        artistName: artistName.trim(),
        limit,
        providerIds: selectedProviders.length ? selectedProviders : undefined,
      };
      const response = await apiRequest<ArtistLookupResponse>(API_ROUTES.artistLookup.search, {
        method: 'POST',
        data: payload,
      });
      const lookupResult = normalizeLookupResponse(response.data);
      setCandidates(lookupResult.candidates || []);
      setHasPartialFailures(lookupResult.hasPartialFailures || false);
      if (lookupResult.providers.length) {
        setProviders(lookupResult.providers);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoading((state) => ({ ...state, search: false }));
    }
  }, [artistName, limit, selectedProviders, t]);

  React.useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const toggleProvider = React.useCallback((providerId: string) => {
    setSelectedProviders((current) => (
      current.includes(providerId)
        ? current.filter((value) => value !== providerId)
        : [...current, providerId]
    ));
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedProviders([]);
  }, []);

  const selectedProviderNames = React.useMemo(() => (
    providers
      .filter((provider) => selectedProviders.includes(provider.id))
      .map((provider) => provider.displayName)
  ), [providers, selectedProviders]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('artistLookup.title', 'Artist Lookup')}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              label={t('artistLookup.artistName', 'Artist Name')}
              placeholder={t('artistLookup.searchPlaceholder', 'Search artist name')}
              value={artistName}
              onChange={(event) => setArtistName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  search();
                }
              }}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, opacity: 0.75 }} /> }}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center" flexWrap="wrap">
              <TextField
                size="small"
                type="number"
                label={t('artistLookup.limit', 'Limit')}
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value) || 25)}
                sx={{ minWidth: 130 }}
                inputProps={{ min: 1, max: 250 }}
              />
              <Button variant="outlined" onClick={clearSelection} disabled={!selectedProviders.length}>
                {t('artistLookup.clearProviders', 'Clear providers')}
              </Button>
              <Button variant="contained" onClick={search} disabled={loading.search}>
                {loading.search ? t('artistLookup.searching', 'Searching...') : t('artistLookup.search', 'Search')}
              </Button>
              <Button variant="outlined" onClick={loadProviders} disabled={loading.providers}>
                {loading.providers ? t('common.loading', 'Loading...') : t('artistLookup.reloadProviders', 'Refresh providers')}
              </Button>
            </Stack>

            <Typography variant="subtitle2" color="text.secondary">
              {t('artistLookup.providers', 'Providers')}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {providers.length === 0 && !loading.providers && (
                <Typography color="text.secondary">{t('artistLookup.noProviders', 'No providers available.')}</Typography>
              )}
              {providers.map((provider) => (
                <Chip
                  key={provider.id}
                  label={provider.displayName}
                  clickable
                  color={selectedProviders.includes(provider.id) ? 'primary' : 'default'}
                  variant={selectedProviders.includes(provider.id) ? 'filled' : 'outlined'}
                  onClick={() => toggleProvider(provider.id)}
                  disabled={loading.search}
                />
              ))}
            </Stack>
            {selectedProviderNames.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {t('artistLookup.selectedProviders', 'Selected providers')}: {selectedProviderNames.join(', ')}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">
            {t('artistLookup.results', 'Results')}
          </Typography>
          {hasPartialFailures && (
            <Chip color="warning" size="small" label={t('artistLookup.partialFailures', 'Some providers failed')} />
          )}
        </Stack>

        {!candidates.length ? (
          <Typography color="text.secondary">
            {loading.search
              ? t('common.loading', 'Loading...')
              : t('artistLookup.noResults', 'No artist matches found.')}
          </Typography>
        ) : (
          <List>
            {candidates.map((candidate) => {
              const details = formatCandidate(candidate);
              return (
                <ListItem
                  key={`${candidate.providerId || 'provider'}-${candidate.name}-${candidate.providerDisplayName}`}
                  alignItems="flex-start"
                >
                  <ListItemText
                    primary={`${candidate.name} (${candidate.providerDisplayName})`}
                    secondary={
                      <>
                        <Typography variant="body2">
                          {details.length
                            ? details.map((detail, index) => {
                              return (
                                <React.Fragment key={detail}>
                                  {index > 0 && ' · '}
                                  {detail}
                                </React.Fragment>
                              );
                            })
                            : t('artistLookup.noCandidateDetails', 'No extra candidate metadata available.')}
                        </Typography>
                        {candidate.imageUrl ? (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {t('artistLookup.image', 'Image')}: {candidate.imageUrl}
                          </Typography>
                        ) : null}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
}
