import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  FilterList,
  MusicNote,
  Search,
  SearchOff,
  QueueMusic,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import apiRequest, { buildEndpoint, unwrapApiResponse } from '../api';
import { API_ROUTES } from '../apiRoutes';
import { AdvancedSearchRequest, AdvancedSearchResponse, Song } from '../apiModels';
import SongCard from '../components/SongCard';
import ArtistCard from '../components/ArtistCard';
import AlbumCard from '../components/AlbumCard';
import PlaylistCard from '../components/PlaylistCard';

type SearchType = 'songs' | 'albums' | 'artists' | 'playlists';

interface SearchSongResponse {
  meta: {
    totalPages?: number;
    currentPage?: number;
    totalCount?: number;
  };
  data: Song[];
}

function unwrapPayload<T>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;
  const nested = (value as { data?: unknown }).data;
  if (nested && typeof nested === 'object' && ('results' in nested || 'data' in nested)) {
    return nested as T;
  }
  if ((value as { results?: unknown }).hasOwnProperty('results')) {
    return value as T;
  }
  return null;
}

export default function SearchAdvancedPage() {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState('');
  const [activeTypes, setActiveTypes] = React.useState<SearchType[]>(['songs', 'albums', 'artists']);
  const [artist, setArtist] = React.useState('');
  const [album, setAlbum] = React.useState('');
  const [genres, setGenres] = React.useState('');
  const [moods, setMoods] = React.useState('');
  const [key, setKey] = React.useState('');
  const [yearFrom, setYearFrom] = React.useState('');
  const [yearTo, setYearTo] = React.useState('');
  const [bpmFrom, setBpmFrom] = React.useState('');
  const [bpmTo, setBpmTo] = React.useState('');
  const [durationFrom, setDurationFrom] = React.useState('');
  const [durationTo, setDurationTo] = React.useState('');
  const [sortBy, setSortBy] = React.useState('relevance');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [limit, setLimit] = React.useState(20);
  const [page, setPage] = React.useState(1);
  const [advancedLoading, setAdvancedLoading] = React.useState(false);
  const [songsLoading, setSongsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [advancedResponse, setAdvancedResponse] = React.useState<AdvancedSearchResponse | null>(null);
  const [songResponse, setSongResponse] = React.useState<Song[] | null>(null);
  const [songTotal, setSongTotal] = React.useState(0);

  const splitCsv = (value: string) => (
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );

  const buildPayload = (): AdvancedSearchRequest => {
    const yearRangeActive = yearFrom || yearTo;
    const bpmRangeActive = bpmFrom || bpmTo;
    const durationRangeActive = durationFrom || durationTo;
    const genreValues = splitCsv(genres);
    const moodValues = splitCsv(moods);

    const filters: AdvancedSearchRequest['filters'] = {};
    if (genreValues.length) filters.genre = genreValues;
    if (moodValues.length) filters.mood = moodValues;
    if (key.trim()) filters.key = key.trim();
    if (artist.trim()) filters.artist = artist.trim();
    if (album.trim()) filters.album = album.trim();
    if (yearRangeActive) {
      filters.year = {
        min: yearFrom ? Number(yearFrom) : null,
        max: yearTo ? Number(yearTo) : null,
      };
    }
    if (bpmRangeActive) {
      filters.bpm = {
        min: bpmFrom ? Number(bpmFrom) : null,
        max: bpmTo ? Number(bpmTo) : null,
      };
    }
    if (durationRangeActive) {
      filters.duration = {
        min: durationFrom ? Number(durationFrom) : null,
        max: durationTo ? Number(durationTo) : null,
      };
    }

    return {
      query: query.trim() || null,
      filters: filters,
      types: activeTypes,
      sortBy,
      sortOrder,
      page,
      limit,
    };
  };

  const loadAdvancedResults = async () => {
    try {
      setAdvancedLoading(true);
      setError(null);
      const payload = buildPayload();
      const response = await apiRequest<AdvancedSearchResponse>(API_ROUTES.search.advanced, {
        method: 'POST',
        data: payload,
      });

      const payloadData = unwrapPayload<AdvancedSearchResponse>(response.data);
      setAdvancedResponse(payloadData ? unwrapApiResponse(payloadData) : null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setAdvancedLoading(false);
    }
  };

  const loadSongEndpoint = async () => {
    try {
      setSongsLoading(true);
      setError(null);
      const response = await apiRequest<SearchSongResponse>(buildEndpoint(API_ROUTES.search.songs), {
        params: {
          q: query || undefined,
          page,
          pageSize: limit,
          filterByArtistApiKey: artist || undefined,
        },
      });
      const payload = unwrapPayload<SearchSongResponse>(response.data);
      const fallback = unwrapApiResponse(response.data);
      const source = (payload || (fallback as SearchSongResponse)) as SearchSongResponse | null;
      if (source) {
        setSongResponse(source.data || []);
        setSongTotal(source.meta?.totalCount || 0);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setSongsLoading(false);
    }
  };

  const toggleType = (type: SearchType) => {
    setActiveTypes((current) => {
      if (current.includes(type)) return current.filter((x) => x !== type);
      return [...current, type];
    });
  };

  const hasFilters = Boolean(query || artist || album || genres || moods || key || yearFrom || yearTo || bpmFrom || bpmTo || durationFrom || durationTo);
  const songs = advancedResponse?.results.songs ?? [];
  const artists = advancedResponse?.results.artists ?? [];
  const albums = advancedResponse?.results.albums ?? [];
  const playlists = advancedResponse?.results.playlists ?? [];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('searchAdvanced.title', 'Advanced Search')}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              fullWidth
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              label={t('searchAdvanced.query', 'Query')}
              placeholder={t('search.placeholder', 'Search artists, albums, tracks...')}
              InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, opacity: 0.6 }} /> }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  loadAdvancedResults();
                }
              }}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="flex-start" flexWrap="wrap">
              <TextField value={artist} onChange={(event) => setArtist(event.target.value)} size="small" label={t('searchAdvanced.artist', 'Artist')} />
              <TextField value={album} onChange={(event) => setAlbum(event.target.value)} size="small" label={t('searchAdvanced.album', 'Album')} />
              <TextField value={genres} onChange={(event) => setGenres(event.target.value)} size="small" label={t('searchAdvanced.genres', 'Genres')} />
              <TextField value={moods} onChange={(event) => setMoods(event.target.value)} size="small" label={t('searchAdvanced.moods', 'Moods (comma separated)')} />
              <TextField value={key} onChange={(event) => setKey(event.target.value)} size="small" label={t('searchAdvanced.key', 'Musical Key')} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
              <TextField value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} size="small" label={t('searchAdvanced.yearFrom', 'Year from')} type="number" />
              <TextField value={yearTo} onChange={(event) => setYearTo(event.target.value)} size="small" label={t('searchAdvanced.yearTo', 'Year to')} type="number" />
              <TextField value={bpmFrom} onChange={(event) => setBpmFrom(event.target.value)} size="small" label={t('searchAdvanced.bpmFrom', 'BPM from')} type="number" />
              <TextField value={bpmTo} onChange={(event) => setBpmTo(event.target.value)} size="small" label={t('searchAdvanced.bpmTo', 'BPM to')} type="number" />
              <TextField value={durationFrom} onChange={(event) => setDurationFrom(event.target.value)} size="small" label={t('searchAdvanced.durationFrom', 'Duration min (ms)')} type="number" />
              <TextField value={durationTo} onChange={(event) => setDurationTo(event.target.value)} size="small" label={t('searchAdvanced.durationTo', 'Duration max (ms)')} type="number" />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center" flexWrap="wrap">
              <Button variant="outlined" size="small" startIcon={<FilterList />} onClick={() => setActiveTypes(['songs', 'albums', 'artists'])}>
                {t('searchAdvanced.toggleContent', 'Clear Types')}
              </Button>
              {(['songs', 'albums', 'artists', 'playlists'] as SearchType[]).map((type) => (
                <Button
                  key={type}
                  variant={activeTypes.includes(type) ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => toggleType(type)}
                >
                  {type}
                </Button>
              ))}
              <TextField
                select
                size="small"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                label={t('searchAdvanced.sortBy', 'Sort by')}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="relevance">relevance</MenuItem>
                <MenuItem value="name">name</MenuItem>
                <MenuItem value="created">created</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                label={t('searchAdvanced.sortOrder', 'Sort order')}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="asc">asc</MenuItem>
                <MenuItem value="desc">desc</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value) || 20)}
                label={t('searchAdvanced.limit', 'Limit')}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </TextField>
              <TextField
                size="small"
                type="number"
                label={t('searchAdvanced.page', 'Page')}
                value={page}
                onChange={(event) => setPage(Number(event.target.value) || 1)}
                sx={{ width: 110 }}
              />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="contained" startIcon={<Search />} onClick={loadAdvancedResults}>
                {t('searchAdvanced.execute', 'Run advanced search')}
              </Button>
              <Button variant="outlined" startIcon={<QueueMusic />} onClick={loadSongEndpoint} disabled={!query && !hasFilters}>
                {t('searchAdvanced.searchSongs', 'Run /search/songs')}
              </Button>
            </Stack>
            {(!advancedLoading && !songsLoading && !query && activeTypes.length === 0) && (
              <Typography color="text.secondary" variant="body2">
                {t('searchAdvanced.readyHint', 'Enter a query and click search to begin')}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {(advancedLoading || songsLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!advancedLoading && !songsLoading && (
        <Box sx={{ mt: 2 }}>
          {!hasFilters && !query && (
            <Paper sx={{ p: 2 }}>
              <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchOff />
                {t('searchAdvanced.noInput', 'No filters are active yet. Provide at least one field to run the search.')}
              </Typography>
            </Paper>
          )}

          {(songs.length > 0 || artists.length > 0 || albums.length > 0 || playlists.length > 0) && (
            <>
              {songs.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    <MusicNote fontSize="small" sx={{ mr: 1 }} />
                    {t('searchAdvanced.songResults', 'Song results')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    {songs.map((song) => <SongCard key={song.id} song={song} />)}
                  </Box>
                </Paper>
              )}

              {artists.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {t('searchAdvanced.artistResults', 'Artist results')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    {artists.map((entry) => <ArtistCard key={entry.id} artist={entry} />)}
                  </Box>
                </Paper>
              )}

              {albums.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {t('searchAdvanced.albumResults', 'Album results')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    {albums.map((entry) => <AlbumCard key={entry.id} album={entry} />)}
                  </Box>
                </Paper>
              )}

                  {playlists.length > 0 && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {t('searchAdvanced.playlistResults', 'Playlist results')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                      {playlists.map((entry) => <PlaylistCard key={entry.id} playlist={entry} />)}
                    </Box>
                  </Paper>
                )}
            </>
          )}

          {songResponse && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('searchAdvanced.songEndpointResults', 'Song endpoint results')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('searchAdvanced.totalResults', { count: songTotal })}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {songResponse.map((song) => <SongCard key={song.id} song={song} />)}
              </Box>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}
