import { MutableRefObject, useEffect } from 'react';
import { RepeatMode, useQueueStore } from '../queueStore';
import { debugLog } from '../debug';

interface PlaybackBridgeDeps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  playing: boolean;
  duration: number;
  setPlaying: (playing: boolean) => void;
}

const isElectronApiAvailable = (): boolean =>
  typeof window !== 'undefined'
  && !!window.electron
  && !!window.electron.ipcRenderer;

const handleMprisCommand = (
  command: string,
  args: unknown[],
  ctx: { audioRef: MutableRefObject<HTMLAudioElement | null>; playing: boolean; duration: number; setPlaying: (p: boolean) => void; setCurrent: (i: number) => void; current: number; queueLength: number },
) => {
  switch (command) {
    case 'play':
      if (!ctx.playing && ctx.audioRef.current) {
        ctx.audioRef.current.play().then(() => ctx.setPlaying(true)).catch(console.error);
      }
      break;
    case 'pause':
      if (ctx.playing && ctx.audioRef.current) {
        ctx.audioRef.current.pause();
        ctx.setPlaying(false);
      }
      break;
    case 'stop':
      if (ctx.audioRef.current) {
        ctx.audioRef.current.pause();
        ctx.audioRef.current.currentTime = 0;
        ctx.setPlaying(false);
      }
      break;
    case 'next':
      if (ctx.current < ctx.queueLength - 1) ctx.setCurrent(ctx.current + 1);
      break;
    case 'previous':
      if (ctx.current > 0) ctx.setCurrent(ctx.current - 1);
      break;
    case 'seek':
      if (ctx.audioRef.current && args[0] !== undefined) {
        const offsetSeconds = (args[0] as number) / 1000000;
        ctx.audioRef.current.currentTime = Math.max(0, Math.min(ctx.duration, ctx.audioRef.current.currentTime + offsetSeconds));
      }
      break;
    case 'position':
      if (ctx.audioRef.current && args[0] !== undefined) {
        const positionSeconds = (args[0] as number) / 1000000;
        ctx.audioRef.current.currentTime = Math.max(0, Math.min(ctx.duration, positionSeconds));
      }
      break;
  }
};

const handleMediaKeyCommand = (
  command: string,
  ctx: { audioRef: MutableRefObject<HTMLAudioElement | null>; playing: boolean; duration: number; setPlaying: (p: boolean) => void; setCurrent: (i: number) => void; current: number; queueLength: number; repeatMode: RepeatMode },
) => {
  switch (command) {
    case 'playPause':
      if (ctx.playing && ctx.audioRef.current) {
        ctx.audioRef.current.pause();
        ctx.setPlaying(false);
      } else if (!ctx.playing && ctx.audioRef.current) {
        ctx.audioRef.current.play().then(() => ctx.setPlaying(true)).catch(console.error);
      }
      break;
    case 'next':
      if (ctx.current < ctx.queueLength - 1) ctx.setCurrent(ctx.current + 1);
      else if (ctx.repeatMode === RepeatMode.ALL && ctx.queueLength > 0) ctx.setCurrent(0);
      break;
    case 'previous':
      if (ctx.audioRef.current && ctx.audioRef.current.currentTime > 3) {
        ctx.audioRef.current.currentTime = 0;
      } else if (ctx.current > 0) {
        ctx.setCurrent(ctx.current - 1);
      } else if (ctx.repeatMode === RepeatMode.ALL && ctx.queueLength > 0) {
        ctx.setCurrent(ctx.queueLength - 1);
      }
      break;
    case 'stop':
      if (ctx.audioRef.current) {
        ctx.audioRef.current.pause();
        ctx.audioRef.current.currentTime = 0;
        ctx.setPlaying(false);
      }
      break;
  }
};

export function usePlaybackBridge({ audioRef, playing, duration, setPlaying }: PlaybackBridgeDeps) {
  const current = useQueueStore((s) => s.current);
  const queueLength = useQueueStore((s) => s.queue.length);
  const setCurrent = useQueueStore((s) => s.setCurrent);
  const repeatMode = useQueueStore((s) => s.repeatMode);

  useEffect(() => {
    if (!isElectronApiAvailable()) return;
    const handler = (_event: unknown, command: string, ...args: unknown[]) => {
      handleMprisCommand(command, args, {
        audioRef, playing, duration, setPlaying, setCurrent, current, queueLength,
      });
    };
    window.electron!.ipcRenderer.on('meloamp-mpris-control', handler);
    return () => {
      if (isElectronApiAvailable()) {
        window.electron!.ipcRenderer.removeListener('meloamp-mpris-control', handler);
      }
    };
  }, [audioRef, playing, duration, setPlaying, setCurrent, current, queueLength]);

  useEffect(() => {
    if (!isElectronApiAvailable()) return;
    const handler = (_event: unknown, command: string) => {
      debugLog('Player', 'Media key received:', command);
      handleMediaKeyCommand(command, {
        audioRef, playing, duration, setPlaying, setCurrent, current, queueLength, repeatMode,
      });
    };
    window.electron!.ipcRenderer.on('meloamp-media-key', handler);
    return () => {
      if (isElectronApiAvailable()) {
        window.electron!.ipcRenderer.removeListener('meloamp-media-key', handler);
      }
    };
  }, [audioRef, playing, duration, setPlaying, setCurrent, current, queueLength, repeatMode]);

  useEffect(() => {
    const handleTogglePlay = () => {
      if (playing && audioRef.current) {
        audioRef.current.pause();
        setPlaying(false);
      } else if (!playing && audioRef.current) {
        audioRef.current.play().then(() => setPlaying(true)).catch(console.error);
      }
    };
    const handleNext = () => {
      if (current < queueLength - 1) setCurrent(current + 1);
      else if (repeatMode === RepeatMode.ALL && queueLength > 0) setCurrent(0);
    };
    const handlePrev = () => {
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
      } else if (current > 0) {
        setCurrent(current - 1);
      } else if (repeatMode === RepeatMode.ALL && queueLength > 0) {
        setCurrent(queueLength - 1);
      }
    };
    window.addEventListener('meloamp-toggle-play', handleTogglePlay);
    window.addEventListener('meloamp-next-track', handleNext);
    window.addEventListener('meloamp-prev-track', handlePrev);
    return () => {
      window.removeEventListener('meloamp-toggle-play', handleTogglePlay);
      window.removeEventListener('meloamp-next-track', handleNext);
      window.removeEventListener('meloamp-prev-track', handlePrev);
    };
  }, [audioRef, playing, setPlaying, setCurrent, current, queueLength, repeatMode]);
}
