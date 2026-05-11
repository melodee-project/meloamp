import { useQueueStore, RepeatMode } from './queueStore';

const mockSong = (id: string, title?: string) => ({
  id,
  title: title || `Song ${id}`,
  artist: { id: 'a1', name: 'Artist 1', imageUrl: '' },
  album: { id: 'al1', name: 'Album 1', imageUrl: '' },
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
