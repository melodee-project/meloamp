import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  ButtonBase,
  IconButton,
  Popover,
  Rating,
  Slider,
  Snackbar,
  Tooltip,
  Typography,
  Dialog,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Equalizer,
  Favorite,
  FavoriteBorder,
  Fullscreen,
  FullscreenExit,
  Repeat,
  RepeatOne,
  Shuffle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import api from '../api';
import { RepeatMode, Song, useQueueStore } from '../queueStore';
import { debugError } from '../debug';
import { useScrobble } from '../hooks/useScrobble';
import { useMediaSession } from '../hooks/useMediaSession';
import { EQ_BANDS, useEqualizer } from '../hooks/useEqualizer';
import { usePlaybackBridge } from '../hooks/usePlaybackBridge';
import { usePlaybackErrorRecovery } from '../hooks/usePlaybackErrorRecovery';
import { useTrayUpdate } from '../hooks/useTrayUpdate';
import { DRAWER_WIDTH } from '../components/Sidebar';
import { withStreamAuth } from '../utils/streamUrl';

const PROGRESS_UPDATE_INTERVAL_MS = 250;
const PREVIOUS_RESTART_THRESHOLD_SECONDS = 3;

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

interface PlayerProps {
  /** When the drawer is open the fixed player bar must start after it. */
  sidebarOpen?: boolean;
}

