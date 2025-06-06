import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Slider, Typography, Menu, MenuItem, Popover } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, Equalizer } from '@mui/icons-material';
import { useQueueStore } from './queueStore';

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
  const { queue, current, setCurrent } = useQueueStore((state: any) => ({
    queue: state.queue,
    current: state.current,
    setCurrent: state.setCurrent,
  }));

  // Equalizer setup
  const eqNodes = useRef<any[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);
  const sourceNode = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioCtx.current) audioCtx.current = new window.AudioContext();
    if (!sourceNode.current) sourceNode.current = audioCtx.current.createMediaElementSource(audioRef.current);
    // Disconnect previous
    sourceNode.current.disconnect();
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
    // Clean up on unmount
    return () => {
      eqNodes.current.forEach(node => node.disconnect());
      sourceNode.current?.disconnect();
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
    if (!scrobbled && progress > 10) {
      fetch('/scrobble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: queue[current].id, status: 'nowPlaying' }),
      });
      setScrobbled(true);
    }
    if (progress > duration * 0.7) {
      fetch('/scrobble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: queue[current].id, status: 'played' }),
      });
    }
  }, [progress, duration, queue, current, scrobbled]);

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
        src={src}
        onTimeUpdate={e => setProgress((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
        style={{ display: 'none' }}
      />
      <Typography variant="caption">{Math.floor(progress)} / {Math.floor(duration)}s</Typography>
    </Box>
  );
}
