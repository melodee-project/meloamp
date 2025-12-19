import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Slider, Typography, Popover, Snackbar, CircularProgress, Dialog, Rating, Tooltip } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, Equalizer, Favorite, FavoriteBorder, Fullscreen, FullscreenExit, Repeat, RepeatOne, Shuffle } from '@mui/icons-material';
import { useQueueStore, RepeatMode } from '../queueStore';
import api from '../api';
import { ScrobbleRequest, ScrobbleType } from '../apiModels';
import { useTranslation } from 'react-i18next';
import { debugLog, debugError, isDebugEnabled } from '../debug';

// Simple equalizer bands
const EQ_BANDS = [60, 170, 350, 1000, 3500, 10000];

// Throttle progress updates to reduce re-renders (update UI max 4x per second)
const PROGRESS_UPDATE_INTERVAL_MS = 250;

// Playback error recovery constants
const MAX_RETRY_ATTEMPTS = 1;
const MAX_CONSECUTIVE_FAILURES = 3;

export default function Player({ src }: { src: string }) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const nextAudioRef = useRef<HTMLAudioElement>(null); // For gapless preloading
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [eqAnchor, setEqAnchor] = useState<null | HTMLElement>(null);
  const [eqGains, setEqGains] = useState<number[]>(Array(EQ_BANDS.length).fill(0));
  const [volume, setVolume] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [nextTrackPreloaded, setNextTrackPreloaded] = useState(false);
  
  // Error recovery state
  const retryCountRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  
  // Ref to track last progress update time for throttling
  const lastProgressUpdateRef = useRef<number>(0);
  // Ref to store actual progress for scrobbling without causing re-renders
  const progressRef = useRef<number>(0);
  
  const queue = useQueueStore((state: any) => state.queue);
  const current = useQueueStore((state: any) => state.current);
  const setCurrent = useQueueStore((state: any) => state.setCurrent);
  const updateSong = useQueueStore((state: any) => state.updateSong);
  const repeatMode = useQueueStore((state: any) => state.repeatMode);
  const shuffleEnabled = useQueueStore((state: any) => state.shuffleEnabled);
  const setRepeatMode = useQueueStore((state: any) => state.setRepeatMode);
  const toggleShuffle = useQueueStore((state: any) => state.toggleShuffle);
  const { t } = useTranslation();

  // Equalizer setup
  const eqNodes = useRef<any[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);
  const sourceNode = useRef<MediaElementAudioSourceNode | null>(null);

  // Cycle through repeat modes: OFF -> ALL -> ONE -> OFF
  const cycleRepeatMode = () => {
    const modes = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  // Get the appropriate icon and tooltip for repeat mode
  const getRepeatIcon = () => {
    switch (repeatMode) {
      case RepeatMode.ONE:
        return <RepeatOne />;
      case RepeatMode.ALL:
      case RepeatMode.OFF:
      default:
        return <Repeat />;
    }
  };

  const getRepeatTooltip = () => {
    switch (repeatMode) {
      case RepeatMode.OFF:
        return t('player.repeatOff');
      case RepeatMode.ALL:
        return t('player.repeatAll');
      case RepeatMode.ONE:
        return t('player.repeatOne');
      default:
        return t('player.repeatOff');
    }
  };

  // Preload next track for gapless-ish transitions
  useEffect(() => {
    if (!queue[current] || current >= queue.length - 1) {
      setNextTrackPreloaded(false);
      return;
    }

    const nextSong = queue[current + 1];
    if (!nextSong?.url || !nextAudioRef.current) return;

    // Preload when we reach 80% of the current track
    const preloadThreshold = 0.8;
    
    const checkPreload = () => {
      if (!audioRef.current || nextTrackPreloaded) return;
      
      const currentProgress = audioRef.current.currentTime / (audioRef.current.duration || 1);
      if (currentProgress >= preloadThreshold && nextSong.url) {
        debugLog('Player', 'Preloading next track:', nextSong.title);
        nextAudioRef.current!.src = nextSong.url;
        nextAudioRef.current!.load();
        setNextTrackPreloaded(true);
      }
    };

    const interval = setInterval(checkPreload, 1000);
    return () => clearInterval(interval);
  }, [current, queue, nextTrackPreloaded]);

  // Reset preload state when song changes
  useEffect(() => {
    setNextTrackPreloaded(false);
    retryCountRef.current = 0;
  }, [current]);

  // Handle playback errors with retry logic
  const handlePlaybackError = () => {
    const currentSong = queue[current];
    if (!currentSong) return;

    if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
      // Retry once
      retryCountRef.current++;
      debugLog('Player', `Retrying playback (attempt ${retryCountRef.current})`);
      setSnackbar(t('player.retrying'));
      
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {
            handlePlaybackError();
          });
        }
      }, 1000);
    } else {
      // Max retries reached, skip to next
      consecutiveFailuresRef.current++;
      retryCountRef.current = 0;
      
      if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
        // Too many consecutive failures, stop playback
        debugError('Player', 'Too many consecutive failures, stopping playback');
        setSnackbar(t('player.tooManyErrors'));
        setPlaying(false);
        consecutiveFailuresRef.current = 0;
      } else {
        // Skip to next track
        debugLog('Player', 'Skipping to next track after error');
        setSnackbar(t('player.skippingError'));
        
        if (current < queue.length - 1) {
          setCurrent(current + 1);
        } else if (repeatMode === RepeatMode.ALL) {
          setCurrent(0);
        } else {
          setPlaying(false);
        }
      }
    }
  };

  // Reset consecutive failures on successful playback
  const handlePlaybackSuccess = () => {
    consecutiveFailuresRef.current = 0;
    retryCountRef.current = 0;
  };

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

  // Scrobbling logic - optimized to avoid running on every progress tick
  // Use refs to track scrobble state without triggering re-renders
  const scrobbleStateRef = useRef({ scrobbled: false, scrobbledPlayed: false, lastSongId: '' });
  
  // Use an interval for scrobble checks instead of reacting to every progress change
  // This dramatically reduces the number of effect runs for long playback sessions
  useEffect(() => {
    if (!queue[current]) return;
    
    const songId = queue[current].id;
    
    // Reset scrobble state when song changes
    if (scrobbleStateRef.current.lastSongId !== songId) {
      scrobbleStateRef.current = { scrobbled: false, scrobbledPlayed: false, lastSongId: songId };
    }
    
    // Check scrobble conditions every 2 seconds instead of on every progress update
    const scrobbleCheckInterval = setInterval(() => {
      if (!audioRef.current) return;
      
      const currentProgress = progressRef.current;
      const currentDuration = audioRef.current.duration || 0;
      
      // Skip if both scrobbles already sent
      if (scrobbleStateRef.current.scrobbled && scrobbleStateRef.current.scrobbledPlayed) {
        return;
      }
      
      // Only log in debug mode to avoid performance impact
      if (isDebugEnabled()) {
        debugLog('Player', `Scrobble check: progress=${currentProgress.toFixed(2)}s, duration=${currentDuration.toFixed(2)}s`);
      }
      
      const baseScrobble: Omit<ScrobbleRequest, 'scrobbleType'> = {
        songId: queue[current].id,
        playerName: 'MeloAmp',
        timestamp: Date.now(),
        playedDuration: Math.floor(currentProgress * 1000), // Convert seconds to milliseconds
      };
      
      // Only scrobble NOW_PLAYING once (after 10 seconds)
      if (!scrobbleStateRef.current.scrobbled && currentProgress > 10) {
        scrobbleStateRef.current.scrobbled = true;
        
        const nowPlayingScrobble = {
          ...baseScrobble,
          scrobbleType: ScrobbleType.NOW_PLAYING,
        } as ScrobbleRequest;
        
        debugLog('Player', 'Sending NOW_PLAYING scrobble:', nowPlayingScrobble);
        api.post('/scrobble', nowPlayingScrobble)
          .then(() => debugLog('Player', 'NOW_PLAYING scrobble sent successfully'))
          .catch((error) => debugError('Player', 'Failed to send NOW_PLAYING scrobble:', error));
      }
      
      // Only scrobble PLAYED once (after 70% of song)
      const playedThreshold = currentDuration * 0.7;
      if (!scrobbleStateRef.current.scrobbledPlayed && currentDuration > 0 && currentProgress > playedThreshold) {
        scrobbleStateRef.current.scrobbledPlayed = true;
        
        const playedScrobble = {
          ...baseScrobble,
          scrobbleType: ScrobbleType.PLAYED,
        } as ScrobbleRequest;
        
        debugLog('Player', `Sending PLAYED scrobble (progress: ${currentProgress.toFixed(2)}s > threshold: ${playedThreshold.toFixed(2)}s)`);
        api.post('/scrobble', playedScrobble)
          .then(() => debugLog('Player', 'PLAYED scrobble sent successfully'))
          .catch((error) => debugError('Player', 'Failed to send PLAYED scrobble:', error));
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(scrobbleCheckInterval);
  }, [queue, current]); // Only re-run when song changes, not on progress

  // Auto-play when src changes
  useEffect(() => {
    if (!audioRef.current) return;
    debugLog('Player', 'Auto-play effect triggered, src changed to:', src);
    
    // Inspect the stream URL response before playback
    if (src && src.startsWith('http')) {
      fetch(src, { method: 'HEAD' })
        .then(response => {
          debugLog('Player', 'Stream URL HEAD response:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
            acceptRanges: response.headers.get('accept-ranges'),
            headers: Array.from(response.headers.entries())
          });
          
          // If HEAD doesn't work, try GET with range to check first bytes
          if (!response.ok) {
            return fetch(src, { headers: { 'Range': 'bytes=0-1023' } })
              .then(getResponse => {
                debugLog('Player', 'Stream URL GET (first 1KB) response:', {
                  status: getResponse.status,
                  contentType: getResponse.headers.get('content-type'),
                  contentRange: getResponse.headers.get('content-range'),
                  headers: Array.from(getResponse.headers.entries())
                });
                return getResponse.blob();
              })
              .then(blob => {
                debugLog('Player', 'First 1KB blob:', {
                  size: blob.size,
                  type: blob.type
                });
              });
          }
        })
        .catch(error => {
          debugError('Player', 'Failed to inspect stream URL:', error);
        });
    }
    
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => {
      debugLog('Player', 'Auto-play successful');
      setPlaying(true);
    }).catch((error) => {
      debugError('Player', 'Auto-play failed:', error);
      setPlaying(false);
    });
  }, [src]);

  const [shouldAutoPlayFirst, setShouldAutoPlayFirst] = useState(false);
  const prevQueueLength = useRef(queue.length);
  useEffect(() => {
    if (prevQueueLength.current === 0 && queue.length > 0) {
      debugLog('Player', 'Queue changed from empty to non-empty, triggering auto-play');
      setCurrent(0);
      setShouldAutoPlayFirst(true);
    }
    prevQueueLength.current = queue.length;
  }, [queue.length, setCurrent]);

  // Unified effect: handle auto-play and src setting together
  useEffect(() => {
    if (
      shouldAutoPlayFirst &&
      audioRef.current &&
      queue.length > 0 &&
      typeof current === 'number' &&
      queue[current]?.url
    ) {
      debugLog('Player', 'Unified auto-play: Setting src and playing:', {
        url: queue[current].url,
        currentIndex: current,
        songTitle: queue[current]?.title
      });
      audioRef.current.src = queue[current].url;
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        debugLog('Player', 'Unified auto-play successful');
        setPlaying(true);
      }).catch((error) => {
        debugError('Player', 'Unified auto-play failed:', error);
        setPlaying(false);
      });
      setShouldAutoPlayFirst(false);
    }
  }, [shouldAutoPlayFirst, queue, current]);

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
  // Keep favorite and rating in sync with the active queue item.
  // Normalize rating to 0..5 (map negative ratings like -1 to 0 for the star control).
  setFavorite(queue[current]?.userStarred ?? false);
  const rawRating = queue[current]?.userRating;
  const normalized = typeof rawRating === 'number' && rawRating > 0 ? Math.min(5, Math.max(0, rawRating)) : 0;
  setRating(normalized);
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

  // Actually play when the first song is set and flagged for auto-play
  useEffect(() => {
    if (
      shouldAutoPlayFirst &&
      audioRef.current &&
      queue.length > 0 &&
      current === 0 &&
      audioRef.current.src &&
      audioRef.current.src.includes(queue[0]?.url)
    ) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      setShouldAutoPlayFirst(false);
    }
  }, [shouldAutoPlayFirst, queue, current]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      debugLog('Player', 'Pausing playback');
      audioRef.current.pause();
      setPlaying(false);
    } else {
      debugLog('Player', 'Resuming/starting playback:', {
        hasSrc: !!audioRef.current.src,
        src: audioRef.current.src || src,
        currentTime: audioRef.current.currentTime
      });
      // Always set src in case it was lost on refresh
      if (!audioRef.current.src && src) {
        audioRef.current.src = src;
      }
      const playPromise = audioRef.current.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          debugLog('Player', 'Play promise resolved');
          setPlaying(true);
        }).catch((error) => {
          debugError('Player', 'Play promise rejected:', error);
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

  const handleSetRating = async (newRating: number | null) => {
    if (!queue[current]) return;
    // treat null as 0 (remove rating)
    const r = newRating === null ? 0 : newRating;
    const songId = queue[current].id;
    setRatingLoading(true);
    try {
      // endpoint follows existing convention for songs; send rating (0-5)
      await api.post(`/songs/setrating/${songId}/${r}`);
      setRating(r);
      // persist change in queue store so rating persists locally
      try {
        if (typeof updateSong === 'function') updateSong(current, { userRating: r });
      } catch {}
      setSnackbar(r === 0 ? t('player.ratingRemoved') : t('player.ratingSaved'));
    } catch (err) {
      setSnackbar(t('player.failedToUpdateRating'));
    } finally {
      setRatingLoading(false);
    }
  };

  // Helper to play a song at a given index
  const playSongAtIndex = (idx: number) => {
    debugLog('Player', 'playSongAtIndex called:', {
      index: idx,
      queueLength: queue.length,
      song: queue[idx] ? {
        id: queue[idx].id,
        title: queue[idx].title,
        url: queue[idx].url
      } : null
    });
    setCurrent(idx);
    setTimeout(() => {
      if (audioRef.current) {
        debugLog('Player', 'Playing song after timeout');
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => {
          debugLog('Player', 'Play successful in playSongAtIndex');
          setPlaying(true);
        }).catch((error) => {
          debugError('Player', 'Play failed in playSongAtIndex:', error);
          setPlaying(false);
        });
      }
    }, 0);
  };

  // Send playback info to Electron for MPRIS integration
  useEffect(() => {
    if (!window.meloampAPI || !queue[current]) return;
    const info = {
      trackId: queue[current]?.id?.toString() || undefined,
      length: duration, // duration in seconds
      artUrl: queue[current]?.artwork || '',
      title: queue[current]?.title || '',
      album: queue[current]?.album || '',
      artist: queue[current]?.artist || '',
      status: playing ? 'Playing' : (duration > 0 ? 'Paused' : 'Stopped'),
      position: audioRef.current?.currentTime || 0
    };
    window.meloampAPI.sendPlaybackInfo(info);
  }, [current, duration, playing, queue]);

  // Web Media Session API for Windows SMTC and macOS Now Playing
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    
    const currentSong = queue[current];
    if (!currentSong) {
      navigator.mediaSession.metadata = null;
      return;
    }

    // Extract artist name
    const artistName = typeof currentSong.artist === 'object' && currentSong.artist?.name 
      ? currentSong.artist.name 
      : (Array.isArray(currentSong.artist) 
          ? currentSong.artist.map((a: any) => typeof a === 'object' ? a.name : a).join(', ')
          : currentSong.artist || '');
    
    // Extract album name
    const albumName = typeof currentSong.album === 'object' && currentSong.album?.name 
      ? currentSong.album.name 
      : currentSong.album || '';

    // Get artwork URL
    const artworkUrl = currentSong.artwork || currentSong.artUrl || 
      (typeof currentSong.album === 'object' && currentSong.album?.imageUrl) || '';

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || 'Unknown Track',
        artist: artistName || 'Unknown Artist',
        album: albumName || '',
        artwork: artworkUrl ? [
          { src: artworkUrl, sizes: '96x96', type: 'image/png' },
          { src: artworkUrl, sizes: '128x128', type: 'image/png' },
          { src: artworkUrl, sizes: '192x192', type: 'image/png' },
          { src: artworkUrl, sizes: '256x256', type: 'image/png' },
          { src: artworkUrl, sizes: '384x384', type: 'image/png' },
          { src: artworkUrl, sizes: '512x512', type: 'image/png' }
        ] : []
      });
    } catch (err) {
      console.error('Failed to set media session metadata:', err);
    }
  }, [current, queue]);

  // Media Session action handlers for Windows/macOS media controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setPlaying(true)).catch(console.error);
        }
      }],
      ['pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setPlaying(false);
        }
      }],
      ['previoustrack', () => {
        if (audioRef.current && audioRef.current.currentTime > 3) {
          audioRef.current.currentTime = 0;
        } else if (current > 0) {
          setCurrent(current - 1);
        } else if (repeatMode === RepeatMode.ALL && queue.length > 0) {
          setCurrent(queue.length - 1);
        }
      }],
      ['nexttrack', () => {
        if (current < queue.length - 1) {
          setCurrent(current + 1);
        } else if (repeatMode === RepeatMode.ALL && queue.length > 0) {
          setCurrent(0);
        }
      }],
      ['stop', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setPlaying(false);
        }
      }],
      ['seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
        }
      }],
      ['seekbackward', (details) => {
        if (audioRef.current) {
          const skipTime = details.seekOffset || 10;
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - skipTime);
        }
      }],
      ['seekforward', (details) => {
        if (audioRef.current) {
          const skipTime = details.seekOffset || 10;
          audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + skipTime);
        }
      }]
    ];

    // Register action handlers
    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.warn(`Media session action '${action}' not supported:`, err);
      }
    }

    // Cleanup: remove action handlers
    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore errors during cleanup
        }
      }
    };
  }, [current, queue.length, setCurrent, duration, repeatMode]);

  // Update media session playback state and position
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';

    // Update position state if supported
    if ('setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: audioRef.current?.playbackRate || 1,
          position: audioRef.current?.currentTime || 0
        });
      } catch {
        // Ignore errors (some browsers don't fully support this)
      }
    }
  }, [playing, duration, progress]);

  // Send position updates for MPRIS during playback
  useEffect(() => {
    if (!window.meloampAPI || !playing || !audioRef.current) return;
    
    const updatePosition = () => {
      if (audioRef.current && window.meloampAPI) {
        window.meloampAPI.sendPosition(audioRef.current.currentTime);
      }
    };
    
    const interval = setInterval(updatePosition, 1000); // Update every second
    return () => clearInterval(interval);
  }, [playing]);

  // Listen for MPRIS control events from Electron
  useEffect(() => {
    if (!window.electron || !window.electron.ipcRenderer) return;
    
    const handler = (_event: any, command: string, ...args: any[]) => {
      switch (command) {
        case 'play':
          if (!playing && audioRef.current) {
            audioRef.current.play().then(() => setPlaying(true)).catch(console.error);
          }
          break;
        case 'pause':
          if (playing && audioRef.current) {
            audioRef.current.pause();
            setPlaying(false);
          }
          break;
        case 'stop':
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setPlaying(false);
          }
          break;
        case 'next':
          if (current < queue.length - 1) {
            setCurrent(current + 1);
          }
          break;
        case 'previous':
          if (current > 0) {
            setCurrent(current - 1);
          }
          break;
        case 'seek':
          if (audioRef.current && args[0] !== undefined) {
            const offsetSeconds = args[0] / 1000000; // Convert from microseconds
            audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + offsetSeconds));
          }
          break;
        case 'position':
          if (audioRef.current && args[0] !== undefined) {
            const positionSeconds = args[0] / 1000000; // Convert from microseconds
            audioRef.current.currentTime = Math.max(0, Math.min(duration, positionSeconds));
          }
          break;
      }
    };

    window.electron.ipcRenderer.on('meloamp-mpris-control', handler);
    return () => {
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.removeListener('meloamp-mpris-control', handler);
      }
    };
  }, [playing, current, queue.length, setCurrent, duration]);

  // Listen for global media key events from Electron
  useEffect(() => {
    if (!window.electron || !window.electron.ipcRenderer) return;
    
    const mediaKeyHandler = (_event: any, command: string) => {
      debugLog('Player', 'Media key received:', command);
      switch (command) {
        case 'playPause':
          if (playing && audioRef.current) {
            audioRef.current.pause();
            setPlaying(false);
          } else if (!playing && audioRef.current) {
            audioRef.current.play().then(() => setPlaying(true)).catch(console.error);
          }
          break;
        case 'next':
          if (current < queue.length - 1) {
            setCurrent(current + 1);
          } else if (repeatMode === RepeatMode.ALL && queue.length > 0) {
            setCurrent(0);
          }
          break;
        case 'previous':
          // If more than 3 seconds into track, restart it. Otherwise go to previous
          if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
          } else if (current > 0) {
            setCurrent(current - 1);
          } else if (repeatMode === RepeatMode.ALL && queue.length > 0) {
            setCurrent(queue.length - 1);
          }
          break;
        case 'stop':
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setPlaying(false);
          }
          break;
      }
    };

    window.electron.ipcRenderer.on('meloamp-media-key', mediaKeyHandler);
    return () => {
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.removeListener('meloamp-media-key', mediaKeyHandler);
      }
    };
  }, [playing, current, queue.length, setCurrent, repeatMode]);

  // Listen for keyboard shortcut events from App component
  useEffect(() => {
    const handleTogglePlay = () => {
      if (playing && audioRef.current) {
        audioRef.current.pause();
        setPlaying(false);
      } else if (!playing && audioRef.current) {
        audioRef.current.play().then(() => setPlaying(true)).catch(console.error);
      }
    };

    const handleNextTrack = () => {
      if (current < queue.length - 1) {
        setCurrent(current + 1);
      } else if (repeatMode === RepeatMode.ALL && queue.length > 0) {
        setCurrent(0);
      }
    };

    const handlePrevTrack = () => {
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
      } else if (current > 0) {
        setCurrent(current - 1);
      } else if (repeatMode === RepeatMode.ALL && queue.length > 0) {
        setCurrent(queue.length - 1);
      }
    };

    window.addEventListener('meloamp-toggle-play', handleTogglePlay);
    window.addEventListener('meloamp-next-track', handleNextTrack);
    window.addEventListener('meloamp-prev-track', handlePrevTrack);

    return () => {
      window.removeEventListener('meloamp-toggle-play', handleTogglePlay);
      window.removeEventListener('meloamp-next-track', handleNextTrack);
      window.removeEventListener('meloamp-prev-track', handlePrevTrack);
    };
  }, [playing, current, queue.length, setCurrent, repeatMode]);

  // Update system tray with now playing info
  useEffect(() => {
    if (!window.meloampAPI?.updateTray) return;
    
    const currentSong = queue[current];
    if (currentSong) {
      const artistName = typeof currentSong.artist === 'object' && currentSong.artist?.name 
        ? currentSong.artist.name 
        : (Array.isArray(currentSong.artist) 
            ? currentSong.artist.map((a: any) => typeof a === 'object' ? a.name : a).join(', ')
            : currentSong.artist || '');
      
      window.meloampAPI.updateTray({
        title: currentSong.title || '',
        artist: artistName,
        playing: playing
      });
    } else {
      window.meloampAPI.updateTray(null);
    }
  }, [queue, current, playing]);

  return (
    <>
      {/* Full Screen Player Dialog */}
      <Dialog fullScreen open={isFullScreen} onClose={() => setIsFullScreen(false)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between', minHeight: 64 }}>
            <IconButton onClick={() => setIsFullScreen(false)}><FullscreenExit /></IconButton>
            <Box sx={{ width: 48 }} /> {/* Spacer for symmetry */}
          </Box>
          <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', justifyContent: 'center', gap: 4, p: { xs: 1, md: 4 }, height: '80vh', minHeight: 0 }}>
            {/* Large Artwork - prefer album imageUrl for best quality */}
            {(queue[current]?.album?.imageUrl || queue[current]?.imageUrl) && (
              <Box component="img" src={queue[current].album?.imageUrl || queue[current].imageUrl} alt={queue[current].title} sx={{ width: { xs: '60vw', md: '70vh' }, height: { xs: '60vw', md: '70vh' }, maxHeight: '70vh', borderRadius: 4, objectFit: 'cover', boxShadow: 6, alignSelf: 'center' }} />
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
                variant="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' },
                  textAlign: 'center',
                  mb: 2,
                  lineHeight: 1.1,
                  wordBreak: 'break-word',
                  maxWidth: { xs: '98vw', md: '90vw', lg: '70vw' },
                  whiteSpace: 'normal',
                  overflowWrap: 'break-word',
                }}
              >
                {queue[current]?.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', mb: 2, minHeight: 60 }}>
                {queue[current].album && (
                  <Box
                    onClick={() => navigate(`/albums/${queue[current].album.id}`)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.default',
                      borderRadius: 2,
                      boxShadow: 2,
                      px: 2,
                      py: 1,
                      cursor: 'pointer',
                      minWidth: 0,
                      maxWidth: 260,
                      height: 60,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: 6 },
                    }}
                  >
                    {queue[current].album.imageUrl && (
                      <Box component="img" src={queue[current].album.imageUrl} alt={queue[current].album.name} sx={{ width: 40, height: 40, borderRadius: 1, mr: 1, objectFit: 'cover', boxShadow: 1 }} />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>{queue[current].album.name}</Typography>
                      {queue[current].album.releaseYear && (
                        <Typography variant="caption" color="text.secondary">{queue[current].album.releaseYear}</Typography>
                      )}
                    </Box>
                  </Box>
                )}
                {queue[current].artist && (
                  <Box
                    onClick={() => navigate(`/artists/${queue[current].artist.id}`)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.default',
                      borderRadius: 2,
                      boxShadow: 2,
                      px: 2,
                      py: 1,
                      cursor: 'pointer',
                      minWidth: 0,
                      maxWidth: 220,
                      height: 60,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: 6 },
                    }}
                  >
                    {queue[current].artist.imageUrl && (
                      <Box component="img" src={queue[current].artist.imageUrl} alt={queue[current].artist.name} sx={{ width: 36, height: 40, borderRadius: '50%', mr: 1, objectFit: 'cover', boxShadow: 1 }} />
                    )}
                    <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>{queue[current].artist.name}</Typography>
                  </Box>
                )}
              </Box>
              {/* Playback Progress Indicator */}
              <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>{formatTime(progress)}</Typography>
                <Slider
                  value={progress}
                  min={0}
                  max={duration}
                  onChange={(_, v) => {
                    if (audioRef.current) audioRef.current.currentTime = Number(v);
                    setProgress(Number(v));
                  }}
                  sx={{ flex: 1, mx: 2 }}
                />
                <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'left' }}>{formatTime(duration)}</Typography>
              </Box>
              {/* Controls (reuse main controls) */}
              <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {/* Shuffle button */}
                  <Tooltip title={shuffleEnabled ? t('player.shuffleOn') : t('player.shuffleOff')}>
                    <IconButton onClick={toggleShuffle} color={shuffleEnabled ? 'primary' : 'default'} sx={{ mx: 1 }}>
                      <Shuffle fontSize="large" />
                    </IconButton>
                  </Tooltip>
                  <IconButton onClick={() => playSongAtIndex(Math.max(current - 1, 0))} sx={{ mx: 1, fontSize: 32 }}><SkipPrevious fontSize="large" /></IconButton>
                  <IconButton onClick={togglePlay} sx={{ mx: 2, fontSize: 40 }}>{playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}</IconButton>
                  <IconButton onClick={() => playSongAtIndex(Math.min(current + 1, queue.length - 1))} sx={{ mx: 1, fontSize: 32 }}><SkipNext fontSize="large" /></IconButton>
                  {/* Repeat button */}
                  <Tooltip title={getRepeatTooltip()}>
                    <IconButton onClick={cycleRepeatMode} color={repeatMode !== RepeatMode.OFF ? 'primary' : 'default'} sx={{ mx: 1 }}>
                      {getRepeatIcon()}
                    </IconButton>
                  </Tooltip>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    {ratingLoading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : (
                      <Rating
                        name="song-rating-fullscreen"
                        value={rating}
                        max={5}
                        onChange={(_, v) => handleSetRating(v)}
                        size="large"
                      />
                    )}
                    <IconButton onClick={handleToggleFavorite} disabled={favLoading} sx={{ ml: 1 }}>
                      {favLoading ? <CircularProgress size={24} /> : favorite ? <Favorite color="primary" /> : <FavoriteBorder />}
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
            {/* Right: Queue List */}
            <Box sx={{ flex: 1, minWidth: 200, maxWidth: 400, bgcolor: 'background.default', borderRadius: 2, p: 2, boxShadow: 1, height: { xs: '60vh', md: '70vh' }, maxHeight: { xs: '60vh', md: '70vh' }, alignSelf: 'center', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                    onClick={() => navigate(`/albums/${queue[current].album.id}`)}>
                    {queue[current].album.releaseYear ? `${queue[current].album.releaseYear} • ` : ''}{queue[current].album.name}
                  </Box>
                </Typography>
              )}
              {queue[current].artist && (
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
                    onClick={() => navigate(`/artists/${queue[current].artist.id}`)}>
                    {queue[current].artist.name}
                  </Box>
                </Typography>
              )}
            </Box>
          </Box>
        )}
        {/* Shuffle button */}
        <Tooltip title={shuffleEnabled ? t('player.shuffleOn') : t('player.shuffleOff')}>
          <IconButton 
            onClick={toggleShuffle} 
            color={shuffleEnabled ? 'primary' : 'default'}
          >
            <Shuffle />
          </IconButton>
        </Tooltip>
        <IconButton onClick={() => playSongAtIndex(Math.max(current - 1, 0))}><SkipPrevious /></IconButton>
        <IconButton onClick={togglePlay}>{playing ? <Pause /> : <PlayArrow />}</IconButton>
        <IconButton onClick={() => playSongAtIndex(Math.min(current + 1, queue.length - 1))}><SkipNext /></IconButton>
        {/* Repeat button */}
        <Tooltip title={getRepeatTooltip()}>
          <IconButton 
            onClick={cycleRepeatMode} 
            color={repeatMode !== RepeatMode.OFF ? 'primary' : 'default'}
          >
            {getRepeatIcon()}
          </IconButton>
        </Tooltip>
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
        {/* Hidden audio element for preloading next track */}
        <audio ref={nextAudioRef} preload="auto" style={{ display: 'none' }} />
        <audio
          ref={audioRef}
          src={queue[current]?.url || ''}
          crossOrigin="anonymous"
          onTimeUpdate={e => {
            const currentTime = (e.target as HTMLAudioElement).currentTime;
            // Always update the ref for scrobbling accuracy
            progressRef.current = currentTime;
            // Throttle UI updates to reduce re-renders
            const now = Date.now();
            if (now - lastProgressUpdateRef.current >= PROGRESS_UPDATE_INTERVAL_MS) {
              lastProgressUpdateRef.current = now;
              setProgress(currentTime);
            }
          }}
          onLoadedMetadata={e => {
            const audio = e.target as HTMLAudioElement;
            debugLog('Player Audio', 'loadedmetadata:', {
              duration: audio.duration,
              src: audio.src,
              readyState: audio.readyState,
              networkState: audio.networkState
            });
            setDuration(audio.duration);
          }}
          onLoadStart={e => {
            const audio = e.target as HTMLAudioElement;
            debugLog('Player Audio', 'loadstart:', {
              src: audio.src,
              currentTime: audio.currentTime
            });
          }}
          onLoadedData={e => {
            const audio = e.target as HTMLAudioElement;
            debugLog('Player Audio', 'loadeddata:', {
              readyState: audio.readyState,
              duration: audio.duration,
              buffered: audio.buffered.length > 0 ? `${audio.buffered.start(0)}-${audio.buffered.end(0)}` : 'none'
            });
          }}
          onCanPlay={e => {
            const audio = e.target as HTMLAudioElement;
            debugLog('Player Audio', 'canplay:', {
              readyState: audio.readyState,
              paused: audio.paused,
              buffered: audio.buffered.length > 0 ? `${audio.buffered.start(0)}-${audio.buffered.end(0)}` : 'none'
            });
          }}
          onCanPlayThrough={e => {
            debugLog('Player Audio', 'canplaythrough - enough data loaded to play through');
          }}
          onPlaying={e => {
            debugLog('Player Audio', 'playing event - playback has begun');
            handlePlaybackSuccess();
          }}
          onPause={e => {
            debugLog('Player Audio', 'pause event');
          }}
          onWaiting={e => {
            debugLog('Player Audio', 'waiting - playback stopped due to lack of data');
          }}
          onStalled={e => {
            const audio = e.target as HTMLAudioElement;
            console.warn('[Player Audio] stalled - browser is trying to fetch data but it\'s not coming:', {
              networkState: audio.networkState,
              readyState: audio.readyState,
              buffered: audio.buffered.length > 0 ? `${audio.buffered.start(0)}-${audio.buffered.end(0)}` : 'none'
            });
          }}
          onSuspend={e => {
            debugLog('Player Audio', 'suspend - media data loading has been suspended');
          }}
          onAbort={e => {
            console.warn('[Player Audio] abort - media data loading aborted');
          }}
          onError={e => {
            const audio = e.target as HTMLAudioElement;
            const error = audio.error;
            debugError('Player Audio', 'ERROR:', {
              code: error?.code,
              message: error?.message,
              src: audio.src,
              networkState: audio.networkState,
              readyState: audio.readyState,
              errorDetails: error ? {
                MEDIA_ERR_ABORTED: error.code === 1,
                MEDIA_ERR_NETWORK: error.code === 2,
                MEDIA_ERR_DECODE: error.code === 3,
                MEDIA_ERR_SRC_NOT_SUPPORTED: error.code === 4
              } : null
            });
            // Trigger error recovery
            handlePlaybackError();
          }}
          onProgress={e => {
            const audio = e.target as HTMLAudioElement;
            if (audio.buffered.length > 0) {
              const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
              const percentBuffered = (bufferedEnd / audio.duration) * 100;
              // Only log every 10% to avoid spam
              if (percentBuffered % 10 < 1) {
                debugLog('Player Audio', 'progress:', {
                  buffered: `${bufferedEnd.toFixed(2)}s / ${audio.duration.toFixed(2)}s (${percentBuffered.toFixed(0)}%)`,
                  ranges: audio.buffered.length
                });
              }
            }
          }}
          onEnded={() => {
            debugLog('Player Audio', 'ended - playback completed, repeatMode:', repeatMode);
            handlePlaybackSuccess();
            
            if (repeatMode === RepeatMode.ONE) {
              // Repeat One: restart the same song
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(handlePlaybackError);
              }
            } else if (current < queue.length - 1) {
              // More songs in queue
              playSongAtIndex(current + 1);
            } else if (repeatMode === RepeatMode.ALL) {
              // Repeat All: wrap to first song
              playSongAtIndex(0);
            } else {
              // Repeat Off: stop at end
              setPlaying(false);
            }
          }}
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
      {/* Equalizer Popover - shared by fullscreen and main player bar */}
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
