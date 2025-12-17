import { debugLog, debugError } from '../debug';
import React from 'react';
import { Card, Typography, Box, IconButton, Tooltip, Stack, Rating } from '@mui/material';
import { Song } from '../apiModels';
import { useNavigate } from 'react-router-dom';
import { Favorite, FavoriteBorder, ThumbDown, ThumbDownOffAlt, QueueMusic, SkipNext } from '@mui/icons-material';
import { useQueueStore } from '../queueStore';
import { toQueueSong } from './toQueueSong';
import { useTranslation } from 'react-i18next';
import api from '../api';

interface MiniSongCardProps {
  song: Song;
  onClick?: (song: Song) => void;
}

const MiniSongCard: React.FC<MiniSongCardProps> = ({ song, onClick }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const addToQueue = useQueueStore(state => state.addToQueue);
  const [favorite, setFavorite] = React.useState(song.userStarred);
  const [hated, setHated] = React.useState(song.userRating === -1);
  const [rating, setRating] = React.useState(song.userRating && song.userRating > 0 ? song.userRating : 0);

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(toQueueSong(song));
  };
  const handleAddLast = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(toQueueSong(song));
  };
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !favorite;
    try {
      debugLog('MiniSongCard', ` Toggling favorite for song ${song.id} to ${newVal}`);
      await api.post(`/songs/starred/${song.id}/${newVal}`);
      setFavorite(newVal);
      // If starring, clear hated state
      if (newVal && hated) {
        setHated(false);
      }
      debugLog('MiniSongCard', ` Favorite updated successfully`);
    } catch (err) {
      debugError('MiniSongCard', 'Failed to update favorite:', err);
    }
  };
  const handleToggleHated = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !hated;
    try {
      debugLog('MiniSongCard', ` Toggling hated for song ${song.id} to ${newVal}`);
      await api.post(`/songs/hated/${song.id}/${newVal}`);
      setHated(newVal);
      if (newVal) {
        setRating(0);
        // If hating, clear favorite
        if (favorite) {
          setFavorite(false);
        }
      }
      debugLog('MiniSongCard', ` Hated updated successfully`);
    } catch (err) {
      debugError('MiniSongCard', 'Failed to update hated:', err);
    }
  };
  const handleRatingChange = async (_e: React.SyntheticEvent, newValue: number | null) => {
    const r = newValue ?? 0;
    try {
      debugLog('MiniSongCard', ` Setting rating for song ${song.id} to ${r}`);
      await api.post(`/songs/setrating/${song.id}/${r}`);
      setRating(r);
      // If rating > 0, clear hated
      if (r > 0 && hated) {
        setHated(false);
      }
      debugLog('MiniSongCard', ` Rating updated successfully`);
    } catch (err) {
      debugError('MiniSongCard', 'Failed to update rating:', err);
    }
  };

  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        m: 0.5,
        minWidth: 0,
        boxShadow: 1,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4, bgcolor: 'background.default' },
        width: '100%',
        maxWidth: '100%',
        minHeight: 56,
      }}
      onClick={() => onClick ? onClick(song) : navigate(`/songs/${song.id}`)}
      title={song.title}
    >
      {/* Song number instead of image */}
      <Box
        sx={{
          width: 56,
          height: 56,
          mr: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: 'primary.main',
            letterSpacing: 1,
            textShadow: '0 2px 8px rgba(0,0,0,0.10)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {song.songNumber || ''}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
        <Typography variant="subtitle2" noWrap fontWeight={600}>
          {song.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          <Box component="span" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/artists/${song.artist?.id}`); }}>
            {song.artist?.name || t('songCard.unknownArtist')}
          </Box>
          {song.album?.name && (
            <>
              {' '}·{' '}
              <Box component="span" sx={{ color: 'text.secondary', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/albums/${song.album?.id}`); }}>
                {song.album?.name}
              </Box>
            </>
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {song.durationFormatted || '--:--'}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0} sx={{ ml: 1 }}>
        <Tooltip title={t('songCard.playNext')}>
          <IconButton size="small" onClick={handlePlayNext}><SkipNext fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title={favorite ? t('songCard.unfavorite') : t('songCard.favorite')}>
          <IconButton size="small" color={favorite ? 'primary' : 'default'} onClick={handleToggleFavorite}>
            {favorite ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </IconButton>
        </Tooltip>
        {/* Rating stars (0..5). Click to set rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5 }} onClick={(e) => e.stopPropagation()}>
          <Rating value={Math.min(5, rating)} size="small" onChange={handleRatingChange} />
        </Box>
        <Tooltip title={hated ? t('songCard.unhate') : t('songCard.hate')}>
          <IconButton size="small" color={hated ? 'error' : 'default'} onClick={handleToggleHated}>
            {hated ? <ThumbDown fontSize="small" /> : <ThumbDownOffAlt fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('songCard.addLast')}>
          <IconButton size="small" onClick={handleAddLast}><QueueMusic fontSize="small" /></IconButton>
        </Tooltip>
      </Stack>
    </Card>
  );
};

export default MiniSongCard;
