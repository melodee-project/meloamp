import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Slider, Typography, Popover, Snackbar, CircularProgress, Dialog, Rating, Tooltip } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, Equalizer, Favorite, FavoriteBorder, Fullscreen, FullscreenExit, Repeat, RepeatOne, Shuffle } from '@mui/icons-material';
import { useQueueStore, RepeatMode, Song } from '../queueStore';
import api from '../api';
import { useTranslation } from 'react-i18next';
import { debugLog, debugError } from '../debug';
import { useScrobble } from '../hooks/useScrobble';
import { useMediaSession } from '../hooks/useMediaSession';
import { useEqualizer, EQ_BANDS } from '../hooks/useEqualizer';
import { usePlaybackBridge } from '../hooks/usePlaybackBridge';
import { useNextTrackPreload } from '../hooks/useNextTrackPreload';
import { usePlaybackErrorRecovery } from '../hooks/usePlaybackErrorRecovery';
import { useTrayUpdate } from '../hooks/useTrayUpdate';

const PROGRESS_UPDATE_INTERVAL_MS = 250;

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function Player({ src }: { src: string }) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const nextAudioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [eqAnchor, setEqAnchor] = useState<null | HTMLElement>(null);
  const [volume, setVolume] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [shouldAutoPlayFirst, setShouldAutoPlayFirst] = useState(false);

  const lastProgressUpdateRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const prevQueueLength = useRef<number>(0);

  const queue = useQueueStore((state) => state.queue);
  const current = useQueueStore((state) => state.current);
  const setCurrent = useQueueStore((state) => state.setCurrent);
  const updateSong = useQueueStore((state) => state.updateSong);
  const repeatMode = useQueueStore((state) => state.repeatMode);
  const shuffleEnabled = useQueueStore((state) => state.shuffleEnabled);
  const setRepeatMode = useQueueStore((state) => state.setRepeatMode);
  const toggleShuffle = useQueueStore((state) => state.toggleShuffle);
  const { t } = useTranslation();
  const currentSong = queue[current];
  const currentAlbum = currentSong && typeof currentSong.album === 'object' ? currentSong.album : null;
  const currentArtist = currentSong && typeof currentSong.artist === 'object' ? currentSong.artist : null;

  const { eqGains, setEqGains } = useEqualizer({ audioRef, src });
  useScrobble({ audioRef, progressRef });
  useNextTrackPreload({ audioRef, nextAudioRef, currentSong, current, queue });
  useTrayUpdate({ currentSong, playing });

  const showError = useCallback((messageKey: string) => setSnackbar(messageKey), []);

  const { handlePlaybackError, handlePlaybackSuccess } = usePlaybackErrorRecovery(
    audioRef,
    currentSong,
    current,
    queue.length,
    repeatMode === RepeatMode.ALL,
    () => setCurrent(current + 1),
    () => setCurrent(0),
    setPlaying,
    { onError: showError, translate: t },
  );

  usePlaybackBridge({ audioRef, playing, duration, setPlaying });

  useMediaSession({
    audioRef,
    playing,
    duration,
    progress,
    currentSong,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onNext: () => {
      if (current < queue.length - 1) setCurrent(current + 1);
      else if (repeatMode === RepeatMode.ALL && queue.length > 0) setCurrent(0);
    },
    onPrev: () => {
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
      } else if (current > 0) {
        setCurrent(current - 1);
      } else if (repeatMode === RepeatMode.ALL && queue.length > 0) {
        setCurrent(queue.length - 1);
      }
    },
    onStop: () => setPlaying(false),
    onSeek: (time: number) => setProgress(time),
  });

  const cycleRepeatMode = () => {
    const modes = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  const getRepeatIcon = () => (repeatMode === RepeatMode.ONE ? <RepeatOne /> : <Repeat />);
  const getRepeatTooltip = () => {
    if (repeatMode === RepeatMode.ALL) return t('player.repeatAll');
    if (repeatMode === RepeatMode.ONE) return t('player.repeatOne');
    return t('player.repeatOff');
  };

  useEffect(() => {
    if (prevQueueLength.current === 0 && queue.length > 0) {
      debugLog('Player', 'Queue changed from empty to non-empty, triggering auto-play');
      setCurrent(0);
      setShouldAutoPlayFirst(true);
    }
    prevQueueLength.current = queue.length;
  }, [queue.length, setCurrent]);

  useEffect(() => {
    if (!audioRef.current) return;
    debugLog('Player', 'Auto-play effect triggered, src changed to:', src);
    if (src && src.startsWith('http')) {
      fetch(src, { method: 'HEAD' })
        .then((response) => {
          debugLog('Player', 'Stream URL HEAD response:', {
            status: response.status,
            contentType: response.headers.get('content-type'),
          });
          if (!response.ok) {
            return fetch(src, { headers: { Range: 'bytes=0-1023' } });
          }
          return undefined;
        })
        .catch((error) => debugError('Player', 'Failed to inspect stream URL:', error));
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [src]);

  useEffect(() => {
    if (
      shouldAutoPlayFirst &&
      audioRef.current &&
      queue.length > 0 &&
      typeof current === 'number' &&
      queue[current]?.url
    ) {
      audioRef.current.src = queue[current].url || '';
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      setShouldAutoPlayFirst(false);
    }
  }, [current, shouldAutoPlayFirst, queue, currentSong]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    window.dispatchEvent(new CustomEvent('meloamp-player-state', { detail: { playing, current } }));
  }, [volume, playing, current]);

  useEffect(() => {
    setFavorite(currentSong?.userStarred ?? false);
    const rawRating = currentSong?.userRating;
    const normalized = typeof rawRating === 'number' && rawRating > 0 ? Math.min(5, Math.max(0, rawRating)) : 0;
    setRating(normalized);
  }, [currentSong, current, queue]);

  useEffect(() => {
    if (!window.meloampAPI || !currentSong) return;
    window.meloampAPI.sendPlaybackInfo({
      trackId: currentSong?.id?.toString() || undefined,
      length: duration,
      artUrl: currentSong?.artwork || currentSong?.imageUrl || '',
      title: currentSong?.title || '',
      album: typeof currentSong?.album === 'object' ? currentSong.album.name || '' : (currentSong?.album || ''),
      artist: currentSong?.artist || '',
      status: playing ? 'Playing' : (duration > 0 ? 'Paused' : 'Stopped'),
      position: audioRef.current?.currentTime || 0,
    });
  }, [currentSong, current, duration, playing, queue]);

  useEffect(() => {
    if (!window.meloampAPI || !playing || !audioRef.current) return;
    const interval = setInterval(() => {
      if (audioRef.current && window.meloampAPI) {
        window.meloampAPI.sendPosition(audioRef.current.currentTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [playing]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current.src && src) audioRef.current.src = src;
      const playPromise = audioRef.current.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => setPlaying(true)).catch((error) => {
          debugError('Player', 'Play promise rejected:', error);
          setPlaying(false);
          setSnackbar(t('player.playbackFailed'));
        });
      } else {
        setPlaying(true);
      }
    }
  };

  const playSongAtIndex = (idx: number) => {
    setCurrent(idx);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setPlaying(true)).catch((error) => {
          debugError('Player', 'Play failed in playSongAtIndex:', error);
          setPlaying(false);
        });
      }
    }, 0);
  };

  const handleEqOpen = (e: React.MouseEvent<HTMLElement>) => setEqAnchor(e.currentTarget);
  const handleEqClose = () => setEqAnchor(null);
  const handleEqChange = (i: number, value: number) => {
    setEqGains((gains) => gains.map((g, idx) => (idx === i ? value : g)));
  };

  const handleToggleFavorite = async () => {
    if (!currentSong) return;
    setFavLoading(true);
    const songId = currentSong.id;
    try {
      if (!favorite) {
        await api.post(`/songs/starred/${songId}/true`);
        setFavorite(true);
        setSnackbar(t('player.addedToFavorites'));
      } else {
        await api.post(`/songs/starred/${songId}/false`);
        setFavorite(false);
        setSnackbar(t('player.removedFromFavorites'));
      }
    } catch {
      setSnackbar(t('player.failedToUpdateFavorite'));
    } finally {
      setFavLoading(false);
    }
  };

  const handleSetRating = async (newRating: number | null) => {
    if (!currentSong) return;
    const r = newRating === null ? 0 : newRating;
    setRatingLoading(true);
    try {
      await api.post(`/songs/setrating/${currentSong.id}/${r}`);
      setRating(r);
      try { updateSong(current, { userRating: r }); } catch { /* noop */ }
      setSnackbar(r === 0 ? t('player.ratingRemoved') : t('player.ratingSaved'));
    } catch {
      setSnackbar(t('player.failedToUpdateRating'));
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <>
      <Dialog fullScreen open={isFullScreen} onClose={() => setIsFullScreen(false)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between', minHeight: 64 }}>
            <IconButton onClick={() => setIsFullScreen(false)}><FullscreenExit /></IconButton>
            <Box sx={{ width: 48 }} />
          </Box>
          <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', justifyContent: 'center', gap: 4, p: { xs: 1, md: 4 }, height: '80vh', minHeight: 0 }}>
            {(currentSong?.album?.imageUrl || currentSong?.imageUrl) && (
              <Box component="img" src={currentSong?.album?.imageUrl || currentSong?.imageUrl} alt={currentSong?.title || ''} sx={{ width: { xs: '60vw', md: '70vh' }, height: { xs: '60vw', md: '70vh' }, maxHeight: '70vh', borderRadius: 4, objectFit: 'cover', boxShadow: 6, alignSelf: 'center' }} />
            )}
            <Box sx={{ flex: 2, maxWidth: { xs: '100vw', md: '1200px', lg: '1400px' }, width: { xs: '100%', md: '80vw', lg: '70vw' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignSelf: 'center', alignItems: 'center', px: { xs: 2, md: 6 }, py: { xs: 2, md: 4 }, minHeight: 0 }}>
              <Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' }, textAlign: 'center', mb: 2, lineHeight: 1.1, wordBreak: 'break-word', maxWidth: { xs: '98vw', md: '90vw', lg: '70vw' }, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                {currentSong?.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', mb: 2, minHeight: 60 }}>
                {currentAlbum && (
                  <Box onClick={() => navigate(`/albums/${currentAlbum.id}`)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderRadius: 2, boxShadow: 2, px: 2, py: 1, cursor: 'pointer', minWidth: 0, maxWidth: 260, height: 60, '&:hover': { boxShadow: 6 } }}>
                    {currentAlbum.imageUrl && (
                      <Box component="img" src={currentAlbum.imageUrl} alt={currentAlbum.name} sx={{ width: 40, height: 40, borderRadius: 1, mr: 1, objectFit: 'cover', boxShadow: 1 }} />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>{currentAlbum.name}</Typography>
                      {currentAlbum.releaseYear && (
                        <Typography variant="caption" color="text.secondary">{currentAlbum.releaseYear}</Typography>
                      )}
                    </Box>
                  </Box>
                )}
                {currentArtist && (
                  <Box onClick={() => navigate(`/artists/${currentArtist.id}`)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderRadius: 2, boxShadow: 2, px: 2, py: 1, cursor: 'pointer', minWidth: 0, maxWidth: 220, height: 60, '&:hover': { boxShadow: 6 } }}>
                    {currentArtist.imageUrl && (
                      <Box component="img" src={currentArtist.imageUrl} alt={currentArtist.name} sx={{ width: 36, height: 40, borderRadius: '50%', mr: 1, objectFit: 'cover', boxShadow: 1 }} />
                    )}
                    <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>{currentArtist.name}</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>{formatTime(progress)}</Typography>
                <Slider value={progress} min={0} max={duration} onChange={(_, v) => { if (audioRef.current) audioRef.current.currentTime = Number(v); setProgress(Number(v)); }} sx={{ flex: 1, mx: 2 }} />
                <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'left' }}>{formatTime(duration)}</Typography>
              </Box>
              <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Tooltip title={shuffleEnabled ? t('player.shuffleOn') : t('player.shuffleOff')}>
                    <IconButton onClick={toggleShuffle} color={shuffleEnabled ? 'primary' : 'default'} sx={{ mx: 1 }}><Shuffle fontSize="large" /></IconButton>
                  </Tooltip>
                  <IconButton onClick={() => playSongAtIndex(Math.max(current - 1, 0))} sx={{ mx: 1, fontSize: 32 }}><SkipPrevious fontSize="large" /></IconButton>
                  <IconButton onClick={togglePlay} sx={{ mx: 2, fontSize: 40 }}>{playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}</IconButton>
                  <IconButton onClick={() => playSongAtIndex(Math.min(current + 1, queue.length - 1))} sx={{ mx: 1, fontSize: 32 }}><SkipNext fontSize="large" /></IconButton>
                  <Tooltip title={getRepeatTooltip()}>
                    <IconButton onClick={cycleRepeatMode} color={repeatMode !== RepeatMode.OFF ? 'primary' : 'default'} sx={{ mx: 1 }}>{getRepeatIcon()}</IconButton>
                  </Tooltip>
                  <Box sx={{ width: 120, mx: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>{t('player.vol')}</Typography>
                    <Slider value={volume * 100} min={0} max={100} step={1} onChange={(_, v) => { const nv = (v as number) / 100; setVolume(nv); if (audioRef.current && nv > 0) audioRef.current.muted = false; }} sx={{ flex: 1 }} />
                  </Box>
                  <IconButton onClick={handleEqOpen}><Equalizer /></IconButton>
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    {ratingLoading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : (
                      <Rating name="song-rating-fullscreen" value={rating} max={5} onChange={(_, v) => handleSetRating(v)} size="large" />
                    )}
                    <IconButton onClick={handleToggleFavorite} disabled={favLoading} sx={{ ml: 1 }}>
                      {favLoading ? <CircularProgress size={24} /> : favorite ? <Favorite color="primary" /> : <FavoriteBorder />}
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200, maxWidth: 400, bgcolor: 'background.default', borderRadius: 2, p: 2, boxShadow: 1, height: { xs: '60vh', md: '70vh' }, maxHeight: { xs: '60vh', md: '70vh' }, alignSelf: 'center', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('player.queue')}</Typography>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {queue.map((song: Song, idx: number) => (
                  <Box key={song.id} sx={{ display: 'flex', alignItems: 'center', mb: 1, bgcolor: idx === current ? 'primary.light' : 'transparent', borderRadius: 1, p: 1, cursor: 'pointer' }} onClick={() => setCurrent(idx)}>
                    {song.imageUrl && <Box component="img" src={song.imageUrl} alt={song.title} sx={{ width: 32, height: 32, borderRadius: 1, mr: 1, objectFit: 'cover' }} />}
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>{song.title}</Typography>
                    {idx === current && <Typography variant="caption" color="primary">{t('player.now')}</Typography>}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>
      <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, bgcolor: 'background.paper', p: 2, display: 'flex', alignItems: 'center', zIndex: 1201 }}>
        {currentSong && (
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mr: 2, width: '20vw', maxWidth: '20vw', flexShrink: 0 }}>
            {currentSong.imageUrl && (
              <Box component="img" src={currentSong.imageUrl} alt={currentSong.title} sx={{ width: 70, height: 70, borderRadius: 1, mr: 2, objectFit: 'cover', boxShadow: 1 }} />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1" noWrap fontWeight={600} sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>{currentSong.title}</Typography>
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
        <Tooltip title={shuffleEnabled ? t('player.shuffleOn') : t('player.shuffleOff')}>
          <IconButton onClick={toggleShuffle} color={shuffleEnabled ? 'primary' : 'default'}><Shuffle /></IconButton>
        </Tooltip>
        <IconButton onClick={() => playSongAtIndex(Math.max(current - 1, 0))}><SkipPrevious /></IconButton>
        <IconButton onClick={togglePlay}>{playing ? <Pause /> : <PlayArrow />}</IconButton>
        <IconButton onClick={() => playSongAtIndex(Math.min(current + 1, queue.length - 1))}><SkipNext /></IconButton>
        <Tooltip title={getRepeatTooltip()}>
          <IconButton onClick={cycleRepeatMode} color={repeatMode !== RepeatMode.OFF ? 'primary' : 'default'}>{getRepeatIcon()}</IconButton>
        </Tooltip>
        <Slider value={progress} min={0} max={duration} onChange={(_, v) => { if (audioRef.current) audioRef.current.currentTime = Number(v); setProgress(Number(v)); }} sx={{ mx: 2, flex: 1 }} />
        <Box sx={{ width: 120, mx: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ mr: 1 }}>{t('player.vol')}</Typography>
          <Slider value={volume * 100} min={0} max={100} step={1} onChange={(_, v) => { const nv = (v as number) / 100; setVolume(nv); if (audioRef.current && nv > 0) audioRef.current.muted = false; }} sx={{ flex: 1 }} />
        </Box>
        <IconButton onClick={handleEqOpen}><Equalizer /></IconButton>
        <IconButton onClick={handleToggleFavorite} disabled={favLoading} sx={{ ml: 1 }}>
          {favLoading ? <CircularProgress size={24} /> : favorite ? <Favorite color="primary" /> : <FavoriteBorder />}
        </IconButton>
        <IconButton onClick={() => setIsFullScreen(true)} sx={{ ml: 1 }}><Fullscreen /></IconButton>
        <audio ref={nextAudioRef} preload="auto" style={{ display: 'none' }} />
        <audio
          ref={audioRef}
          src={queue[current]?.url || ''}
          crossOrigin="anonymous"
          onTimeUpdate={(e) => {
            const currentTime = (e.target as HTMLAudioElement).currentTime;
            progressRef.current = currentTime;
            const now = Date.now();
            if (now - lastProgressUpdateRef.current >= PROGRESS_UPDATE_INTERVAL_MS) {
              lastProgressUpdateRef.current = now;
              setProgress(currentTime);
            }
          }}
          onLoadedMetadata={(e) => { setDuration((e.target as HTMLAudioElement).duration); }}
          onPlaying={() => handlePlaybackSuccess()}
          onError={() => handlePlaybackError()}
        />
        <Popover open={Boolean(eqAnchor)} anchorEl={eqAnchor} onClose={handleEqClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Box sx={{ p: 2, minWidth: 320 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('player.equalizer')}</Typography>
            {EQ_BANDS.map((freq, i) => (
              <Box key={freq} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ width: 40 }}>{freq}Hz</Typography>
                <Slider size="small" min={-12} max={12} step={0.5} value={eqGains[i]} onChange={(_, v) => handleEqChange(i, v as number)} sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ width: 36, textAlign: 'right' }}>{eqGains[i].toFixed(1)}dB</Typography>
              </Box>
            ))}
          </Box>
        </Popover>
        <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
      </Box>
    </>
  );
}
