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

// Repeat mode enum
export enum RepeatMode {
  OFF = 'off',
  ALL = 'all',
  ONE = 'one',
}

// Action types for undo functionality
export type QueueAction = 
  | { type: 'remove'; index: number; song: Song }
  | { type: 'clear'; queue: Song[]; current: number }
  | { type: 'reorder'; from: number; to: number };

export interface QueueState {
  queue: Song[];
  current: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  originalOrder: Song[] | null; // Stores original order when shuffle is enabled
  lastAction: QueueAction | null; // For undo functionality
  addToQueue: (song: Song) => void;
  addToQueueNext: (song: Song) => void; // Insert after current (Play Next)
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setCurrent: (index: number) => void;
  updateSong: (index: number, patch: Partial<Song>) => void;
  setQueue: (songs: Song[]) => void;
  playNow: (songs: Song | Song[]) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  undo: () => boolean; // Returns true if undo was successful
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

// Persist playback settings (repeat, shuffle) separately from queue
const persistPlaybackSettings = (repeatMode: RepeatMode, shuffleEnabled: boolean) => {
  try {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    settings.repeatMode = repeatMode;
    settings.shuffleEnabled = shuffleEnabled;
    localStorage.setItem('userSettings', JSON.stringify(settings));
  } catch (e) {
    console.warn('[QueueStore] Failed to persist playback settings:', e);
  }
};

// Load playback settings from userSettings
const loadPlaybackSettings = (): { repeatMode: RepeatMode; shuffleEnabled: boolean } => {
  try {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    return {
      repeatMode: settings.repeatMode || RepeatMode.OFF,
      shuffleEnabled: settings.shuffleEnabled || false,
    };
  } catch {
    return { repeatMode: RepeatMode.OFF, shuffleEnabled: false };
  }
};

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

  // Load playback settings
  const playbackSettings = loadPlaybackSettings();

