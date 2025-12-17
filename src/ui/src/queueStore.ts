import { debugLog } from './debug';
import { create } from 'zustand/react';
import { Artist, Album } from './apiModels';

export interface Song {
  id: string;
  title: string;
  artist: Artist; // Use full Artist object
  album: Album; // Add album property
  imageUrl?: string;
  url?: string;
  played?: boolean; // Add played flag
  durationMs: number; // Required for queue duration calculations
  userRating?: number; // optional per-user rating (0-5, -1 for dislike in some places)
}

export interface QueueState {
  queue: Song[];
  current: number;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setCurrent: (index: number) => void;
  updateSong: (index: number, patch: Partial<Song>) => void;
  setQueue: (songs: Song[]) => void;
  playNow: (songs: Song | Song[]) => void;
}

// Debounced persistence to avoid blocking on every state change
// This is critical for large playlists (1000+ songs)
let persistTimeout: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 1000; // Wait 1 second after last change before persisting

const debouncedPersist = (queue: Song[], current: number) => {
  if (persistTimeout) {
    clearTimeout(persistTimeout);
  }
  persistTimeout = setTimeout(() => {
    try {
      // Only store essential data to reduce storage size and serialization time
      const minimalQueue = queue.map(song => ({
        id: song.id,
        title: song.title,
        artist: { id: song.artist?.id, name: song.artist?.name, imageUrl: song.artist?.imageUrl },
        album: { id: song.album?.id, name: song.album?.name, imageUrl: song.album?.imageUrl, releaseYear: song.album?.releaseYear },
        imageUrl: song.imageUrl,
        url: song.url,
        played: song.played,
        durationMs: song.durationMs,
        userRating: song.userRating,
      }));
      localStorage.setItem('queueState', JSON.stringify({ queue: minimalQueue, current }));
      debugLog('QueueStore', `Persisted ${queue.length} songs to localStorage`);
    } catch (e) {
      console.warn('[QueueStore] Failed to persist queue:', e);
    }
  }, PERSIST_DEBOUNCE_MS);
};

// Immediate persist for critical operations (clear, playNow)
const immediatePersist = (queue: Song[], current: number) => {
  if (persistTimeout) {
    clearTimeout(persistTimeout);
    persistTimeout = null;
  }
  try {
    const minimalQueue = queue.map(song => ({
      id: song.id,
      title: song.title,
      artist: { id: song.artist?.id, name: song.artist?.name, imageUrl: song.artist?.imageUrl },
      album: { id: song.album?.id, name: song.album?.name, imageUrl: song.album?.imageUrl, releaseYear: song.album?.releaseYear },
      imageUrl: song.imageUrl,
      url: song.url,
      played: song.played,
      durationMs: song.durationMs,
      userRating: song.userRating,
    }));
    localStorage.setItem('queueState', JSON.stringify({ queue: minimalQueue, current }));
  } catch (e) {
    console.warn('[QueueStore] Failed to persist queue:', e);
  }
};

export const useQueueStore = create<QueueState>((set: any, get: any) => {
  // Load initial state from localStorage
  let initialQueue: Song[] = [];
  let initialCurrent = 0;
  try {
    const saved = JSON.parse(localStorage.getItem('queueState') || '{}');
    if (Array.isArray(saved.queue)) initialQueue = saved.queue;
    if (typeof saved.current === 'number') initialCurrent = saved.current;
  } catch {}

  const store: QueueState = {
    queue: initialQueue,
    current: initialCurrent,
    addToQueue: (song: Song) => set((state: QueueState) => {
      const newQueue = [...state.queue, song];
      debouncedPersist(newQueue, state.current);
      return { queue: newQueue };
    }),
    setQueue: (songs: Song[]) => set((state: QueueState) => {
      const newQueue = songs;
      immediatePersist(newQueue, 0);
      return { queue: newQueue, current: 0 };
    }),
    removeFromQueue: (index: number) => set((state: QueueState) => {
      const newQueue = state.queue.filter((_: Song, i: number) => i !== index);
      const newCurrent = Math.max(0, Math.min(state.current, newQueue.length - 1));
      debouncedPersist(newQueue, newCurrent);
      return { queue: newQueue, current: newCurrent };
    }),
    reorderQueue: (from: number, to: number) => set((state: QueueState) => {
      const q = [...state.queue];
      const [item] = q.splice(from, 1);
      q.splice(to, 0, item);
      debouncedPersist(q, state.current);
      return { queue: q };
    }),
    clearQueue: () => set((state: QueueState) => {
      immediatePersist([], 0);
      return { queue: [], current: 0 };
    }),
    updateSong: (index: number, patch: Partial<Song>) => set((state: QueueState) => {
      const q = [...state.queue];
      if (q[index]) {
        q[index] = { ...q[index], ...patch };
      }
      debouncedPersist(q, state.current);
      return { queue: q };
    }),
    setCurrent: (index: number) => set((state: QueueState) => {
      // Mark previous as played if moving forward
      let queue = [...state.queue];
      if (index > state.current && queue[state.current]) {
        queue[state.current] = { ...queue[state.current], played: true };
      }
      debouncedPersist(queue, index);
      return { queue, current: index };
    }),
    playNow: (songs: Song | Song[]) => {
      let newQueue: Song[];
      if (Array.isArray(songs)) {
        newQueue = songs;
      } else {
        newQueue = [songs];
      }
      debugLog('QueueStore', 'playNow called:', {
        isArray: Array.isArray(songs),
        queueLength: newQueue.length,
        firstSong: newQueue[0] ? {
          id: newQueue[0].id,
          title: newQueue[0].title,
          url: newQueue[0].url,
          hasUrl: !!newQueue[0].url
        } : null
      });
      set({ queue: newQueue, current: 0 });
      immediatePersist(newQueue, 0);
    },
  };
  return store;
});
