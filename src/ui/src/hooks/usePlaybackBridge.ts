import { MutableRefObject, useEffect } from 'react';

import { debugLog } from '../debug';

interface PlaybackBridgeDeps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onStop: () => void;
  /** Absolute seek target in seconds. */
  onSeekTo: (seconds: number) => void;
  /** Relative seek offset in seconds. */
  onSeekBy: (offsetSeconds: number) => void;
}

const isElectronApiAvailable = (): boolean =>
  typeof window !== 'undefined'
  && !!window.electron
  && !!window.electron.ipcRenderer;

type RemoteCommand = 'play' | 'pause' | 'stop' | 'next' | 'previous' | 'seek' | 'position';

/**
 * Bridges Electron IPC (MPRIS on Linux, global media keys) into the player.
 *
 * Unit contract: the main process converts D-Bus microseconds to **seconds**
 * before sending, so both `seek` (offset) and `position` (absolute) arrive in
 * seconds here. Never divide again in the renderer.
 */
export function usePlaybackBridge({
  audioRef,
  onTogglePlay,
  onNext,
  onPrevious,
  onStop,
  onSeekTo,
  onSeekBy,
}: PlaybackBridgeDeps) {
  useEffect(() => {
    if (!isElectronApiAvailable()) return;

    const handleMprisCommand = (command: RemoteCommand, args: unknown[]) => {
      switch (command) {
        case 'play':
          if (audioRef.current) {
            audioRef.current.play().catch((error) => console.error('[MPRIS] play failed:', error));
          }
          break;
        case 'pause':
          audioRef.current?.pause();
          break;
        case 'stop':
          onStop();
          break;
        case 'next':
          onNext();
          break;
        case 'previous':
          onPrevious();
          break;
        case 'seek': {
          const offsetSeconds = Number(args[0]);
          if (Number.isFinite(offsetSeconds)) onSeekBy(offsetSeconds);
          break;
        }
        case 'position': {
          const positionSeconds = Number(args[0]);
          if (Number.isFinite(positionSeconds)) onSeekTo(positionSeconds);
          break;
        }
        default:
          debugLog('PlaybackBridge', 'Ignoring unknown MPRIS command:', command);
      }
    };

    const handleMediaKeyCommand = (command: string) => {
      debugLog('PlaybackBridge', 'Media key received:', command);
      switch (command) {
        case 'playPause':
          onTogglePlay();
          break;
        case 'next':
          onNext();
          break;
        case 'previous':
          onPrevious();
          break;
        case 'stop':
          onStop();
          break;
        default:
          debugLog('PlaybackBridge', 'Ignoring unknown media key:', command);
      }
    };

    const ipc = window.electron!.ipcRenderer;
    const mprisHandler = (command: RemoteCommand, ...args: unknown[]) => {
      handleMprisCommand(command, args);
    };
    const mediaKeyHandler = (command: string) => handleMediaKeyCommand(command);

    ipc.on('meloamp-mpris-control', mprisHandler);
    ipc.on('meloamp-media-key', mediaKeyHandler);
    return () => {
      ipc.removeListener('meloamp-mpris-control', mprisHandler);
      ipc.removeListener('meloamp-media-key', mediaKeyHandler);
    };
  }, [audioRef, onNext, onPrevious, onSeekBy, onSeekTo, onStop, onTogglePlay]);
}
