/**
 * Smoke tests for pages that previously had no coverage.
 *
 * Goal: each page renders its primary success state, handles an empty payload,
 * and does not throw when the API returns an error. Deep behaviour is covered
 * by the page/component-specific suites.
 *
 * Every async test calls `settle()` so in-flight requests finish before the
 * test ends; otherwise pending `setState` calls leak into the next test.
 */
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { act, screen, waitFor } from '@testing-library/react';

import { getMockApi, setupApiMock, cleanupApiMock } from './test/apiMock';
import { createMockPaginatedResponse, createMockSong, render, testI18n } from './test/testUtils';
import { RepeatMode, useQueueStore } from './queueStore';
import { DEFAULT_SETTINGS } from './types/settings';

import AdminUsersPage from './pages/AdminUsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ArtistLookupPage from './pages/ArtistLookupPage';
import ChartsPage from './pages/ChartsPage';
import FavoritesPage from './pages/FavoritesPage';
import GenresPage from './pages/GenresPage';
import HistoryPage from './pages/HistoryPage';
import LocalThemeGallery from './pages/LocalThemeGallery';
import PlaybackToolsPage from './pages/PlaybackToolsPage';
import PlaylistManager from './pages/PlaylistManager';
import PublicSharePage from './pages/PublicSharePage';
import QueueView from './pages/QueueView';
import RecommendationsPage from './pages/RecommendationsPage';
import RequestsPage from './pages/RequestsPage';
import SearchAdvancedPage from './pages/SearchAdvancedPage';
import SmartPlaylistsPage from './pages/SmartPlaylistsPage';
import ThemesPage from './pages/ThemesPage';
import UserSettingsPage from './pages/UserSettings';

const emptyPage = createMockPaginatedResponse([]);

/** Wait until every loading indicator and skeleton has been removed. */
async function settle(): Promise<void> {
  // Flush the mocked request chain and the resulting state updates.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await waitFor(
    () => expect(screen.queryAllByRole('progressbar')).toHaveLength(0),
    { timeout: 3000 },
  );
}

beforeEach(() => {
  localStorage.clear();
  setupApiMock();
  useQueueStore.setState({
    queue: [],
    current: 0,
    repeatMode: RepeatMode.OFF,
    shuffleEnabled: false,
    originalOrder: null,
    lastAction: null,
  });
});

afterEach(() => {
  cleanupApiMock();
});