  const store: QueueState = {
    queue: initialQueue,
    current: initialCurrent,
    repeatMode: playbackSettings.repeatMode,
    shuffleEnabled: playbackSettings.shuffleEnabled,
    originalOrder: null,
    lastAction: null,
    addToQueue: (song: Song) => set((state: QueueState) => {
      const newQueue = [...state.queue, song];
      debouncedPersist(newQueue, state.current);
      return { queue: newQueue };
    }),
    addToQueueNext: (song: Song) => set((state: QueueState) => {
      // Insert after current position
      const insertIndex = state.current + 1;
      const newQueue = [...state.queue];
      newQueue.splice(insertIndex, 0, song);
      debouncedPersist(newQueue, state.current);
      debugLog('QueueStore', 'addToQueueNext: inserted at index', insertIndex);
      return { queue: newQueue };
    }),
    setQueue: (songs: Song[]) => set((state: QueueState) => {
      const newQueue = songs;
      immediatePersist(newQueue, 0);
      // Clear shuffle state when setting new queue
      return { queue: newQueue, current: 0, originalOrder: null, shuffleEnabled: false, lastAction: null };
    }),
    removeFromQueue: (index: number) => set((state: QueueState) => {
      // Save for undo
      const removedSong = state.queue[index];
      const lastAction: QueueAction = { type: 'remove', index, song: removedSong };
      
      const newQueue = state.queue.filter((_: Song, i: number) => i !== index);
      const newCurrent = index < state.current 
        ? state.current - 1 
        : Math.min(state.current, newQueue.length - 1);
      debouncedPersist(newQueue, Math.max(0, newCurrent));
      return { queue: newQueue, current: Math.max(0, newCurrent), lastAction };
    }),
    reorderQueue: (from: number, to: number) => set((state: QueueState) => {
      const q = [...state.queue];
      const [item] = q.splice(from, 1);
      q.splice(to, 0, item);
      debouncedPersist(q, state.current);
      return { queue: q, lastAction: { type: 'reorder', from, to } as QueueAction };
    }),
    clearQueue: () => set((state: QueueState) => {
      // Save for undo
      const lastAction: QueueAction = { type: 'clear', queue: [...state.queue], current: state.current };
      immediatePersist([], 0);
      return { queue: [], current: 0, originalOrder: null, lastAction };
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
      set({ queue: newQueue, current: 0, originalOrder: null, shuffleEnabled: false, lastAction: null });
      immediatePersist(newQueue, 0);
    },
    setRepeatMode: (mode: RepeatMode) => set((state: QueueState) => {
      persistPlaybackSettings(mode, state.shuffleEnabled);
      debugLog('QueueStore', 'Repeat mode changed:', mode);
      return { repeatMode: mode };
    }),
    undo: () => {
      const state = get();
      const { lastAction } = state;
      
      if (!lastAction) {
        debugLog('QueueStore', 'undo: no action to undo');
        return false;
      }
      
      switch (lastAction.type) {
        case 'remove': {
          // Restore the removed song at its original index
          const newQueue = [...state.queue];
          newQueue.splice(lastAction.index, 0, lastAction.song);
          const newCurrent = lastAction.index <= state.current ? state.current + 1 : state.current;
          debouncedPersist(newQueue, newCurrent);
          set({ queue: newQueue, current: newCurrent, lastAction: null });
          debugLog('QueueStore', 'undo: restored removed song at index', lastAction.index);
          return true;
        }
        case 'clear': {
          // Restore the entire queue
          debouncedPersist(lastAction.queue, lastAction.current);
          set({ queue: lastAction.queue, current: lastAction.current, lastAction: null });
          debugLog('QueueStore', 'undo: restored cleared queue with', lastAction.queue.length, 'songs');
          return true;
        }
        case 'reorder': {
          // Reverse the reorder
          const q = [...state.queue];
          const [item] = q.splice(lastAction.to, 1);
          q.splice(lastAction.from, 0, item);
          debouncedPersist(q, state.current);
          set({ queue: q, lastAction: null });
          debugLog('QueueStore', 'undo: reversed reorder from', lastAction.to, 'to', lastAction.from);
          return true;
        }
        default:
          return false;
      }
    },
    toggleShuffle: () => set((state: QueueState) => {
      const newShuffleEnabled = !state.shuffleEnabled;
      
      if (newShuffleEnabled) {
        // Turning shuffle ON: save original order and shuffle
        const currentSong = state.queue[state.current];
        const originalOrder = [...state.queue];
        
        // Remove current song, shuffle the rest, put current song at front
        const otherSongs = state.queue.filter((_, i) => i !== state.current);
        const shuffledOthers = shuffleArray(otherSongs);
        const newQueue = currentSong ? [currentSong, ...shuffledOthers] : shuffledOthers;
        
        debouncedPersist(newQueue, 0);
        persistPlaybackSettings(state.repeatMode, true);
        debugLog('QueueStore', 'Shuffle enabled, current song kept at position 0');
        
        return {
          queue: newQueue,
          current: 0,
          shuffleEnabled: true,
          originalOrder,
        };
      } else {
        // Turning shuffle OFF: restore original order if available
        if (state.originalOrder && state.originalOrder.length > 0) {
          const currentSong = state.queue[state.current];
          const newCurrent = currentSong 
            ? state.originalOrder.findIndex(s => s.id === currentSong.id)
            : 0;
          
          debouncedPersist(state.originalOrder, Math.max(0, newCurrent));
          persistPlaybackSettings(state.repeatMode, false);
          debugLog('QueueStore', 'Shuffle disabled, restored original order');
          
          return {
            queue: state.originalOrder,
            current: Math.max(0, newCurrent),
            shuffleEnabled: false,
            originalOrder: null,
          };
        }
        
        // No original order to restore
        persistPlaybackSettings(state.repeatMode, false);
        return { shuffleEnabled: false, originalOrder: null };
      }
    }),
  };
  return store;
});
