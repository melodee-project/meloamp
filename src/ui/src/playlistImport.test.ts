import { matchPlaylistEntries } from './playlistImport';
import { setupApiMock, cleanupApiMock, getMockApi } from './test/apiMock';
import { createMockSong } from './test/testUtils';

beforeEach(() => {
  setupApiMock();
  getMockApi().reset();
});
afterEach(() => cleanupApiMock());

test('resolves IDs without fetching stream URLs and preserves repeated entries', async () => {
  getMockApi().onGet('/songs/s1').reply(200, { data: createMockSong({ id: 's1' }) });
  const entry = { reference: 'https://external.invalid/stream', songId: 's1' };
  expect(await matchPlaylistEntries([entry, entry])).toEqual({ songIds: ['s1', 's1'], unmatched: [] });
  expect(getMockApi().history.get).toHaveLength(1);
});

test('falls back from a missing ID to normalized artist/title/album matching', async () => {
  const mock = getMockApi();
  mock.onGet('/songs/old').reply(404);
  mock.onPost('/search').reply(200, { data: {
    totalSongs: 2,
    songs: [createMockSong({ id: 'wrong', title: 'Title' }), createMockSong({ id: 'right', title: ' Title ', artist: { name: 'Artist' }, album: { name: 'Album' } })],
  } });
  const result = await matchPlaylistEntries([{ reference: '/old', songId: 'old', title: 'TITLE', artist: 'artist', album: 'album' }]);
  expect(result.songIds).toEqual(['right']);
});

test('paginates search results and ignores ambiguous recordings', async () => {
  const mock = getMockApi();
  mock.onPost('/search').reply(config => {
    const { songPage } = JSON.parse(config.data);
    return [200, {
      totalSongs: 101,
      songs: songPage === 1
        ? Array.from({ length: 100 }, (_, i) => createMockSong({ id: `other-${i}`, title: `Other ${i}` }))
        : [createMockSong({ id: 'found', title: 'Wanted' })],
    }];
  });
  expect((await matchPlaylistEntries([{ reference: 'file', title: 'Wanted' }])).songIds).toEqual(['found']);
  expect(mock.history.post).toHaveLength(2);
  mock.onPost('/search').reply(200, { songs: [createMockSong({ id: 'a' }), createMockSong({ id: 'b' })] });
  const ambiguous = { reference: 'file', title: 'Test Song' };
  expect((await matchPlaylistEntries([ambiguous])).unmatched).toEqual([ambiguous]);
});

test('reports missing references and mismatched IDs without choosing arbitrary songs', async () => {
  const mock = getMockApi();
  mock.onGet('/songs/missing').reply(200, createMockSong());
  mock.onPost('/search').reply(200, { songs: [] });
  const entries = [{ reference: 'file' }, { reference: 'missing', songId: 'missing' }, { reference: 'file', title: 'Missing' }];
  expect(await matchPlaylistEntries(entries)).toEqual({ songIds: [], unmatched: entries });
});

test('propagates server failures instead of treating them as unmatched songs', async () => {
  const mock = getMockApi();
  mock.onGet('/songs/s1').reply(500);
  await expect(matchPlaylistEntries([{ reference: 'file', songId: 's1' }])).rejects.toThrow();
  mock.onPost('/search').networkError();
  await expect(matchPlaylistEntries([{ reference: 'file', title: 'Title' }])).rejects.toThrow();
});
