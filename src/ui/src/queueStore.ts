import create from 'zustand';

interface Song {
  id: number;
  title: string;
  artist: { name: string };
  imageUrl?: string;
  url?: string;
}

interface QueueState {
  queue: Song[];
  current: number;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setCurrent: (index: number) => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  current: 0,
  addToQueue: (song) => set(state => ({ queue: [...state.queue, song] })),
  removeFromQueue: (index) => set(state => ({ queue: state.queue.filter((_, i) => i !== index) })),
  reorderQueue: (from, to) => set(state => {
    const q = [...state.queue];
    const [item] = q.splice(from, 1);
    q.splice(to, 0, item);
    return { queue: q };
  }),
  clearQueue: () => set({ queue: [], current: 0 }),
  setCurrent: (index) => set({ current: index }),
}));
