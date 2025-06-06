import { create } from 'zustand/react';

export interface Song {
  id: number;
  title: string;
  artist: { name: string };
  imageUrl?: string;
  url?: string;
}

export interface QueueState {
  queue: Song[];
  current: number;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setCurrent: (index: number) => void;
}

export const useQueueStore = create<QueueState>((set: any, get: any) => ({
  queue: [],
  current: 0,
  addToQueue: (song: Song) => set((state: QueueState) => ({ queue: [...state.queue, song] })),
  removeFromQueue: (index: number) => set((state: QueueState) => ({ queue: state.queue.filter((_: Song, i: number) => i !== index) })),
  reorderQueue: (from: number, to: number) => set((state: QueueState) => {
    const q = [...state.queue];
    const [item] = q.splice(from, 1);
    q.splice(to, 0, item);
    return { queue: q };
  }),
  clearQueue: () => set({ queue: [], current: 0 }),
  setCurrent: (index: number) => set({ current: index }),
}));
