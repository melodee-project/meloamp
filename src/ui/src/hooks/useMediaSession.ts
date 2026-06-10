import { MutableRefObject, useEffect } from 'react';
import { Song } from '../queueStore';

interface MediaSessionDeps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  playing: boolean;
  duration: number;
  progress: number;
  currentSong: Song | undefined;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
}

const SIZES = [96, 128, 192, 256, 384, 512] as const;

const extractArtistName = (song: Song | undefined): string => {
  if (!song) return '';
  if (typeof song.artist === 'object' && song.artist?.name) return song.artist.name;
  return '';
};

const extractAlbumName = (song: Song | undefined): string => {
  if (!song) return '';
  if (typeof song.album === 'object' && song.album?.name) return song.album.name;
  return '';
};

const extractArtwork = (song: Song | undefined): string => {
  if (!song) return '';
  return song.artwork
    || song.artUrl
    || (typeof song.album === 'object' && song.album?.imageUrl)
    || '';
};

export function useMediaSession({
  audioRef,
  playing,
  duration,
  progress,
  currentSong,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onStop,
  onSeek,
}: MediaSessionDeps) {
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (!currentSong) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const artworkUrl = extractArtwork(currentSong);
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || 'Unknown Track',
        artist: extractArtistName(currentSong) || 'Unknown Artist',
        album: extractAlbumName(currentSong) || '',
        artwork: artworkUrl
          ? SIZES.map((size) => ({ src: artworkUrl, sizes: `${size}x${size}`, type: 'image/png' }))
          : [],
      });
    } catch (err) {
      console.error('Failed to set media session metadata:', err);
    }
  }, [currentSong]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => { if (audioRef.current) { audioRef.current.play().then(onPlay).catch(console.error); } }],
      ['pause', () => { if (audioRef.current) { audioRef.current.pause(); onPause(); } }],
      ['previoustrack', () => onPrev()],
      ['nexttrack', () => onNext()],
      ['stop', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          onStop();
        }
      }],
      ['seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          onSeek(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        if (audioRef.current) {
          const skip = details.seekOffset || 10;
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - skip);
        }
      }],
      ['seekforward', (details) => {
        if (audioRef.current) {
          const skip = details.seekOffset || 10;
          audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + skip);
        }
      }],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.warn(`Media session action '${action}' not supported:`, err);
      }
    }

    return () => {
      for (const [action] of actionHandlers) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch { /* noop */ }
      }
    };
  }, [audioRef, duration, onNext, onPause, onPlay, onPrev, onSeek, onStop]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';

    if ('setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: audioRef.current?.playbackRate || 1,
          position: progress,
        });
      } catch { /* noop */ }
    }
  }, [audioRef, duration, playing, progress]);
}
