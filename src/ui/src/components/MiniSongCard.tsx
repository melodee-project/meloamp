import React from 'react';
import { Card, Typography, Box, IconButton, Tooltip, Stack } from '@mui/material';
import { Song } from '../apiModels';
import { useNavigate } from 'react-router-dom';
import { Favorite, FavoriteBorder, ThumbDown, ThumbDownOffAlt, QueueMusic, SkipNext } from '@mui/icons-material';
import { useQueueStore } from '../queueStore';
import { toQueueSong } from './toQueueSong';
import { useTranslation } from 'react-i18next';

interface MiniSongCardProps {
  song: Song;
  onClick?: (song: Song) => void;
}

const MiniSongCard: React.FC<MiniSongCardProps> = ({ song, onClick }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const playNow = useQueueStore(state => state.playNow);
  const addToQueue = useQueueStore(state => state.addToQueue);
  const [favorite, setFavorite] = React.useState(song.userStarred);
  const [hated, setHated] = React.useState(song.userRating === -1);
  const [hovered, setHovered] = React.useState(false);

  const handlePlayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNow(toQueueSong(song));
  };
  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(toQueueSong(song));
  };
  const handleAddLast = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(toQueueSong(song));
  };
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite((prev) => !prev);
    // TODO: Call API to update favorite
  };
  const handleToggleHated = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHated((prev) => !prev);
    // TODO: Call API to update hated
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
