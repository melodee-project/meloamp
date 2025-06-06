import React, { useRef, useState } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious } from '@mui/icons-material';
import { useQueueStore } from './queueStore';

export default function Player({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const { queue, current, setCurrent } = useQueueStore((state: any) => ({
    queue: state.queue,
    current: state.current,
    setCurrent: state.setCurrent,
  }));

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
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
