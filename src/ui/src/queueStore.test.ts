import { useQueueStore, RepeatMode, Song } from './queueStore';

const mockSong = (id: string, title?: string): Song => ({
  id,
  title: title || `Song ${id}`,
  artist: { id: 'a1', name: 'Artist 1', imageUrl: '', thumbnailUrl: '', userStarred: false, userRating: 0, albumCount: 0, songCount: 0, createdAt: '', updatedAt: '' } as any,
  album: { id: 'al1', name: 'Album 1', imageUrl: '', releaseYear: 0 } as any,
  durationMs: 240000,
});

describe('useQueueStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useQueueStore.setState({
      queue: [],
      current: 0,
      repeatMode: RepeatMode.OFF,
      shuffleEnabled: false,
      originalOrder: null,
      lastAction: null,
    });
  });

  test('initial state has empty queue', () => {
    const state = useQueueStore.getState();
    expect(state.queue).toEqual([]);
    expect(state.current).toBe(0);
  });

  test('addToQueue appends a song', () => {
    const song = mockSong('s1');
    useQueueStore.getState().addToQueue(song);
    const state = useQueueStore.getState();
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].id).toBe('s1');
  });

  test('addToQueueNext inserts after current', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    useQueueStore.setState({ current: 0 });
    useQueueStore.getState().addToQueueNext(mockSong('s3'));
    const q = useQueueStore.getState().queue;
    expect(q[0].id).toBe('s1');
    expect(q[1].id).toBe('s3');
    expect(q[2].id).toBe('s2');
  });

  test('removeFromQueue removes song and updates current', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    state.addToQueue(mockSong('s3'));
    useQueueStore.setState({ current: 1 });
    useQueueStore.getState().removeFromQueue(1);
    const q = useQueueStore.getState().queue;
    expect(q).toHaveLength(2);
    expect(q.map(s => s.id)).toEqual(['s1', 's3']);
    expect(useQueueStore.getState().lastAction?.type).toBe('remove');
  });

  test('reorderQueue moves items', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    state.addToQueue(mockSong('s3'));
    useQueueStore.getState().reorderQueue(0, 2);
    const q = useQueueStore.getState().queue;
    expect(q[2].id).toBe('s1');
    expect(useQueueStore.getState().lastAction?.type).toBe('reorder');
  });

  test('clearQueue empties queue and saves lastAction', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    useQueueStore.getState().clearQueue();
    const s = useQueueStore.getState();
    expect(s.queue).toHaveLength(0);
    expect(s.current).toBe(0);
    expect(s.lastAction?.type).toBe('clear');
  });

  test('undo restores removed song', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    useQueueStore.setState({ current: 0 });
    useQueueStore.getState().removeFromQueue(0);
    expect(useQueueStore.getState().queue).toHaveLength(1);
    const undone = useQueueStore.getState().undo();
    expect(undone).toBe(true);
    expect(useQueueStore.getState().queue).toHaveLength(2);
  });

  test('undo restores cleared queue', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    useQueueStore.getState().clearQueue();
    expect(useQueueStore.getState().queue).toHaveLength(0);
    const undone = useQueueStore.getState().undo();
    expect(undone).toBe(true);
    expect(useQueueStore.getState().queue).toHaveLength(2);
  });

  test('undo reverses reorder', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    useQueueStore.getState().reorderQueue(0, 1);
    const undone = useQueueStore.getState().undo();
    expect(undone).toBe(true);
    expect(useQueueStore.getState().queue[0].id).toBe('s1');
  });

  test('undo returns false when no lastAction', () => {
    const undone = useQueueStore.getState().undo();
    expect(undone).toBe(false);
  });

  test('setCurrent updates index and marks previous as played', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    useQueueStore.setState({ current: 0 });
    useQueueStore.getState().setCurrent(1);
    const s = useQueueStore.getState();
    expect(s.current).toBe(1);
    expect(s.queue[0].played).toBe(true);
  });

  test('playNow replaces queue with single song', () => {
    const song = mockSong('s1');
    useQueueStore.getState().playNow(song);
    const s = useQueueStore.getState();
    expect(s.queue).toHaveLength(1);
    expect(s.current).toBe(0);
  });

  test('playNow replaces queue with array of songs', () => {
    const songs = [mockSong('s1'), mockSong('s2')];
    useQueueStore.getState().playNow(songs);
    const s = useQueueStore.getState();
    expect(s.queue).toHaveLength(2);
    expect(s.current).toBe(0);
  });

  test('setQueue replaces queue', () => {
    const songs = [mockSong('s1'), mockSong('s2')];
    useQueueStore.getState().setQueue(songs);
    const s = useQueueStore.getState();
    expect(s.queue).toHaveLength(2);
    expect(s.current).toBe(0);
  });

  test('updateSong patches a queue item', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    useQueueStore.getState().updateSong(0, { title: 'Updated' });
    expect(useQueueStore.getState().queue[0].title).toBe('Updated');
  });

  test('updateSong does nothing for out-of-range index', () => {
    useQueueStore.getState().updateSong(999, { title: 'Nope' });
    expect(useQueueStore.getState().queue).toHaveLength(0);
  });

  test('setRepeatMode changes mode', () => {
    useQueueStore.getState().setRepeatMode(RepeatMode.ALL);
    expect(useQueueStore.getState().repeatMode).toBe(RepeatMode.ALL);
  });

  test('toggleShuffle enables shuffle', () => {
    const state = useQueueStore.getState();
    state.addToQueue(mockSong('s1'));
    state.addToQueue(mockSong('s2'));
    state.addToQueue(mockSong('s3'));
    useQueueStore.setState({ current: 0 });
    useQueueStore.getState().toggleShuffle();
    expect(useQueueStore.getState().shuffleEnabled).toBe(true);
  });

  test('toggleShuffle disables shuffle and restores order', () => {
    const songs = [mockSong('s1'), mockSong('s2'), mockSong('s3')];
    useQueueStore.getState().setQueue(songs);
    useQueueStore.getState().toggleShuffle();
    expect(useQueueStore.getState().shuffleEnabled).toBe(true);
    useQueueStore.getState().toggleShuffle();
    expect(useQueueStore.getState().shuffleEnabled).toBe(false);
  });
});

