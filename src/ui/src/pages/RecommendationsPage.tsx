import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import { PlayArrow, Album, Person, MusicNote } from '@mui/icons-material';
import { apiRequest } from '../api';
import { RecommendationsResponse, RecommendationItem } from '../apiModels';
import { useNavigate } from 'react-router-dom';
import { toQueueSong } from '../components/toQueueSong';
import { useQueueStore } from '../queueStore';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = React.useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const addToQueue = useQueueStore((state) => state.addToQueue);

  React.useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('/recommendations');
        let recs: RecommendationsResponse | null = null;
        if (response.data?.recommendations) {
          recs = response.data;
        } else if (response.data?.data?.recommendations) {
          recs = response.data.data;
        }
        setRecommendations(recs);
      } catch (err: any) {
        setError(err.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleItemClick = (item: RecommendationItem) => {
    if (item.type === 'Artist') {
      navigate(`/artists/${item.id}`);
    } else if (item.type === 'Album') {
      navigate(`/albums/${item.id}`);
    } else if (item.type === 'Song') {
      navigate(`/songs/${item.id}`);
    }
  };

  const handlePlaySong = async (item: RecommendationItem) => {
    if (item.type === 'Song') {
      try {
        const response = await apiRequest(`/songs/${item.id}`);
        if (response.data) {
          addToQueue(toQueueSong(response.data));
        }
      } catch (err) {
        console.error('Failed to play song:', err);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Artist':
        return <Person />;
      case 'Album':
        return <Album />;
      case 'Song':
        return <MusicNote />;
      default:
        return <MusicNote />;
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Recommendations
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} sx={{ width: 220 }}>
              <Skeleton variant="rectangular" height={140} />
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
          Recommendations
        </Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Recommendations
        </Typography>
        {recommendations?.category && (
          <Chip label={recommendations.category} color="primary" variant="outlined" />
        )}
      </Box>

      {recommendations?.recommendations.length === 0 ? (
        <Typography color="text.secondary">
          No recommendations available. Play more music to get personalized recommendations!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {recommendations?.recommendations.map((item) => (
            <Card key={item.id} sx={{ width: 220, display: 'flex', flexDirection: 'column' }}>
              <CardActionArea onClick={() => handleItemClick(item)}>
                <CardMedia
                  component="img"
                  height="140"
                  image={item.imageUrl || '/placeholder.png'}
                  alt={item.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getTypeIcon(item.type)}
                    <Chip label={item.type} size="small" />
                  </Box>
                  <Typography variant="subtitle1" noWrap fontWeight={600}>
                    {item.name}
                  </Typography>
                  {item.artist && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.artist}
                    </Typography>
                  )}
                  {item.reason && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {item.reason}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
              {item.type === 'Song' && (
                <Box sx={{ p: 1, pt: 0 }}>
                  <Tooltip title="Play now">
                    <IconButton onClick={() => handlePlaySong(item)} color="primary">
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
