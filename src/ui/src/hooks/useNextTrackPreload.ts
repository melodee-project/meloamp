import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Song } from '../queueStore';
import { debugLog } from '../debug';

const PRELOAD_THRESHOLD = 0.8;
const POLL_INTERVAL_MS = 1000;

interface NextTrackPreloadDeps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  nextAudioRef: MutableRefObject<HTMLAudioElement | null>;
  currentSong: Song | undefined;
  current: number;
  queue: Song[];
}

export function useNextTrackPreload({
  audioRef,
  nextAudioRef,
  currentSong,
  current,
  queue,
}: NextTrackPreloadDeps) {
  const [preloaded, setPreloaded] = useState(false);
  const preloadedRef = useRef(false);

  useEffect(() => {
    setPreloaded(false);
    preloadedRef.current = false;
  }, [current]);

  useEffect(() => {
    if (!currentSong || current >= queue.length - 1) {
      setPreloaded(false);
      return;
    }
    const nextSong = queue[current + 1];
    if (!nextSong?.url || !nextAudioRef.current) return;

    const interval = setInterval(() => {
      if (!audioRef.current || preloadedRef.current) return;
      const ratio = audioRef.current.currentTime / (audioRef.current.duration || 1);
      if (ratio >= PRELOAD_THRESHOLD && nextSong.url) {
        debugLog('Player', 'Preloading next track:', nextSong.title);
        nextAudioRef.current!.src = nextSong.url;
        nextAudioRef.current!.load();
        preloadedRef.current = true;
        setPreloaded(true);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [audioRef, currentSong, current, nextAudioRef, queue]);

  return preloaded;
}
