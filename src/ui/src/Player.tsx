import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Slider, Typography, Popover, Snackbar, CircularProgress, Dialog } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, Equalizer, Favorite, FavoriteBorder, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { useQueueStore } from './queueStore';
import api from './api';
import { ScrobbleRequest, ScrobbleType } from './apiModels';
import { useTranslation } from 'react-i18next';

// Simple equalizer bands
const EQ_BANDS = [60, 170, 350, 1000, 3500, 10000];

export default function Player({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [crossfadeActive, setCrossfadeActive] = useState(false);
  const [eqAnchor, setEqAnchor] = useState<null | HTMLElement>(null);
  const [eqGains, setEqGains] = useState<number[]>(Array(EQ_BANDS.length).fill(0));
  const [scrobbled, setScrobbled] = useState(false);
  const [scrobbledPlayed, setScrobbledPlayed] = useState(false); // Track if PLAYED scrobble sent
  const [volume, setVolume] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const queue = useQueueStore((state: any) => state.queue);
  const current = useQueueStore((state: any) => state.current);
  const setCurrent = useQueueStore((state: any) => state.setCurrent);
  const { t } = useTranslation();

  // Equalizer setup
  const eqNodes = useRef<any[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);
  const sourceNode = useRef<MediaElementAudioSourceNode | null>(null);

  // Create audio context and source node only once
  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioCtx.current) audioCtx.current = new window.AudioContext();
    if (!sourceNode.current) {
      try {
        sourceNode.current = audioCtx.current.createMediaElementSource(audioRef.current);
      } catch (e) {
        // Already connected, do nothing
      }
    }
    // Clean up on unmount: only disconnect EQ nodes
    return () => {
      eqNodes.current.forEach(node => node.disconnect());
      // Do NOT close or null audioCtx, and do NOT disconnect or null sourceNode
    };
  }, []);

  // Update EQ nodes and connect chain on src or eqGains change
  useEffect(() => {
    if (!audioRef.current || !audioCtx.current || !sourceNode.current) return;
    // Disconnect previous EQ nodes
    eqNodes.current.forEach(node => node.disconnect());
    // Create EQ nodes
    eqNodes.current = EQ_BANDS.map((freq, i) => {
      const filter = audioCtx.current!.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.gain.value = eqGains[i];
      filter.Q.value = 1;
      return filter;
    });
    // Connect chain: source -> eq1 -> eq2 ... -> destination
    let prev: AudioNode = sourceNode.current;
    eqNodes.current.forEach(node => {
      prev.connect(node);
      prev = node;
    });
    prev.connect(audioCtx.current.destination);
    // Update gains on change
    eqNodes.current.forEach((node, i) => {
      node.gain.value = eqGains[i];
    });
    // Clean up EQ nodes only (not source node)
    return () => {
      eqNodes.current.forEach(node => node.disconnect());
    };
    // eslint-disable-next-line
  }, [src, eqGains]);

  // Crossfade logic (simple fade out/in)
  useEffect(() => {
    if (!audioRef.current) return;
    if (!queue[current + 1]) return;
    if (duration - progress < 3 && !crossfadeActive && playing) {
      setCrossfadeActive(true);
      // Fade out current
      const fadeOut = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.05) {
          audioRef.current.volume -= 0.05;
        } else if (audioRef.current) {
          audioRef.current.volume = 0;
          clearInterval(fadeOut);
          setCurrent(current + 1);
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.volume = 1;
              audioRef.current.play();
            }
            setCrossfadeActive(false);
          }, 200);
        }
      }, 100);
      return () => clearInterval(fadeOut);
    }
  }, [progress, duration, current, queue, setCurrent, playing, crossfadeActive]);

  // Gapless playback: auto play next track
  useEffect(() => {
    if (!audioRef.current) return;
    if (progress >= duration - 0.1 && playing && queue[current + 1]) {
      setCurrent(current + 1);
      setTimeout(() => {
        if (audioRef.current) audioRef.current.play();
      }, 100);
    }
  }, [progress, duration, playing, queue, current, setCurrent]);

  // Scrobbling logic
  useEffect(() => {
    if (!audioRef.current) return;
    if (!queue[current]) return;
    const baseScrobble: Omit<ScrobbleRequest, 'scrobbleType'> = {
      songId: queue[current].id,
      playerName: 'MeloAmp',
      timestamp: Date.now(),
      playbackDuration: Math.floor(progress),
    };
    // Only scrobble NOW_PLAYING once
    if (!scrobbled && progress > 10) {
      api.post('/scrobble', {
        ...baseScrobble,
        scrobbleType: ScrobbleType.NOW_PLAYING,
      } as ScrobbleRequest);
      setScrobbled(true);
    }
    // Only scrobble PLAYED once
    if (!scrobbledPlayed && progress > duration * 0.7) {
      api.post('/scrobble', {
        ...baseScrobble,
        scrobbleType: ScrobbleType.PLAYED,
      } as ScrobbleRequest);
      setScrobbledPlayed(true);
    }
  }, [progress, duration, queue, current, scrobbled, scrobbledPlayed]);

  // Reset scrobble flags when song changes
  useEffect(() => {
    setScrobbled(false);
    setScrobbledPlayed(false);
  }, [current, src]);

  // Auto-play when src changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => {
      setPlaying(true);
    }).catch(() => {
      setPlaying(false);
    });
  }, [src]);

  // Always set the audio src from the current queue song
  useEffect(() => {
    if (audioRef.current && queue[current]?.url) {
      audioRef.current.src = queue[current].url;
    }
    // Reset playing state on queue/current change (e.g., after refresh)
    setPlaying(false);
  }, [queue, current]);

  // Keep audio element volume in sync with slider
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    // Dispatch custom event for playing state and current index
    window.dispatchEvent(new CustomEvent('meloamp-player-state', { detail: { playing, current } }));
  }, [volume, playing, current]);

  // Update favorite state when song changes
  useEffect(() => {
    setFavorite(queue[current]?.userStarred ?? false);
  }, [current, queue]);

  // Load initial EQ from userSettings if present
  useEffect(() => {
    try {
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      if (userSettings.equalizerGains && Array.isArray(userSettings.equalizerGains) && userSettings.equalizerGains.length === EQ_BANDS.length) {
        setEqGains(userSettings.equalizerGains);
      }
    } catch {}
    // eslint-disable-next-line
  }, []);

  // Persist EQ to userSettings on change
  useEffect(() => {
    try {
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      userSettings.equalizerGains = eqGains;
      localStorage.setItem('userSettings', JSON.stringify(userSettings));
      // If App's setSettings is available via window, update it
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('userSettingsChanged', { detail: userSettings }));
      }
    } catch {}
    // eslint-disable-next-line
  }, [eqGains]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // Always set src in case it was lost on refresh
      if (!audioRef.current.src && src) {
        audioRef.current.src = src;
      }
      const playPromise = audioRef.current.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          setPlaying(true);
        }).catch(() => {
          setPlaying(false);
          setSnackbar(t('player.playbackFailed'));
        });
      } else {
        setPlaying(true);
      }
    }
  };

  const handleEqOpen = (e: React.MouseEvent<HTMLElement>) => setEqAnchor(e.currentTarget);
  const handleEqClose = () => setEqAnchor(null);
  const handleEqChange = (i: number, value: number) => {
    setEqGains(gains => gains.map((g, idx) => (idx === i ? value : g)));
  };

  const handleToggleFavorite = async () => {
    if (!queue[current]) return;
    setFavLoading(true);
    const songId = queue[current].id;
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
    } catch (err) {
      setSnackbar(t('player.failedToUpdateFavorite'));
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <>
      {/* Full Screen Player Dialog */}
      <Dialog fullScreen open={isFullScreen} onClose={() => setIsFullScreen(false)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between', minHeight: 64 }}>
            <IconButton onClick={() => setIsFullScreen(false)}><FullscreenExit /></IconButton>
            <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>{t('player.nowPlaying')}</Typography>
            <Box sx={{ width: 48 }} /> {/* Spacer for symmetry */}
          </Box>
          <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', justifyContent: 'center', gap: 4, p: { xs: 1, md: 4 }, height: '80vh', minHeight: 0 }}>
            {/* Large Artwork */}
            {queue[current]?.imageUrl && (
              <Box component="img" src={queue[current].imageUrl} alt={queue[current].title} sx={{ width: { s: '50vw', md: '70vh' }, height: { xs: '50vw', md: '70vh' }, maxHeight: '70vh', borderRadius: 2, objectFit: 'cover', boxShadow: 3, alignSelf: 'center' }} />
            )}
            {/* Song Info and Controls */}
            <Box sx={{
              flex: 2,
              maxWidth: { xs: '100vw', md: '1200px', lg: '1400px' },
              width: { xs: '100%', md: '80vw', lg: '70vw' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignSelf: 'center',
              alignItems: 'center',
              px: { xs: 2, md: 6 },
              py: { xs: 2, md: 4 },
              minHeight: 0,
            }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  textAlign: 'center',
                  mb: 1.5,
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                  maxWidth: { xs: '98vw', md: '90vw', lg: '70vw' },
                  whiteSpace: 'normal',
                  overflowWrap: 'break-word',
                }}
              >
                {queue[current]?.title}
              </Typography>
              {queue[current].album && (
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{
                    mb: 0.5,
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      cursor: 'pointer',
                      color: 'primary.main',
                      textDecoration: 'underline',
                      fontWeight: 600,
                      fontSize: 'inherit',
                    }}
                    onClick={() => window.location.assign(`/albums/${queue[current].album.id}`)}
                  >
                    {queue[current].album.releaseYear ? `${queue[current].album.releaseYear} • ` : ''}{queue[current].album.name}
                  </Box>
                </Typography>
              )}
              {queue[current].artist && (
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      cursor: 'pointer',
                      color: 'primary.main',
                      textDecoration: 'underline',
                      fontWeight: 600,
                      fontSize: 'inherit',
                    }}
                    onClick={() => window.location.assign(`/artists/${queue[current].artist.id}`)}
                  >
                    {queue[current].artist.name}
                  </Box>
                </Typography>
              )}
              {/* Controls (reuse main controls) */}
              <Box sx={{ mt: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <IconButton onClick={() => setCurrent(Math.max(current - 1, 0))}><SkipPrevious /></IconButton>
                  <IconButton onClick={togglePlay}>{playing ? <Pause /> : <PlayArrow />}</IconButton>
                  <IconButton onClick={() => setCurrent(Math.min(current + 1, queue.length - 1))}><SkipNext /></IconButton>
                  <Slider
                    value={progress}
                    min={0}
                    max={duration}
                    onChange={(_, v) => {
                      if (audioRef.current) audioRef.current.currentTime = Number(v);
                      setProgress(Number(v));
                    }}
                    sx={{ mx: 2, flex: 1 }}
                  />
                  {/* Volume slider */}
                  <Box sx={{ width: 120, mx: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>{t('player.vol')}</Typography>
                    <Slider
                      value={volume * 100}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(_, v) => {
                        const newVolume = (v as number) / 100;
                        setVolume(newVolume);
                        if (audioRef.current && newVolume > 0) {
                          audioRef.current.muted = false;
                        }
                      }}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <IconButton onClick={handleEqOpen}><Equalizer /></IconButton>
                  <IconButton onClick={handleToggleFavorite} disabled={favLoading} sx={{ ml: 1 }}>
                    {favLoading ? <CircularProgress size={24} /> : favorite ? <Favorite color="primary" /> : <FavoriteBorder />}
                  </IconButton>
                </Box>
                <Popover open={!!eqAnchor} anchorEl={eqAnchor} onClose={handleEqClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                  <Box sx={{ p: 2, width: 300 }}>
                    <Typography variant="subtitle2">{t('player.equalizer')}</Typography>
                    {EQ_BANDS.map((freq, i) => (
                      <Box key={freq} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ width: 50 }}>{freq}Hz</Typography>
                        <Slider
                          value={eqGains[i]}
                          min={-12}
                          max={12}
                          step={0.5}
                          onChange={(_, v) => handleEqChange(i, v as number)}
                          sx={{ mx: 2, flex: 1 }}
                        />
                        <Typography sx={{ width: 30 }}>{eqGains[i]}dB</Typography>
                      </Box>
                    ))}
                  </Box>
                </Popover>
              </Box>
            </Box>
            {/* Queue List */}
            <Box sx={{ flex: 1, minWidth: 200, maxWidth: 400, bgcolor: 'background.default', borderRadius: 2, p: 2, boxShadow: 1, height: '80vh', maxHeight: '80vh', alignSelf: 'center', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('player.queue')}</Typography>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {queue.map((song: any, idx: number) => (
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
      {/* Main Player Bar */}
      <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, bgcolor: 'background.paper', p: 2, display: 'flex', alignItems: 'center', zIndex: 1201 }}>
        {queue[current] && (
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mr: 2, width: '20vw', maxWidth: '20vw', flexShrink: 0 }}>
            {queue[current].imageUrl && (
              <Box component="img" src={queue[current].imageUrl} alt={queue[current].title} sx={{ width: 70, height: 70, borderRadius: 1, mr: 2, objectFit: 'cover', boxShadow: 1 }} />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1" noWrap fontWeight={600} sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>{queue[current].title}</Typography>
              {queue[current].album && (
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
                    onClick={() => window.location.assign(`/albums/${queue[current].album.id}`)}>
                    {queue[current].album.releaseYear ? `${queue[current].album.releaseYear} • ` : ''}{queue[current].album.name}
                  </Box>
                </Typography>
              )}
              {queue[current].artist && (
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
                    onClick={() => window.location.assign(`/artists/${queue[current].artist.id}`)}>
                    {queue[current].artist.name}
                  </Box>
                </Typography>
              )}
            </Box>
          </Box>
        )}
        <IconButton onClick={() => setCurrent(Math.max(current - 1, 0))}><SkipPrevious /></IconButton>
        <IconButton onClick={togglePlay}>{playing ? <Pause /> : <PlayArrow />}</IconButton>
        <IconButton onClick={() => setCurrent(Math.min(current + 1, queue.length - 1))}><SkipNext /></IconButton>
        <Slider
          value={progress}
          min={0}
          max={duration}
          onChange={(_, v) => {
            if (audioRef.current) audioRef.current.currentTime = Number(v);
            setProgress(Number(v));
          }}
          sx={{ mx: 2, flex: 1 }}
        />
        {/* Volume slider */}
        <Box sx={{ width: 120, mx: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ mr: 1 }}>{t('player.vol')}</Typography>
          <Slider
            value={volume * 100}
            min={0}
            max={100}
            step={1}
            onChange={(_, v) => {
              const newVolume = (v as number) / 100;
              setVolume(newVolume);
              if (audioRef.current && newVolume > 0) {
                audioRef.current.muted = false;
              }
            }}
            sx={{ flex: 1 }}
          />
        </Box>
        <IconButton onClick={handleEqOpen}><Equalizer /></IconButton>
        <IconButton onClick={handleToggleFavorite} disabled={favLoading} sx={{ ml: 1 }}>
          {favLoading ? <CircularProgress size={24} /> : favorite ? <Favorite color="primary" /> : <FavoriteBorder />}
        </IconButton>
        <IconButton onClick={() => setIsFullScreen(true)} sx={{ ml: 1 }}><Fullscreen /></IconButton>
        <audio
          ref={audioRef}
          src={queue[current]?.url || ''}
          crossOrigin="anonymous"
          onTimeUpdate={e => setProgress((e.target as HTMLAudioElement).currentTime)}
          onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
          style={{ display: 'none' }}
        />
        <Typography variant="caption">
          {formatTime(progress)} / {formatTime(duration)}
        </Typography>
        <Snackbar
          open={!!snackbar}
          autoHideDuration={3000}
          onClose={() => setSnackbar(null)}
          message={snackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
      </Box>
    </>
  );
}

// Helper to format seconds as mm:ss
function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
