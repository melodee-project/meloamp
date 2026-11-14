import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '../test/testUtils';
import { createMockPaginatedResponse, createMockSong } from '../test/testUtils';
import { cleanupApiMock, getMockApi, setupApiMock } from '../test/apiMock';
import PlaylistManager from './PlaylistManager';

beforeEach(() => {
  setupApiMock();
  getMockApi().reset();
  getMockApi().onPost('/playlists').reply(201, { id: 'imported' });
  getMockApi().onGet('/user/playlists').reply(200, createMockPaginatedResponse([]));
});
afterEach(() => cleanupApiMock());

async function selectImport(content: string, name = 'Mix.M3U8') {
  render(<PlaylistManager />);
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Import M3U' }));
  const file = new File([content], name, { type: 'audio/x-mpegurl' });
  Object.defineProperty(file, 'text', { value: async () => content });
  fireEvent.change(screen.getByLabelText('Select M3U File'), { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Import' }));
}

test('imports matched songs and shows a persistent summary of unmatched entries', async () => {
  const mock = getMockApi();
  mock.onGet('/songs/known').reply(200, createMockSong({ id: 'known' }));
  mock.onPost('/search').reply(200, { songs: [] });
  await selectImport('#EXTM3U\n#MELOAMP-SONG-ID:known\n/stream/known\n#EXTINF:1,Artist - Missing\nmissing.mp3');
  const dialog = screen.getByRole('dialog');
  expect(await within(dialog).findByText('Matched 1 of 2 songs; 1 unmatched.')).toBeInTheDocument();
  expect(within(dialog).getByText('Artist - Missing')).toBeInTheDocument();
  expect(JSON.parse(mock.history.post.find(config => config.url === '/playlists')!.data)).toMatchObject({ name: 'Mix', songIds: ['known'] });
  expect(within(dialog).getByRole('button', { name: 'Import' })).toBeDisabled();
});

test('does not create an empty playlist when no entries match', async () => {
  getMockApi().onPost('/search').reply(200, { songs: [] });
  await selectImport('#EXTINF:1,Missing\nmissing.mp3');
  expect(await screen.findByText('No matching songs were found. No playlist was created.')).toBeInTheDocument();
  expect(getMockApi().history.post.filter(config => config.url === '/playlists')).toHaveLength(0);
});

test('reports empty files and request failures without creating a playlist', async () => {
  await selectImport('#EXTM3U\n');
  expect(await screen.findByText('Invalid M3U file')).toBeInTheDocument();
  expect(getMockApi().history.post).toHaveLength(0);
});

test('retains the import dialog when creating the playlist fails', async () => {
  getMockApi().onGet('/songs/known').reply(200, createMockSong({ id: 'known' }));
  getMockApi().onPost('/playlists').reply(500, { message: 'Unavailable' });
  await selectImport('meloamp:song:known');
  expect(await screen.findByText('Unavailable')).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled();
});
