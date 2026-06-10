import { MutableRefObject, useCallback, useRef } from 'react';
import { Song } from '../queueStore';
import { debugLog, debugError } from '../debug';

const MAX_RETRY_ATTEMPTS = 1;
const MAX_CONSECUTIVE_FAILURES = 3;
const RETRY_DELAY_MS = 1000;

export interface PlaybackErrorOptions {
  onError?: (messageKey: string) => void;
  translate: (key: string) => string;
}

export interface PlaybackErrorActions {
  handlePlaybackError: () => void;
  handlePlaybackSuccess: () => void;
}

export function usePlaybackErrorRecovery(
  audioRef: MutableRefObject<HTMLAudioElement | null>,
  currentSong: Song | undefined,
  current: number,
  queueLength: number,
  repeatModeAll: boolean,
  goToNext: () => void,
  goToStart: () => void,
  setPlaying: (playing: boolean) => void,
  { onError, translate }: PlaybackErrorOptions,
): PlaybackErrorActions {
  const retryCountRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);

  const handlePlaybackSuccess = useCallback(() => {
    retryCountRef.current = 0;
    consecutiveFailuresRef.current = 0;
  }, []);

  const handlePlaybackError = useCallback(() => {
    if (!currentSong) return;

    if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
      retryCountRef.current += 1;
      debugLog('Player', `Retrying playback (attempt ${retryCountRef.current})`);
      onError?.(translate('player.retrying'));
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(() => handlePlaybackError());
        }
      }, RETRY_DELAY_MS);
      return;
    }

    consecutiveFailuresRef.current += 1;
    retryCountRef.current = 0;

    if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
      debugError('Player', 'Too many consecutive failures, stopping playback');
      onError?.(translate('player.tooManyErrors'));
      setPlaying(false);
      consecutiveFailuresRef.current = 0;
      return;
    }

    debugLog('Player', 'Skipping to next track after error');
    onError?.(translate('player.skippingError'));
    if (current < queueLength - 1) goToNext();
    else if (repeatModeAll) goToStart();
    else setPlaying(false);
  }, [audioRef, consecutiveFailuresRef, current, currentSong, goToNext, goToStart, onError, queueLength, repeatModeAll, retryCountRef, setPlaying, translate]);

  return { handlePlaybackError, handlePlaybackSuccess };
}
