import { useQueueStore, Song } from './queueStore';
import { Artist, Album } from './apiModels';

// Helper factory for minimal Artist and Album objects
const artist: Artist = {
  id: 'artist1',
  name: 'Artist',
  userStarred: false,
  userRating: 0,
  albumCount: 0,
  songCount: 0,
  createdAt: '',
  updatedAt: '',
} as any;

const album: Album = {
  id: 'album1',
  artist,
  name: 'Album',
  releaseYear: 2024,
  userStarred: false,
  userRating: 0,
  songCount: 0,
  durationMs: 0,
  durationFormatted: '',
  createdAt: '',
  updatedAt: '',
  genre: '',
} as any;

const makeSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist,
  album,
  durationMs: 1000,
});

beforeEach(() => {
  localStorage.clear();
  useQueueStore.setState({
    queue: [makeSong('a'), makeSong('b'), makeSong('c')],
    current: 1,
  });
});

test('reorderQueue updates current when moving item before current to after', () => {
  useQueueStore.getState().reorderQueue(0, 2);
  const state = useQueueStore.getState();
  expect(state.queue.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  expect(state.current).toBe(0);
});

test('reorderQueue updates current when moving the current item', () => {
  useQueueStore.getState().reorderQueue(1, 0);
  const state = useQueueStore.getState();
  expect(state.queue.map((s) => s.id)).toEqual(['b', 'a', 'c']);
  expect(state.current).toBe(0);
});

