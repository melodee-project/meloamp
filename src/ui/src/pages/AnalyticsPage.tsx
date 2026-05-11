import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Stack,
} from '@mui/material';
import {
  AccessTime,
  BarChart,
  Group,
  MusicNote as MusicNoteIcon,
  LibraryMusic,
  Album,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api';
import {
  ListeningStatistics,
  TopContentResponse,
  TopContentItem,
} from '../apiModels';

type Period = 'day' | 'week' | 'month' | 'year';
type TopType = 'songs' | 'artists' | 'albums' | 'genres';

const PERIOD_LABELS = ['day', 'week', 'month', 'year'];

function normalizeListening(data: unknown): ListeningStatistics | null {
  if (!data || typeof data !== 'object') return null;
  const response = data as { data?: ListeningStatistics };
  return response?.data || null;
}

function normalizeTopContent(data: unknown): TopContentResponse | null {
  if (!data || typeof data !== 'object') return null;
  const response = data as { data?: TopContentResponse; items?: TopContentItem[] };
  if (response?.data && typeof response.data === 'object' && 'items' in response.data) {
    return response.data as TopContentResponse;
  }
  if (Array.isArray(response.items)) {
    return {
      items: response.items,
      period: 'week',
      type: 'songs',
    } as TopContentResponse;
  }
  return null;
}

function formatMinutes(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTopItem(item: TopContentItem) {
  const plays = item.playCount || 0;
  const playTime = item.playTime ? `${formatMinutes(item.playTime / 60)}h` : null;
  const timeText = playTime ? ` · ${playTime}` : '';
  return `${plays} play${plays === 1 ? '' : 's'}${timeText}`;
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = React.useState<Period>('week');
  const [topType, setTopType] = React.useState<TopType>('songs');
  const [topLimit, setTopLimit] = React.useState(10);
  const [listening, setListening] = React.useState<ListeningStatistics | null>(null);
  const [topContent, setTopContent] = React.useState<TopContentResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [listeningResponse, topResponse] = await Promise.all([
          api.get(`/analytics/listening?period=${period}`),
          api.get(`/analytics/top/${period}`, {
            params: { type: topType, limit: topLimit },
          }),
        ]);

        setListening(normalizeListening(listeningResponse.data));
        setTopContent(normalizeTopContent(topResponse.data));
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [period, topType, topLimit, t]);

  const topItems = topContent?.items || [];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {t('analytics.title', 'Analytics')}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('analytics.period', 'Period')}
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={period}
          exclusive
          onChange={(_, value) => {
            if (value) {
              setPeriod(value);
            }
          }}
        >
          {PERIOD_LABELS.map((value) => (
            <ToggleButton key={value} value={value}>
              {t(`analytics.periods.${value}`, value)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && !listening && !topContent ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {listening && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTime color="primary" />
                    <Typography variant="h6">
                      {t('analytics.totalPlayTime', 'Total play time')}
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {Math.round((listening.totalPlayTime || 0) / 60)} {t('analytics.minutes', 'minutes')}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BarChart color="primary" />
                    <Typography variant="h6">
                      {t('analytics.totalPlays', 'Total plays')}
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {listening.totalTracksPlayed || 0}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LibraryMusic color="primary" />
                    <Typography variant="h6">
                      {t('analytics.periodLabel', 'Period')}
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {listening.period || period}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          )}

          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">
                {t('analytics.topContent', 'Top Content')}
              </Typography>
              <Stack direction="row" spacing={1}>
                <ToggleButtonGroup
                  size="small"
                  value={topType}
                  exclusive
                  onChange={(_, value) => {
                    if (value) {
                      setTopType(value);
                    }
                  }}
                >
                  <ToggleButton value="songs">
                    <MusicNoteIcon sx={{ mr: 0.75 }} />
                    {t('analytics.songs', 'Songs')}
                  </ToggleButton>
                  <ToggleButton value="artists">
                    <Group sx={{ mr: 0.75 }} />
                    {t('analytics.artists', 'Artists')}
                  </ToggleButton>
                  <ToggleButton value="albums">
                    <Album sx={{ mr: 0.75 }} />
                    {t('analytics.albums', 'Albums')}
                  </ToggleButton>
                  <ToggleButton value="genres">
                    <BarChart sx={{ mr: 0.75 }} />
                    {t('analytics.genres', 'Genres')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>

            {!topItems.length ? (
              <Typography color="text.secondary">
                {t('analytics.noTopContent', 'No top content available for the selected period.')}
              </Typography>
            ) : (
              <List>
                {topItems.map((item, index) => (
                  <React.Fragment key={`${item.id}-${index}`}>
                    <ListItem>
                      <ListItemText
                        primary={`#${item.rank || index + 1} ${item.name || t('common.noResults', 'Unknown')}`}
                        secondary={formatTopItem(item)}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
