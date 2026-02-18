import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Skeleton,
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, Album } from '@mui/icons-material';
import { apiRequest } from '../api';
import { ChartListModel, ChartDetailModel, ChartTrackModel } from '../apiModels';
import { useNavigate } from 'react-router-dom';

export default function ChartsPage() {
  const [charts, setCharts] = React.useState<ChartListModel[]>([]);
  const [selectedChart, setSelectedChart] = React.useState<ChartDetailModel | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchCharts = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('/charts');
        let chartList: ChartListModel[] = [];
        if (Array.isArray(response.data)) {
          chartList = response.data;
        } else if (Array.isArray(response.data?.data)) {
          chartList = response.data.data;
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          chartList = response.data.data.data;
        }
        setCharts(chartList);
      } catch (err: any) {
        setError(err.message || 'Failed to load charts');
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, []);

  const handleChartClick = async (chartId: string) => {
    try {
      setLoading(true);
      const response = await apiRequest(`/charts/${chartId}`);
      setSelectedChart(response.data?.data || response.data || null);
    } catch (err: any) {
      console.error('Failed to load chart details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSongClick = (songId: string) => {
    navigate(`/songs/${songId}`);
  };

  const getPositionChange = (current: number, previous?: number) => {
    if (previous === undefined || previous === null) return { icon: <TrendingUp />, color: 'success.main' };
    if (current < previous) return { icon: <TrendingUp />, color: 'success.main' };
    if (current > previous) return { icon: <TrendingDown />, color: 'error.main' };
    return { icon: <TrendingFlat />, color: 'text.secondary' };
  };

  if (loading && charts.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Charts
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} sx={{ width: 220 }}>
              <Skeleton variant="rectangular" height={180} />
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
          Charts
        </Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (selectedChart) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={() => setSelectedChart(null)}
          >
            Charts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            /
          </Typography>
          <Typography variant="h5">{selectedChart.name}</Typography>
        </Box>

        {selectedChart.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedChart.description}
          </Typography>
        )}

        <List>
          {selectedChart.tracks.map((track: ChartTrackModel) => {
            const change = getPositionChange(track.position, track.previousPosition);
            return (
              <React.Fragment key={track.song.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleSongClick(track.song.id)}
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="square"
                      src={track.song.thumbnailUrl || track.song.imageUrl}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      <Album />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color="primary" sx={{ minWidth: 24 }}>
                          {track.position}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {track.song.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {track.song.artist?.name || 'Unknown Artist'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {track.song.album?.name || 'Unknown Album'}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', color: change.color }}>
                    {change.icon}
                  </Box>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Charts
      </Typography>

      {charts.length === 0 ? (
        <Typography color="text.secondary">No charts available.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {charts.map((chart) => (
            <Card
              key={chart.id}
              sx={{ width: 220, cursor: 'pointer' }}
              onClick={() => handleChartClick(chart.id)}
            >
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="180"
                  image={chart.imageUrl || '/placeholder.png'}
                  alt={chart.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {chart.name}
                  </Typography>
                  {chart.description && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {chart.description}
                    </Typography>
                  )}
                  <Chip
                    label={`${chart.trackCount} tracks`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