export default function Player({ sidebarOpen = true }: PlayerProps) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { t } = useTranslation();

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [eqAnchor, setEqAnchor] = useState<null | HTMLElement>(null);
  const [volume, setVolume] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const lastProgressUpdateRef = useRef(0);
  const progressRef = useRef(0);

  const queue = useQueueStore((state) => state.queue);
  const current = useQueueStore((state) => state.current);
  const setCurrent = useQueueStore((state) => state.setCurrent);
  const updateSong = useQueueStore((state) => state.updateSong);
  const repeatMode = useQueueStore((state) => state.repeatMode);
  const shuffleEnabled = useQueueStore((state) => state.shuffleEnabled);
  const setRepeatMode = useQueueStore((state) => state.setRepeatMode);
  const toggleShuffle = useQueueStore((state) => state.toggleShuffle);

  const currentSong: Song | undefined = queue[current];
  const currentAlbum = currentSong && typeof currentSong.album === 'object' ? currentSong.album : null;
  const currentArtist = currentSong && typeof currentSong.artist === 'object' ? currentSong.artist : null;

  // Tokens are injected at playback time; the queue only stores raw URLs.
  // Deliberately not memoised: a refreshed JWT must produce a new src so the
  // playback effect retries the stream with fresh credentials.
  const src = withStreamAuth(currentSong?.url);

  const { eqGains, setEqGains } = useEqualizer({ audioRef, src });
  useScrobble({ audioRef, progressRef });
  useTrayUpdate({ currentSong, playing });

  const showError = useCallback((messageKey: string) => setSnackbar(messageKey), []);
  const translate = useCallback((key: string) => t(key), [t]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const selectTrack = useCallback((index: number) => {
    if (index === current) {
      restart();
      return;
    }
    setCurrent(index);
  }, [current, restart, setCurrent]);

  const goNext = useCallback(() => {
    if (current < queue.length - 1) selectTrack(current + 1);
    else if (repeatMode === RepeatMode.ALL && queue.length > 0) selectTrack(0);
  }, [current, queue.length, repeatMode, selectTrack]);

  const goPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > PREVIOUS_RESTART_THRESHOLD_SECONDS) {
      restart();
      return;
    }
    if (current > 0) selectTrack(current - 1);
    else if (repeatMode === RepeatMode.ALL && queue.length > 0) selectTrack(queue.length - 1);
  }, [current, queue.length, repeatMode, restart, selectTrack]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => setPlaying(true)).catch((error) => {
        debugError('Player', 'Play promise rejected:', error);
        setPlaying(false);
        setSnackbar(t('player.playbackFailed'));
      });
    } else {
      setPlaying(true);
    }
  }, [playing, t]);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const limit = duration || audio.duration || 0;
    audio.currentTime = Math.max(0, Math.min(limit, seconds));
    setProgress(audio.currentTime);
  }, [duration]);

  const seekBy = useCallback((offsetSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime + offsetSeconds);
  }, [seekTo]);

  const { handlePlaybackError, handlePlaybackSuccess } = usePlaybackErrorRecovery(
    audioRef,
    currentSong,
    current,
    queue.length,
    repeatMode === RepeatMode.ALL,
    goNext,
    () => selectTrack(0),
    setPlaying,
    { onError: showError, translate },
  );

  usePlaybackBridge({
    audioRef,
    onTogglePlay: togglePlay,
    onNext: goNext,
    onPrevious: goPrevious,
    onStop: stopPlayback,
    onSeekTo: seekTo,
    onSeekBy: seekBy,
  });

  useMediaSession({
    audioRef,
    playing,
    duration,
    progress,
    currentSong,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onNext: goNext,
    onPrev: goPrevious,
    onStop: () => setPlaying(false),
    onSeek: (time: number) => setProgress(time),
  });

  /**
   * The single playback path: whenever the resolved stream URL changes, start
   * it. There is no imperative `play()` elsewhere (except explicit
   * play/restart controls), so state changes have exactly one cause.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    setProgress(0);
    setDuration(0);
    progressRef.current = 0;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      setPlaying(true);
    }
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('meloamp-player-state', { detail: { playing, current } }));
  }, [playing, current]);

  useEffect(() => {
    setFavorite(currentSong?.userStarred ?? false);
    const rawRating = currentSong?.userRating;
    setRating(typeof rawRating === 'number' && rawRating > 0 ? Math.min(5, Math.max(0, rawRating)) : 0);
  }, [currentSong]);

  // Keep MPRIS (Linux) informed about the current track and playback status.
  useEffect(() => {
    if (!window.meloampAPI || !currentSong) return;
    window.meloampAPI.sendPlaybackInfo({
      trackId: currentSong.id?.toString() || undefined,
      length: duration,
      artUrl: currentSong.artwork || currentSong.imageUrl || '',
      title: currentSong.title || '',
      album: typeof currentSong.album === 'object' ? currentSong.album.name || '' : '',
      artist: currentSong.artist || '',
      status: playing ? 'Playing' : (duration > 0 ? 'Paused' : 'Stopped'),
      position: audioRef.current?.currentTime || 0,
    });
  }, [currentSong, duration, playing]);

  useEffect(() => {
    if (!window.meloampAPI || !playing) return;
    const interval = setInterval(() => {
      if (audioRef.current && window.meloampAPI) {
        window.meloampAPI.sendPosition(audioRef.current.currentTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [playing]);

  // Global custom events (keyboard shortcuts, command palette).
  useEffect(() => {
    const onToggle = () => togglePlay();
    const onNext = () => goNext();
    const onPrev = () => goPrevious();
    window.addEventListener('meloamp-toggle-play', onToggle);
    window.addEventListener('meloamp-next-track', onNext);
    window.addEventListener('meloamp-prev-track', onPrev);
    return () => {
      window.removeEventListener('meloamp-toggle-play', onToggle);
      window.removeEventListener('meloamp-next-track', onNext);
      window.removeEventListener('meloamp-prev-track', onPrev);
    };
  }, [togglePlay, goNext, goPrevious]);

  const cycleRepeatMode = () => {
    const modes = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];
    const index = modes.indexOf(repeatMode);
    setRepeatMode(modes[(index + 1) % modes.length]);
  };

  const repeatIcon = repeatMode === RepeatMode.ONE ? <RepeatOne /> : <Repeat />;
  const repeatTitle = repeatMode === RepeatMode.ALL
    ? t('player.repeatAll')
    : repeatMode === RepeatMode.ONE
      ? t('player.repeatOne')
      : t('player.repeatOff');

  const handleEqOpen = (event: React.MouseEvent<HTMLElement>) => setEqAnchor(event.currentTarget);
  const handleEqClose = () => setEqAnchor(null);
  const handleEqChange = (index: number, value: number) => {
    setEqGains((gains) => gains.map((gain, i) => (i === index ? value : gain)));
  };

  const handleToggleFavorite = async () => {
    if (!currentSong) return;
    setFavoriteLoading(true);
    const songId = currentSong.id;
    const nextFavorite = !favorite;
    try {
      await api.post(`/songs/starred/${songId}/${nextFavorite}`);
      setFavorite(nextFavorite);
      updateSong(current, { userStarred: nextFavorite });
      setSnackbar(nextFavorite ? t('player.addedToFavorites') : t('player.removedFromFavorites'));
    } catch (error) {
      debugError('Player', 'Failed to update favorite:', error);
      setSnackbar(t('player.failedToUpdateFavorite'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSetRating = async (newRating: number | null) => {
    if (!currentSong) return;
    const value = newRating === null ? 0 : newRating;
    setRatingLoading(true);
    try {
      await api.post(`/songs/setrating/${currentSong.id}/${value}`);
      setRating(value);
      updateSong(current, { userRating: value });
      setSnackbar(value === 0 ? t('player.ratingRemoved') : t('player.ratingSaved'));
    } catch (error) {
      debugError('Player', 'Failed to update rating:', error);
      setSnackbar(t('player.failedToUpdateRating'));
    } finally {
      setRatingLoading(false);
    }
  };

  const repeatButton = (
    <Tooltip title={repeatTitle}>
      <IconButton
        onClick={cycleRepeatMode}
        color={repeatMode !== RepeatMode.OFF ? 'primary' : 'default'}
        aria-label={repeatTitle}
      >
        {repeatIcon}
      </IconButton>
    </Tooltip>
  );

  const shuffleButton = (
    <Tooltip title={shuffleEnabled ? t('player.shuffleOn') : t('player.shuffleOff')}>
      <IconButton
        onClick={toggleShuffle}
        color={shuffleEnabled ? 'primary' : 'default'}
        aria-label={shuffleEnabled ? t('player.shuffleOn') : t('player.shuffleOff')}
      >
        <Shuffle />
      </IconButton>
    </Tooltip>
  );

  const volumeSlider = (
    <Box sx={{ width: 120, mx: 2, display: 'flex', alignItems: 'center' }}>
      <Typography variant="caption" sx={{ mr: 1 }}>{t('player.vol')}</Typography>
      <Slider
        value={volume * 100}
        min={0}
        max={100}
        step={1}
        aria-label={t('player.vol')}
        onChange={(_, value) => {
          const nextVolume = (value as number) / 100;
          setVolume(nextVolume);
          if (audioRef.current && nextVolume > 0) audioRef.current.muted = false;
        }}
        sx={{ flex: 1 }}
      />
    </Box>
  );

  const progressSlider = (sx: object) => (
    <Slider
      value={progress}
      min={0}
      max={duration || 0}
      aria-label={t('player.progress', 'Playback position')}
      onChange={(_, value) => {
        if (audioRef.current) audioRef.current.currentTime = Number(value);
        setProgress(Number(value));
      }}
      sx={sx}
    />
  );

  const favoriteButton = (
    <IconButton
      onClick={handleToggleFavorite}
      disabled={favoriteLoading}
      aria-label={favorite ? t('player.removeFavorite', 'Remove from favorites') : t('player.addFavorite', 'Add to favorites')}
    >
      {favoriteLoading ? <CircularProgress size={24} /> : favorite ? <Favorite color="primary" /> : <FavoriteBorder />}
    </IconButton>
  );

  const eqButton = (
    <IconButton onClick={handleEqOpen} aria-label={t('player.equalizer')}>
      <Equalizer />
    </IconButton>
  );

  return (
    <>
      <Dialog
        fullScreen
        open={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        aria-labelledby="player-fullscreen-title"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between', minHeight: 64 }}>
            <IconButton onClick={() => setIsFullScreen(false)} aria-label={t('common.close', 'Close')}>
              <FullscreenExit />
            </IconButton>
            <Box sx={{ width: 48 }} />
          </Box>
          <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', justifyContent: 'center', gap: 4, p: { xs: 1, md: 4 }, height: '80vh', minHeight: 0 }}>
            {(currentSong?.album?.imageUrl || currentSong?.imageUrl) && (
              <Box
                component="img"
                src={currentSong?.album?.imageUrl || currentSong?.imageUrl}
                alt=""
                sx={{ width: { xs: '60vw', md: '70vh' }, height: { xs: '60vw', md: '70vh' }, maxHeight: '70vh', borderRadius: 4, objectFit: 'cover', boxShadow: 6, alignSelf: 'center' }}
              />
            )}
            <Box sx={{ flex: 2, maxWidth: { xs: '100vw', md: '1200px', lg: '1400px' }, width: { xs: '100%', md: '80vw', lg: '70vw' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignSelf: 'center', alignItems: 'center', px: { xs: 2, md: 6 }, py: { xs: 2, md: 4 }, minHeight: 0 }}>
              <Typography
                id="player-fullscreen-title"
                variant="h2"
                sx={{ fontWeight: 700, fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' }, textAlign: 'center', mb: 2, lineHeight: 1.1, wordBreak: 'break-word', maxWidth: { xs: '98vw', md: '90vw', lg: '70vw' }, whiteSpace: 'normal', overflowWrap: 'break-word' }}
              >
                {currentSong?.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', mb: 2, minHeight: 60 }}>
                {currentAlbum && (
                  <ButtonBase
                    onClick={() => navigate(`/albums/${currentAlbum.id}`)}
                    aria-label={t('albumCard.viewAlbum', 'View album')}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderRadius: 2, boxShadow: 2, px: 2, py: 1, minWidth: 0, maxWidth: 260, height: 60, '&:hover': { boxShadow: 6 } }}
                  >
                    {currentAlbum.imageUrl && (
                      <Box component="img" src={currentAlbum.imageUrl} alt="" sx={{ width: 40, height: 40, borderRadius: 1, mr: 1, objectFit: 'cover', boxShadow: 1 }} />
                    )}
                    <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                      <Typography variant="subtitle1" noWrap sx={{ maxWidth: 180, fontWeight: 600 }}>{currentAlbum.name}</Typography>
                      {currentAlbum.releaseYear ? (
                        <Typography variant="caption" color="text.secondary">{currentAlbum.releaseYear}</Typography>
                      ) : null}
                    </Box>
                  </ButtonBase>
                )}
                {currentArtist && (
                  <ButtonBase
                    onClick={() => navigate(`/artists/${currentArtist.id}`)}
                    aria-label={t('artistCard.viewArtist', 'View artist')}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderRadius: 2, boxShadow: 2, px: 2, py: 1, minWidth: 0, maxWidth: 220, height: 60, '&:hover': { boxShadow: 6 } }}
                  >
                    {currentArtist.imageUrl && (
                      <Box component="img" src={currentArtist.imageUrl} alt="" sx={{ width: 36, height: 40, borderRadius: '50%', mr: 1, objectFit: 'cover', boxShadow: 1 }} />
                    )}
                    <Typography variant="subtitle1" noWrap sx={{ maxWidth: 140, fontWeight: 600 }}>{currentArtist.name}</Typography>
                  </ButtonBase>
                )}
              </Box>
              <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>{formatTime(progress)}</Typography>
                {progressSlider({ flex: 1, mx: 2 })}
                <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'left' }}>{formatTime(duration)}</Typography>
              </Box>
              <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {shuffleButton}
                  <IconButton onClick={goPrevious} sx={{ mx: 1 }} aria-label={t('player.previous', 'Previous track')}>
                    <SkipPrevious fontSize="large" />
                  </IconButton>
                  <IconButton onClick={togglePlay} sx={{ mx: 2 }} aria-label={playing ? t('player.pause', 'Pause') : t('player.play', 'Play')}>
                    {playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                  </IconButton>
                  <IconButton onClick={goNext} sx={{ mx: 1 }} aria-label={t('player.next', 'Next track')}>
                    <SkipNext fontSize="large" />
                  </IconButton>
                  {repeatButton}
                  {volumeSlider}
                  {eqButton}
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    {ratingLoading ? (
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                    ) : (
                      <Rating
                        name="song-rating-fullscreen"
                        value={rating}
                        max={5}
                        onChange={(_, value) => handleSetRating(value)}
                        size="large"
                        aria-label={t('common.rating', 'Rating')}
                      />
                    )}
                    {favoriteButton}
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200, maxWidth: 400, bgcolor: 'background.default', borderRadius: 2, p: 2, boxShadow: 1, height: { xs: '60vh', md: '70vh' }, maxHeight: { xs: '60vh', md: '70vh' }, alignSelf: 'center', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('player.queue')}</Typography>
              <Box component="ul" sx={{ flex: 1, overflow: 'auto', listStyle: 'none', m: 0, p: 0 }}>
                {queue.map((song: Song, index: number) => (
                  <Box component="li" key={`${song.id}-${index}`}>
                    <ButtonBase
                      onClick={() => selectTrack(index)}
                      aria-current={index === current ? 'true' : undefined}
                      sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1, bgcolor: index === current ? 'primary.light' : 'transparent', borderRadius: 1, p: 1, textAlign: 'left' }}
                    >
                      {song.imageUrl && (
                        <Box component="img" src={song.imageUrl} alt="" sx={{ width: 32, height: 32, borderRadius: 1, mr: 1, objectFit: 'cover' }} />
                      )}
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>{song.title}</Typography>
                      {index === current && <Typography variant="caption" color="primary">{t('player.now')}</Typography>}
                    </ButtonBase>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>

      <Box
        sx={{
          position: 'fixed',
          left: sidebarOpen ? DRAWER_WIDTH : 0,
          right: 0,
          bottom: 0,
          bgcolor: 'background.paper',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          zIndex: 1201,
          transition: 'left 0.2s',
        }}
      >
        {currentSong && (
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mr: 2, width: '20vw', maxWidth: '20vw', flexShrink: 0 }}>
            {currentSong.imageUrl && (
              <Box component="img" src={currentSong.imageUrl} alt="" sx={{ width: 70, height: 70, borderRadius: 1, mr: 2, objectFit: 'cover', boxShadow: 1 }} />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {currentSong.title}
              </Typography>
              {currentAlbum && (
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }} onClick={() => navigate(`/albums/${currentAlbum.id}`)}>
                    {currentAlbum.releaseYear ? `${currentAlbum.releaseYear} • ` : ''}{currentAlbum.name}
                  </Box>
                </Typography>
              )}
              {currentArtist && (
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }} onClick={() => navigate(`/artists/${currentArtist.id}`)}>
                    {currentArtist.name}
                  </Box>
                </Typography>
              )}
            </Box>
          </Box>
        )}
        {shuffleButton}
        <IconButton onClick={goPrevious} aria-label={t('player.previous', 'Previous track')}>
          <SkipPrevious />
        </IconButton>
        <IconButton onClick={togglePlay} aria-label={playing ? t('player.pause', 'Pause') : t('player.play', 'Play')}>
          {playing ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton onClick={goNext} aria-label={t('player.next', 'Next track')}>
          <SkipNext />
        </IconButton>
        {repeatButton}
        {progressSlider({ mx: 2, flex: 1 })}
        {volumeSlider}
        {eqButton}
        {favoriteButton}
        <IconButton onClick={() => setIsFullScreen(true)} sx={{ ml: 1 }} aria-label={t('player.fullscreen', 'Fullscreen player')}>
          <Fullscreen />
        </IconButton>
        <audio
          ref={audioRef}
          src={src}
          crossOrigin="anonymous"
          onTimeUpdate={(event) => {
            const currentTime = (event.target as HTMLAudioElement).currentTime;
            progressRef.current = currentTime;
            const now = Date.now();
            if (now - lastProgressUpdateRef.current >= PROGRESS_UPDATE_INTERVAL_MS) {
              lastProgressUpdateRef.current = now;
              setProgress(currentTime);
            }
          }}
          onLoadedMetadata={(event) => setDuration((event.target as HTMLAudioElement).duration)}
          onPlaying={() => handlePlaybackSuccess()}
          onError={() => handlePlaybackError()}
          onEnded={() => {
            if (repeatMode === RepeatMode.ONE) {
              restart();
            } else if (current < queue.length - 1 || (repeatMode === RepeatMode.ALL && queue.length > 0)) {
              goNext();
            } else {
              setPlaying(false);
            }
          }}
        />
        <Popover
          open={Boolean(eqAnchor)}
          anchorEl={eqAnchor}
          onClose={handleEqClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Box sx={{ p: 2, minWidth: 320 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('player.equalizer')}</Typography>
            {EQ_BANDS.map((frequency, index) => (
              <Box key={frequency} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ width: 40 }}>{frequency}Hz</Typography>
                <Slider
                  size="small"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={eqGains[index]}
                  onChange={(_, value) => handleEqChange(index, value as number)}
                  aria-label={`${frequency}Hz`}
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption" sx={{ width: 36, textAlign: 'right' }}>{eqGains[index].toFixed(1)}dB</Typography>
              </Box>
            ))}
          </Box>
        </Popover>
        <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
      </Box>
    </>
  );
}