describe('useQueueStore persistence and bounds', () => {
  beforeEach(() => {
    localStorage.clear();
    useQueueStore.setState({
      queue: [],
      current: 0,
      repeatMode: RepeatMode.OFF,
      shuffleEnabled: false,
      originalOrder: null,
      lastAction: null,
    });
  });

  test('setQueue clears shuffle and persists playback settings', () => {
    useQueueStore.getState().toggleShuffle();
    useQueueStore.getState().setQueue([mockSong('s1')]);
    expect(useQueueStore.getState().shuffleEnabled).toBe(false);
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    expect(settings.shuffleEnabled).toBe(false);
  });

  test('setRepeatMode persists to userSettings without losing other keys', () => {
    localStorage.setItem('userSettings', JSON.stringify({ equalizerGains: [1, 2, 3, 4, 5, 6] }));
    useQueueStore.getState().setRepeatMode(RepeatMode.ONE);
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    expect(settings.repeatMode).toBe(RepeatMode.ONE);
    expect(settings.equalizerGains).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('reorderQueue ignores out-of-range indices', () => {
    useQueueStore.getState().setQueue([mockSong('s1'), mockSong('s2')]);
    useQueueStore.getState().reorderQueue(0, 5);
    expect(useQueueStore.getState().queue.map(s => s.id)).toEqual(['s1', 's2']);
  });

  test('reorderQueue keeps the current index pointing at the same song', () => {
    useQueueStore.getState().setQueue([mockSong('s1'), mockSong('s2'), mockSong('s3')]);
    useQueueStore.getState().setCurrent(1);
    useQueueStore.getState().reorderQueue(1, 2);
    expect(useQueueStore.getState().current).toBe(2);
    expect(useQueueStore.getState().queue[2].id).toBe('s2');
  });

  test('setCurrent clamps out-of-range indices', () => {
    useQueueStore.getState().setQueue([mockSong('s1')]);
    useQueueStore.getState().setCurrent(99);
    expect(useQueueStore.getState().current).toBe(0);
  });

  test('removeFromQueue ignores a missing index', () => {
    useQueueStore.getState().setQueue([mockSong('s1')]);
    useQueueStore.getState().removeFromQueue(10);
    expect(useQueueStore.getState().queue).toHaveLength(1);
  });

  test('queue persistence strips credentials from stream URLs', () => {
    vi.useFakeTimers();
    const song = { ...mockSong('s1'), url: 'https://api.test/stream/1?jwt=secret' };
    useQueueStore.getState().addToQueue(song);
    vi.advanceTimersByTime(1500);
    const stored = JSON.parse(localStorage.getItem('queueState') || '{}');
    expect(stored.queue[0].url).not.toContain('jwt');
    vi.useRealTimers();
  });
});

describe('queue edits and undo during shuffle', () => {
  beforeEach(() => {
    useQueueStore.getState().setQueue([]);
  });

  test('keeps additions and removals when restoring the original order', () => {
    const get = useQueueStore.getState;
    get().setQueue([mockSong('A'), mockSong('B'), mockSong('C')]);
    get().toggleShuffle();
    get().addToQueue(mockSong('D'));
    get().removeFromQueue(get().queue.findIndex(song => song.id === 'B'));
    get().toggleShuffle();
    expect(get().queue.map(song => song.id)).toEqual(['A', 'C', 'D']);
    expect(get().queue[get().current].id).toBe('A');
  });

  test('preserves play-next placement, metadata, and played flags', () => {
    const get = useQueueStore.getState;
    get().setQueue([mockSong('A'), mockSong('B'), mockSong('C')]);
    get().setCurrent(1);
    get().toggleShuffle();
    get().addToQueueNext(mockSong('D'));
    get().updateSong(0, { userStarred: true, userRating: 5 });
    get().setCurrent(1);
    get().toggleShuffle();
    expect(get().queue.map(song => song.id)).toEqual(['A', 'B', 'D', 'C']);
    expect(get().queue[1]).toMatchObject({ userStarred: true, userRating: 5, played: true });
    expect(get().queue[get().current].id).toBe('D');
  });

  test('treats repeated instances of the same song as separate queue entries', () => {
    const get = useQueueStore.getState;
    const repeated = mockSong('A');
    get().setQueue([repeated, repeated]);
    get().setCurrent(1);
    get().toggleShuffle();
    get().updateSong(0, { title: 'Second occurrence' });
    get().removeFromQueue(1);
    get().toggleShuffle();
    expect(get().queue).toHaveLength(1);
    expect(get().queue[0].title).toBe('Second occurrence');
    expect(get().current).toBe(0);
  });

  test('undo restores the sole removed song at a valid index', () => {
    const get = useQueueStore.getState;
    get().setQueue([mockSong('A')]);
    get().removeFromQueue(0);
    expect(get().undo()).toBe(true);
    expect(get().current).toBe(0);
    expect(get().queue[get().current].id).toBe('A');
  });

  test('undo removal retains the current song and the original shuffle position', () => {
    const get = useQueueStore.getState;
    get().setQueue([mockSong('A'), mockSong('B'), mockSong('C')]);
    get().toggleShuffle();
    get().removeFromQueue(get().queue.findIndex(song => song.id === 'B'));
    get().undo();
    get().toggleShuffle();
    expect(get().queue.map(song => song.id)).toEqual(['A', 'B', 'C']);
    expect(get().queue[get().current].id).toBe('A');
  });

  test('undo clear retains the original order for subsequent unshuffle', () => {
    const get = useQueueStore.getState;
    get().setQueue([mockSong('A'), mockSong('B'), mockSong('C')]);
    get().setCurrent(1);
    get().toggleShuffle();
    get().clearQueue();
    get().undo();
    get().toggleShuffle();
    expect(get().queue.map(song => song.id)).toEqual(['A', 'B', 'C']);
    expect(get().queue[get().current].id).toBe('B');
  });

  test('clearing a shuffled queue cannot resurrect old tracks after adding new ones', () => {
    const get = useQueueStore.getState;
    get().setQueue([mockSong('A')]);
    get().toggleShuffle();
    get().clearQueue();
    get().addToQueueNext(mockSong('B'));
    get().toggleShuffle();
    expect(get().queue.map(song => song.id)).toEqual(['B']);
  });

  test.each([[1, 2, 1], [0, 2, 1], [2, 0, 1], [2, 0, 2]])(
    'undo move from %s to %s retains current entry %s', (from, to, current) => {
      const get = useQueueStore.getState;
      get().setQueue([mockSong('A'), mockSong('B'), mockSong('C')]);
      get().setCurrent(current);
      const currentId = get().queue[current].id;
      get().reorderQueue(from, to);
      get().undo();
      expect(get().queue.map(song => song.id)).toEqual(['A', 'B', 'C']);
      expect(get().queue[get().current].id).toBe(currentId);
    },
  );
});
