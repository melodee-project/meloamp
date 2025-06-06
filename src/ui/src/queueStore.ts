import { create } from 'zustand/react';

export interface Song {
  id: string;
  title: string;
  artist: { name: string };
  imageUrl?: string;
  url?: string;
  played?: boolean; // Add played flag
}

export interface QueueState {
  queue: Song[];
  current: number;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setCurrent: (index: number) => void;
  playNow: (songs: Song | Song[]) => void;
}

export const useQueueStore = create<QueueState>((set: any, get: any) => {
  // Load initial state from localStorage
  let initialQueue: Song[] = [];
  let initialCurrent = 0;
  try {
    const saved = JSON.parse(localStorage.getItem('queueState') || '{}');
    if (Array.isArray(saved.queue)) initialQueue = saved.queue;
    if (typeof saved.current === 'number') initialCurrent = saved.current;
  } catch {}

  // Subscribe to changes and persist to localStorage
  const persist = (queue: Song[], current: number) => {
    localStorage.setItem('queueState', JSON.stringify({ queue, current }));
  };

  const store: QueueState = {
    queue: initialQueue,
    current: initialCurrent,
    addToQueue: (song: Song) => set((state: QueueState) => {
      const newQueue = [...state.queue, song];
      persist(newQueue, state.current);
      return { queue: newQueue };
    }),
    removeFromQueue: (index: number) => set((state: QueueState) => {
      const newQueue = state.queue.filter((_: Song, i: number) => i !== index);
      const newCurrent = Math.max(0, Math.min(state.current, newQueue.length - 1));
      persist(newQueue, newCurrent);
      return { queue: newQueue, current: newCurrent };
    }),
    reorderQueue: (from: number, to: number) => set((state: QueueState) => {
      const q = [...state.queue];
      const [item] = q.splice(from, 1);
      q.splice(to, 0, item);
      persist(q, state.current);
      return { queue: q };
    }),
    clearQueue: () => set((state: QueueState) => {
      persist([], 0);
      return { queue: [], current: 0 };
    }),
    setCurrent: (index: number) => set((state: QueueState) => {
      // Mark previous as played if moving forward
      let queue = [...state.queue];
      if (index > state.current && queue[state.current]) {
        queue[state.current] = { ...queue[state.current], played: true };
      }
      persist(queue, index);
      return { queue, current: index };
    }),
    playNow: (songs: Song | Song[]) => {
      let newQueue: Song[];
      if (Array.isArray(songs)) {
        newQueue = songs;
      } else {
        newQueue = [songs];
      }
      set({ queue: newQueue, current: 0 });
      persist(newQueue, 0);
    },
  };
  return store;
});
