import React from 'react';
import { useLocation } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor, createMockSong } from '../test/testUtils';
import { cleanupApiMock, getMockApi, setupApiMock } from '../test/apiMock';
import SearchPage from './SearchPage';

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Location">{location.pathname}{location.search}</output>;
}

beforeEach(() => setupApiMock());
afterEach(() => cleanupApiMock());

const result = (title: string) => ({ artists: [], albums: [], playlists: [], songs: [createMockSong({ title })] });

test('an older response cannot replace newer search results or the URL', async () => {
  let finishOld!: (response: [number, unknown]) => void;
  getMockApi().onPost('/search').reply(config => JSON.parse(config.data).query === 'old'
    ? new Promise<[number, unknown]>(resolve => { finishOld = resolve; })
    : [200, result('New result')]);
  render(<><SearchPage /><LocationProbe /></>, { initialEntries: ['/search?q=old'] });
  await waitFor(() => expect(finishOld).toBeDefined());
  fireEvent.change(screen.getByPlaceholderText(/search artists/i), { target: { value: 'new' } });
  expect(await screen.findByText('New result')).toBeInTheDocument();
  await act(async () => { finishOld([200, result('Old result')]); });
  expect(screen.queryByText('Old result')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Location')).toHaveTextContent('/search?q=new');
});

test('clearing the page input cancels the request and removes the URL query', async () => {
  let finish!: (response: [number, unknown]) => void;
  getMockApi().onPost('/search').reply(() => new Promise<[number, unknown]>(resolve => { finish = resolve; }));
  render(<><SearchPage /><LocationProbe /></>, { initialEntries: ['/search?q=old'] });
  await waitFor(() => expect(finish).toBeDefined());
  fireEvent.change(screen.getByPlaceholderText(/search artists/i), { target: { value: '' } });
  await act(async () => { finish([200, result('Old result')]); });
  expect(screen.queryByText('Old result')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Location')).toHaveTextContent('/search');
  expect(screen.getByLabelText('Location').textContent).not.toContain('?');
});
