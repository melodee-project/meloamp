import { create } from 'zustand/react';

import { Song as ApiSong } from './apiModels';
import { debugLog } from './debug';
import { readUserSettings, updateUserSettings } from './settings';
import { RepeatMode } from './types/playback';
import { stripStreamAuth } from './utils/streamUrl';

export { RepeatMode };

/**
 * A song in the playback queue.
 *
 * Derived from the API `Song` model so the two cannot drift: only the fields
 * the player needs are kept, plus player-local flags (`played`).
 */
export type Song = Pick<
  ApiSong,
  'id' | 'title' | 'durationMs'
> & {
  imageUrl?: string;
  userRating?: number;
  userStarred?: boolean;
  artist: Pick<ApiSong['artist'], 'id' | 'name' | 'imageUrl'>;
  album: Pick<ApiSong['album'], 'id' | 'name' | 'imageUrl' | 'releaseYear'>;
  /** Raw stream URL. Never contains credentials; see `utils/streamUrl.ts`. */
  url?: string;
  played?: boolean;
  artwork?: string;
  artUrl?: string;
};

export type QueueAction =
  | { type: 'remove'; index: number; song: Song; originalIndex?: number }
  | { type: 'clear'; queue: Song[]; current: number; originalOrder: Song[] | null }
  | { type: 'reorder'; from: number; to: number };

export interface QueueState {
  queue: Song[];
  current: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  originalOrder: Song[] | null;
  lastAction: QueueAction | null;
  addToQueue: (song: Song) => void;
  addToQueueNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setCurrent: (index: number) => void;
  updateSong: (index: number, patch: Partial<Song>) => void;
  setQueue: (songs: Song[]) => void;
  playNow: (songs: Song | Song[]) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  undo: () => boolean;
}

type MinimalSong = Pick<
  Song,
  'id' | 'title' | 'imageUrl' | 'url' | 'played' | 'durationMs' | 'userRating' | 'userStarred'
> & {
  artist: Pick<Song['artist'], 'id' | 'name' | 'imageUrl'>;
  album: Pick<Song['album'], 'id' | 'name' | 'imageUrl' | 'releaseYear'>;
};

interface QueuePersistState {
  queue: MinimalSong[];
  current: number;
}

const QUEUE_STORAGE_KEY = 'queueState';
const PERSIST_DEBOUNCE_MS = 1000;

let persistTimeout: ReturnType<typeof setTimeout> | null = null;

const clampCurrentIndex = (current: number, queueLength: number): number => {
  if (!Number.isInteger(current) || Number.isNaN(current)) return 0;
  if (queueLength <= 0) return 0;
  return Math.max(0, Math.min(current, queueLength - 1));
};

const currentAfterMove = (current: number, from: number, to: number): number => {
  if (current === from) return to;
  if (from < current && to >= current) return current - 1;
  if (from > current && to <= current) return current + 1;
  return current;
};

// Each queue occurrence owns a distinct object, even when the same song is
// enqueued twice. The shuffled and original orders share those identities.
const queueEntry = (song: Song): Song => ({ ...song, url: stripStreamAuth(song.url) });

const replaceOriginalEntry = (order: Song[] | null, before: Song, after: Song): Song[] | null =>
  order?.map(song => song === before ? after : song) ?? null;

const toMinimal = (queue: Song[]): MinimalSong[] => queue.map((song) => ({
  id: song.id,
  title: song.title,
  artist: { id: song.artist?.id, name: song.artist?.name, imageUrl: song.artist?.imageUrl },
  album: {
    id: song.album?.id,
    name: song.album?.name,
    imageUrl: song.album?.imageUrl,
    releaseYear: song.album?.releaseYear,
  },
  imageUrl: song.imageUrl,
  // Tokens are injected at playback time, never persisted.
  url: stripStreamAuth(song.url),
  played: song.played,
  durationMs: song.durationMs,
  userRating: song.userRating,
  userStarred: song.userStarred,
}));

function writeQueue(queue: Song[], current: number): void {
  try {
    const payload: QueuePersistState = { queue: toMinimal(queue), current };
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[QueueStore] Failed to persist queue:', error);
  }
}

function debouncedPersist(queue: Song[], current: number): void {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    writeQueue(queue, current);
  }, PERSIST_DEBOUNCE_MS);
}

function immediatePersist(queue: Song[], current: number): void {
  if (persistTimeout) {
    clearTimeout(persistTimeout);
    persistTimeout = null;
  }
  writeQueue(queue, current);
}

