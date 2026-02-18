import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Skeleton,
  Pagination,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Album, PlayArrow, AccessTime } from '@mui/icons-material';
import { apiRequest } from '../api';
import { HistoryResponse, HistoryItem } from '../apiModels';
import { useNavigate } from 'react-router-dom';
import { toQueueSong } from '../components/toQueueSong';
import { useQueueStore } from '../queueStore';

export default function HistoryPage() {
  const [history, setHistory] = React.useState<HistoryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const navigate = useNavigate();
  const addToQueue = useQueueStore((state) => state.addToQueue);

  const fetchHistory = React.useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await apiRequest(`/user/last-played?page=${pageNum}&pageSize=50`);
      if (response.data?.data) {
        setHistory(response.data);
      } else if (Array.isArray(response.data)) {
        setHistory({ data: response.data, meta: { totalCount: response.data.length, pageSize: 50, currentPage: pageNum, totalPages: 1, hasNext: false, hasPrevious: false } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  const handlePlayAgain = (item: HistoryItem) => {
    addToQueue(toQueueSong(item.song));
  };

  const handleSongClick = (songId: string) => {
    navigate(`/songs/${songId}`);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !history) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Play History
        </Typography>
        <List>
          {Array.from({ length: 10 }).map((_, i) => (
            <React.Fragment key={i}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Skeleton variant="rectangular" width={56} height={56} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="40%" />}
                  secondary={<Skeleton variant="text" width="60%" />}
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Play History
        </Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AccessTime color="primary" />
        <Typography variant="h4">Play History</Typography>
      </Box>

      {!history?.data || history.data.length === 0 ? (
        <Typography color="text.secondary">
          No play history yet. Start listening to build your history!
        </Typography>
      ) : (
        <>
          <List>
            {history.data.map((item: HistoryItem) => (
              <React.Fragment key={item.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ cursor: 'pointer' }}
                  secondaryAction={
                    <Tooltip title="Play again">
                      <IconButton edge="end" onClick={() => handlePlayAgain(item)}>
                        <PlayArrow />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar
                    onClick={() => handleSongClick(item.song.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Avatar
                      variant="square"
                      src={item.song.thumbnailUrl || item.song.imageUrl}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      <Album />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    onClick={() => handleSongClick(item.song.id)}
                    primary={
                      <Typography variant="subtitle1" fontWeight={600}>
                        {item.song.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.song.artist?.name || 'Unknown Artist'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            size="small"
                            label={formatTimestamp(item.playedAt)}
                            icon={<AccessTime />}
                          />
                          <Chip
                            size="small"
                            label={formatDuration(item.duration || item.song.durationMs)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>

          {history.meta && history.meta.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={history.meta.totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
