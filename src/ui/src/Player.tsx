import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Slider, Typography, Popover } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, Equalizer } from '@mui/icons-material';
import { useQueueStore } from './queueStore';
import api from './api';
import { ScrobbleRequest, ScrobbleType } from './apiModels';

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
  const queue = useQueueStore((state: any) => state.queue);
  const current = useQueueStore((state: any) => state.current);
  const setCurrent = useQueueStore((state: any) => state.setCurrent);

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

  // Keep audio element volume in sync with slider
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    // Dispatch custom event for playing state and current index
    window.dispatchEvent(new CustomEvent('meloamp-player-state', { detail: { playing, current } }));
  }, [volume, playing, current]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleEqOpen = (e: React.MouseEvent<HTMLElement>) => setEqAnchor(e.currentTarget);
  const handleEqClose = () => setEqAnchor(null);
  const handleEqChange = (i: number, value: number) => {
    setEqGains(gains => gains.map((g, idx) => (idx === i ? value : g)));
  };

  return (
    <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, bgcolor: 'background.paper', p: 2, display: 'flex', alignItems: 'center', zIndex: 1201 }}>
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
        <Typography variant="caption" sx={{ mr: 1 }}>Vol</Typography>
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
      <Popover open={!!eqAnchor} anchorEl={eqAnchor} onClose={handleEqClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2">Equalizer</Typography>
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
      <audio
        ref={audioRef}
        src={src || undefined}
        crossOrigin="anonymous"
        onTimeUpdate={e => setProgress((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
        style={{ display: 'none' }}
      />
      <Typography variant="caption">{Math.floor(progress)} / {Math.floor(duration)}s</Typography>
    </Box>
  );
}