function persistPlaybackSettings(repeatMode: RepeatMode, shuffleEnabled: boolean): void {
  updateUserSettings({ repeatMode, shuffleEnabled });
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function loadInitialQueue(): { queue: Song[]; current: number } {
  try {
    const saved = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '{}') as Partial<QueuePersistState>;
    const queue = Array.isArray(saved.queue)
      ? (saved.queue as unknown as Song[]).map((song) => ({ ...song, url: stripStreamAuth(song.url) }))
      : [];
    const current = typeof saved.current === 'number' ? saved.current : 0;
    return { queue, current: clampCurrentIndex(current, queue.length) };
  } catch {
    return { queue: [], current: 0 };
  }
}

export const useQueueStore = create<QueueState>((set, get) => {
  const initial = loadInitialQueue();
  const settings = readUserSettings();

  return {
    queue: initial.queue,
    current: initial.current,
    repeatMode: settings.repeatMode,
    shuffleEnabled: settings.shuffleEnabled,
    originalOrder: null,
    lastAction: null,

    addToQueue: (song: Song) => {
      const { queue, current, originalOrder } = get();
      const entry = queueEntry(song);
      const newQueue = [...queue, entry];
      set({ queue: newQueue, originalOrder: originalOrder ? [...originalOrder, entry] : null });
      debouncedPersist(newQueue, current);
    },

    addToQueueNext: (song: Song) => {
      const { queue, current, originalOrder } = get();
      const entry = queueEntry(song);
      const insertIndex = clampCurrentIndex(current + 1, queue.length + 1);
      const newQueue = [...queue];
      newQueue.splice(insertIndex, 0, entry);
      const newOriginal = originalOrder ? [...originalOrder] : null;
      if (newOriginal) newOriginal.splice(newOriginal.indexOf(queue[current]) + 1, 0, entry);
      set({ queue: newQueue, originalOrder: newOriginal, lastAction: null });
      debouncedPersist(newQueue, current);
      debugLog('QueueStore', 'addToQueueNext: inserted at index', insertIndex);
    },

    setQueue: (songs: Song[]) => {
      const entries = songs.map(queueEntry);
      set({
        queue: entries,
        current: 0,
        originalOrder: null,
        shuffleEnabled: false,
        lastAction: null,
      });
      immediatePersist(entries, 0);
      persistPlaybackSettings(get().repeatMode, false);
    },

    removeFromQueue: (index: number) => {
      const { queue, current, originalOrder } = get();
      const removedSong = queue[index];
      if (!removedSong) return;

      const newQueue = queue.filter((_, i) => i !== index);
      const newCurrent = index < current
        ? current - 1
        : Math.min(current, newQueue.length - 1);

      set({
        queue: newQueue,
        originalOrder: originalOrder?.filter(song => song !== removedSong) ?? null,
        current: Math.max(0, newCurrent),
        lastAction: { type: 'remove', index, song: removedSong, originalIndex: originalOrder?.indexOf(removedSong) },
      });
      debouncedPersist(newQueue, Math.max(0, newCurrent));
    },

    reorderQueue: (from: number, to: number) => {
      const { queue, current } = get();
      if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;

      const newQueue = [...queue];
      const [item] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, item);

      const newCurrent = currentAfterMove(current, from, to);

      set({ queue: newQueue, current: newCurrent, lastAction: { type: 'reorder', from, to } });
      debouncedPersist(newQueue, newCurrent);
    },

    clearQueue: () => {
      const { queue, current, originalOrder, shuffleEnabled } = get();
      set({
        queue: [],
        current: 0,
        originalOrder: shuffleEnabled ? [] : null,
        lastAction: { type: 'clear', queue: [...queue], current, originalOrder },
      });
      immediatePersist([], 0);
    },

    updateSong: (index: number, patch: Partial<Song>) => {
      const { queue, current, originalOrder } = get();
      if (!queue[index]) return;
      const newQueue = [...queue];
      newQueue[index] = queueEntry({ ...newQueue[index], ...patch });
      set({ queue: newQueue, originalOrder: replaceOriginalEntry(originalOrder, queue[index], newQueue[index]) });
      debouncedPersist(newQueue, current);
    },

    setCurrent: (index: number) => {
      const { queue, current, originalOrder } = get();
      const safeIndex = clampCurrentIndex(index, queue.length);
      const newQueue = [...queue];
      if (safeIndex > current && newQueue[current]) {
        newQueue[current] = { ...newQueue[current], played: true };
      }
      set({
        queue: newQueue,
        current: safeIndex,
        originalOrder: queue[current] ? replaceOriginalEntry(originalOrder, queue[current], newQueue[current]) : originalOrder,
      });
      debouncedPersist(newQueue, safeIndex);
    },

    playNow: (songs: Song | Song[]) => {
      const newQueue = (Array.isArray(songs) ? songs : [songs]).map(queueEntry);
      set({
        queue: newQueue,
        current: 0,
        originalOrder: null,
        shuffleEnabled: false,
        lastAction: null,
      });
      immediatePersist(newQueue, 0);
      persistPlaybackSettings(get().repeatMode, false);
      debugLog('QueueStore', 'playNow called:', {
        isArray: Array.isArray(songs),
        queueLength: newQueue.length,
        firstSong: newQueue[0] ? { id: newQueue[0].id, title: newQueue[0].title, hasUrl: !!newQueue[0].url } : null,
      });
    },

    setRepeatMode: (mode: RepeatMode) => {
      set({ repeatMode: mode });
      persistPlaybackSettings(mode, get().shuffleEnabled);
      debugLog('QueueStore', 'Repeat mode changed:', mode);
    },

    toggleShuffle: () => {
      const { queue, current, shuffleEnabled, originalOrder } = get();
      const nextShuffleEnabled = !shuffleEnabled;

      if (nextShuffleEnabled) {
        const currentSong = queue[current];
        const original = [...queue];

        // Keep the current song at index 0 so playback is uninterrupted.
        const others = queue.filter((_, index) => index !== current);
        const newQueue = currentSong ? [currentSong, ...shuffleArray(others)] : shuffleArray(others);

        set({
          queue: newQueue,
          current: 0,
          shuffleEnabled: true,
          originalOrder: original,
          lastAction: null,
        });
        persistPlaybackSettings(get().repeatMode, true);
        debouncedPersist(newQueue, 0);
        debugLog('QueueStore', 'Shuffle enabled, current song kept at position 0');
        return;
      }

      const restored = originalOrder ?? queue;
      const currentSong = queue[current];
      // Track the current song by object identity first (unique), then by id.
      const restoredIndex = currentSong
        ? restored.findIndex((song) => song === currentSong)
        : -1;
      const byIdIndex = currentSong ? restored.findIndex((song) => song.id === currentSong.id) : -1;
      const newCurrent = restoredIndex >= 0 ? restoredIndex : byIdIndex;

      set({
        queue: restored,
        current: Math.max(0, newCurrent),
        shuffleEnabled: false,
        originalOrder: null,
        lastAction: null,
      });
      persistPlaybackSettings(get().repeatMode, false);
      debouncedPersist(restored, Math.max(0, newCurrent));
      debugLog('QueueStore', 'Shuffle disabled, restored original order');
    },

    undo: () => {
      const state = get();
      const { lastAction } = state;
      if (!lastAction) {
        debugLog('QueueStore', 'undo: no action to undo');
        return false;
      }

      switch (lastAction.type) {
        case 'remove': {
          const newQueue = [...state.queue];
          newQueue.splice(lastAction.index, 0, lastAction.song);
          const currentSong = state.queue[state.current];
          const newCurrent = clampCurrentIndex(currentSong ? newQueue.indexOf(currentSong) : lastAction.index, newQueue.length);
          const originalOrder = state.originalOrder ? [...state.originalOrder] : null;
          originalOrder?.splice(lastAction.originalIndex ?? originalOrder.length, 0, lastAction.song);
          set({ queue: newQueue, current: newCurrent, originalOrder, lastAction: null });
          debouncedPersist(newQueue, newCurrent);
          return true;
        }
        case 'clear': {
          set({ queue: lastAction.queue, current: lastAction.current, originalOrder: lastAction.originalOrder, lastAction: null });
          debouncedPersist(lastAction.queue, lastAction.current);
          return true;
        }
        case 'reorder': {
          const newQueue = [...state.queue];
          const [item] = newQueue.splice(lastAction.to, 1);
          newQueue.splice(lastAction.from, 0, item);
          const newCurrent = currentAfterMove(state.current, lastAction.to, lastAction.from);
          set({ queue: newQueue, current: newCurrent, lastAction: null });
          debouncedPersist(newQueue, newCurrent);
          return true;
        }
        default:
          return false;
      }
    },
  };
});
