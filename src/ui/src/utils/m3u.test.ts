import { parseM3u, serializeM3u } from './m3u';
import { createMockSong } from '../test/testUtils';

test('exports valid M3U and round-trips IDs, metadata and repeated tracks without JWTs', () => {
  const song = createMockSong({ streamUrl: 'https://host/stream/song-1?jwt=secret&format=mp3' });
  const content = serializeM3u('Mix\nname', [song, song]);
  expect(content).toMatch(/^#EXTM3U\n#PLAYLIST:Mix name\n/);
  expect(content).toContain('#EXTINF:240,Test Artist - Test Song');
  expect(content).not.toContain('secret');
  expect(parseM3u(content)).toEqual([expect.objectContaining({ songId: song.id, artist: 'Test Artist', title: 'Test Song', album: 'Test Album' }), expect.objectContaining({ songId: song.id })]);
});

test('exports IDs and titles for tracks without a stream, artist, album or duration', () => {
  const song = createMockSong({ streamUrl: '', artist: null, album: null, durationMs: 0 });
  const content = serializeM3u('Mix', [song]);
  expect(content).toContain('meloamp:song:song-1');
  expect(parseM3u(content)[0]).toMatchObject({ title: 'Test Song', songId: song.id });
});

test('parses BOM, CRLF, whitespace, metadata, album, IDs and repeated entries', () => {
  const entries = parseM3u('\uFEFF#EXTM3U\r\n #EXTINF:120,Artist - Title\r\n#EXTALB:Album\r\n#MELOAMP-SONG-ID:s1\r\nhttps://host/stream/s1\r\n\r\n#EXTINF:120,Title\r\n# Song ID: s1\r\n');
  expect(entries).toEqual([
    { reference: 'https://host/stream/s1', songId: 's1', artist: 'Artist', title: 'Title', album: 'Album' },
    { reference: '# Song ID: s1', songId: 's1', title: 'Title' },
  ]);
});

test.each([
  ['https://host/song/stream/s1/user/token', 's1'],
  ['https://host/songs/s1/stream', 's1'],
  ['/stream/song%201', 'song 1'],
  ['https://host/play?songId=s1', 's1'],
  ['https://host/play?songApiKey=s1', 's1'],
  ['meloamp:song:s1', 's1'],
  ['https://host/stream/%xx', undefined],
  ['http://[invalid', undefined],
  ['https://host/unknown', undefined],
])('extracts library IDs from %s', (reference, songId) => {
  expect(parseM3u(reference)[0].songId).toBe(songId);
});

test('parses plain media filenames and Windows paths', () => {
  expect(parseM3u('Music/Artist - Title.FLAC\rC:\\Music\\Other.mp3\n')).toEqual([
    { reference: 'Music/Artist - Title.FLAC', songId: undefined, artist: 'Artist', title: 'Title' },
    { reference: 'C:\\Music\\Other.mp3', songId: undefined, title: 'Other' },
  ]);
});

test('does not carry metadata forward to later entries', () => {
  const entries = parseM3u('#EXTINF:1,Artist - Title\nfirst.mp3\nsecond.mp3');
  expect(entries[1]).toMatchObject({ title: 'second' });
  expect(entries[1].artist).toBeUndefined();
});

test('ignores comments, empty input and metadata without a media entry', () => {
  expect(parseM3u('')).toEqual([]);
  expect(parseM3u('#EXTM3U\n#comment\n#EXTINF:1,Unfinished')).toEqual([]);
});
