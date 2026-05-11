import { toQueueSong } from './toQueueSong';
import { createMockSong } from '../test/testUtils';

describe('toQueueSong', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('converts API song to queue song', () => {
    const apiSong = createMockSong({ id: 's1', title: 'Test', streamUrl: '/stream/s1' });
    const result = toQueueSong(apiSong);
    expect(result.id).toBe('s1');
    expect(result.title).toBe('Test');
    expect(result.url).toContain('/stream/s1');
  });

  test('appends JWT to stream URL when jwt is present', () => {
    localStorage.setItem('jwt', 'my-token');
    const apiSong = createMockSong({ streamUrl: '/stream/s1' });
    const result = toQueueSong(apiSong);
    expect(result.url).toContain('jwt=my-token');
  });

  test('handles missing artist gracefully', () => {
    const apiSong = createMockSong({ artist: null as any });
    const result = toQueueSong(apiSong);
    expect(result.artist.name).toBe('Unknown Artist');
  });

  test('handles missing album gracefully', () => {
    const apiSong = createMockSong({ album: null as any });
    const result = toQueueSong(apiSong);
    expect(result.album.name).toBe('Unknown Album');
  });

  test('handles empty stream URL', () => {
    const apiSong = createMockSong({ streamUrl: '' });
    const result = toQueueSong(apiSong);
    expect(result.url).toBe('');
  });

  test('preserves imageUrl, userStarred, userRating', () => {
    const apiSong = createMockSong({ userStarred: true, userRating: 5 });
    const result = toQueueSong(apiSong);
    expect(result.imageUrl).toBeTruthy();
    expect(result.userStarred).toBe(true);
    expect(result.userRating).toBe(5);
  });
});