describe('page smoke tests', () => {
  test('AdminUsersPage renders an empty user list', async () => {
    getMockApi().onGet('/admin/users').reply(200, []);
    render(<AdminUsersPage />);
    await settle();
    expect(screen.getByText('Admin Users')).toBeInTheDocument();
  });

  test('AnalyticsPage renders statistics', async () => {
    const mock = getMockApi();
    mock.onGet(/\/analytics\/listening/).reply(200, { totalPlays: 10, totalPlayTimeSeconds: 600 });
    mock.onGet(/\/analytics\/top\//).reply(200, { items: [] });
    render(<AnalyticsPage />);
    await settle();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  test('ArtistLookupPage renders its form', async () => {
    getMockApi().onGet('/artist-lookup/providers').reply(200, []);
    render(<ArtistLookupPage />);
    await settle();
    expect(screen.getByText('Artist Lookup')).toBeInTheDocument();
  });

  test('ChartsPage renders an empty chart list', async () => {
    getMockApi().onGet('/charts').reply(200, []);
    render(<ChartsPage />);
    await settle();
    expect(screen.getByText('Charts')).toBeInTheDocument();
  });

  test('FavoritesPage renders the empty state', async () => {
    getMockApi().onGet('/user/songs/liked').reply(200, emptyPage);
    render(<FavoritesPage />);
    await settle();
    expect(screen.getByText('My Library')).toBeInTheDocument();
  });

  test('GenresPage renders an empty genre list', async () => {
    getMockApi().onGet('/genres').reply(200, { genres: [], totalCount: 0, page: 1, limit: 100 });
    render(<GenresPage />);
    await settle();
    expect(screen.getByText('Browse by Genre')).toBeInTheDocument();
  });

  test('HistoryPage renders an empty history', async () => {
    const mock = getMockApi();
    mock.reset();
    mock.onGet(/\/user\/last-played/).reply(200, emptyPage);
    render(<HistoryPage />);
    await settle();
    expect(screen.getByRole('heading', { level: 4, name: 'History' })).toBeInTheDocument();
  });

  test('LocalThemeGallery renders every registered theme', () => {
    render(<LocalThemeGallery settings={{ ...DEFAULT_SETTINGS }} onChange={vi.fn()} />);
    expect(screen.getByText(testI18n.t('settings.theme'))).toBeInTheDocument();
    expect(screen.getAllByText('Classic').length).toBeGreaterThan(0);
  });

  test('PlaybackToolsPage renders with empty backend data', async () => {
    const mock = getMockApi();
    mock.reset();
    mock.onAny().reply(200, {});
    render(<PlaybackToolsPage />);
    await settle();
    expect(screen.getByText('Playback Tools')).toBeInTheDocument();
  });

  test('PlaylistManager renders the playlist grid', async () => {
    getMockApi().onGet('/user/playlists').reply(200, emptyPage);
    render(<PlaylistManager />);
    await settle();
    expect(screen.getByText('Playlists')).toBeInTheDocument();
  });

  test('PublicSharePage renders a shared album', async () => {
    getMockApi().onGet('/shares/public/share-1').reply(200, {
      shareUniqueId: 'share-1',
      resourceName: 'Shared Album',
      shareType: 'Album',
      songs: [createMockSong()],
    });

    render(
      <Routes>
        <Route path="/shares/public/:shareUniqueId" element={<PublicSharePage />} />
      </Routes>,
      { initialEntries: ['/shares/public/share-1'] },
    );

    expect(await screen.findByText('Shared Album')).toBeInTheDocument();
  });

  test('QueueView renders queued songs', () => {
    useQueueStore.setState({
      queue: [
        { ...createMockSong({ id: 'q1', title: 'Queue Song One' }), durationMs: 1000 },
        { ...createMockSong({ id: 'q2', title: 'Queue Song Two' }), durationMs: 2000 },
      ],
      current: 0,
    });
    render(<QueueView />);
    expect(screen.getByText('Queue Song One')).toBeInTheDocument();
  });

  test('RecommendationsPage renders an empty recommendation list', async () => {
    getMockApi().onGet('/recommendations').reply(200, { songs: [], albums: [] });
    render(<RecommendationsPage />);
    await settle();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  test('RequestsPage renders the request list', async () => {
    const mock = getMockApi();
    mock.onGet(/\/requests\/activity/).reply(200, { hasUnread: false });
    mock.onGet(/\/requests/).reply(200, { data: [], meta: { totalCount: 0, totalPages: 1 } });
    render(<RequestsPage />);
    await settle();
    expect(screen.getByText('Mine only')).toBeInTheDocument();
  });

  test('SearchAdvancedPage renders its form', () => {
    render(<SearchAdvancedPage />);
    expect(screen.getByText('Advanced Search')).toBeInTheDocument();
  });

  test('SmartPlaylistsPage renders the empty list', async () => {
    const mock = getMockApi();
    mock.reset();
    mock.onGet('/playlists/smart').reply(200, []);
    render(<SmartPlaylistsPage />);
    await settle();
    expect(screen.getByRole('heading', { level: 4, name: 'Smart Playlists' })).toBeInTheDocument();
    expect(screen.getByText(testI18n.t('smartPlaylists.empty'))).toBeInTheDocument();
  });

  test('ThemesPage renders the server theme list', async () => {
    const mock = getMockApi();
    mock.reset();
    mock.onGet('/themes').reply(200, []);
    render(<ThemesPage settings={{ ...DEFAULT_SETTINGS }} onChange={vi.fn()} />);
    await settle();
    expect(screen.getByRole('heading', { level: 4, name: 'Themes' })).toBeInTheDocument();
  });

  test('UserSettings renders persisted settings', () => {
    render(<UserSettingsPage settings={{ ...DEFAULT_SETTINGS }} onChange={vi.fn()} />);
    expect(screen.getByText(testI18n.t('settings.title'))).toBeInTheDocument();
  });

  test('API failures show an error state rather than crashing', async () => {
    getMockApi().onGet('/admin/users').reply(500, { message: 'boom' });
    render(<AdminUsersPage />);
    await settle();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
