import { MutableRefObject, useEffect, useRef } from 'react';
import { useQueueStore } from '../queueStore';
import api from '../api';
import { ScrobbleRequest, ScrobbleType } from '../apiModels';
import { debugLog, debugError, isDebugEnabled } from '../debug';

const SCROBBLE_INTERVAL_MS = 2000;
const NOW_PLAYING_THRESHOLD_SECONDS = 10;
const PLAYED_THRESHOLD_RATIO = 0.7;

interface ScrobbleDeps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  progressRef: MutableRefObject<number>;
}

export function useScrobble({ audioRef, progressRef }: ScrobbleDeps) {
  const currentSong = useQueueStore((state) => {
    const queue = state.queue;
    return queue[state.current];
  });
  const stateRef = useRef({ scrobbled: false, scrobbledPlayed: false, lastSongId: '' });

  useEffect(() => {
    if (!currentSong) return;

    const songId = currentSong.id;
    if (stateRef.current.lastSongId !== songId) {
      stateRef.current = { scrobbled: false, scrobbledPlayed: false, lastSongId: songId };
    }

    const interval = setInterval(() => {
      if (!audioRef.current) return;
      if (stateRef.current.scrobbled && stateRef.current.scrobbledPlayed) return;

      const currentProgress = progressRef.current;
      const currentDuration = audioRef.current.duration || 0;

      if (isDebugEnabled()) {
        debugLog('Player', `Scrobble check: progress=${currentProgress.toFixed(2)}s, duration=${currentDuration.toFixed(2)}s`);
      }

      const baseScrobble: Omit<ScrobbleRequest, 'scrobbleType'> = {
        songId: currentSong.id,
        playerName: 'MeloAmp',
        timestamp: Date.now(),
        playedDuration: Math.floor(currentProgress * 1000),
      };

      if (!stateRef.current.scrobbled && currentProgress > NOW_PLAYING_THRESHOLD_SECONDS) {
        stateRef.current.scrobbled = true;
        const nowPlayingScrobble = { ...baseScrobble, scrobbleType: ScrobbleType.NOW_PLAYING } as ScrobbleRequest;
        debugLog('Player', 'Sending NOW_PLAYING scrobble:', nowPlayingScrobble);
        api.post('/scrobble', nowPlayingScrobble)
          .then(() => debugLog('Player', 'NOW_PLAYING scrobble sent successfully'))
          .catch((error) => debugError('Player', 'Failed to send NOW_PLAYING scrobble:', error));
      }

      const playedThreshold = currentDuration * PLAYED_THRESHOLD_RATIO;
      if (!stateRef.current.scrobbledPlayed && currentDuration > 0 && currentProgress > playedThreshold) {
        stateRef.current.scrobbledPlayed = true;
        const playedScrobble = { ...baseScrobble, scrobbleType: ScrobbleType.PLAYED } as ScrobbleRequest;
        debugLog('Player', `Sending PLAYED scrobble (progress: ${currentProgress.toFixed(2)}s > threshold: ${playedThreshold.toFixed(2)}s)`);
        api.post('/scrobble', playedScrobble)
          .then(() => debugLog('Player', 'PLAYED scrobble sent successfully'))
          .catch((error) => debugError('Player', 'Failed to send PLAYED scrobble:', error));
      }
    }, SCROBBLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [currentSong, audioRef, progressRef]);
}
