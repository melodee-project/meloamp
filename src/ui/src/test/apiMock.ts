/**
 * API mocking utilities for MeloAmp UI tests
 * Uses axios-mock-adapter for deterministic API mocking
 */
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import {
  createMockUser,
  createMockArtist,
  createMockAlbum,
  createMockSong,
  createMockPlaylist,
  createMockPaginatedResponse,
  createMockStatistics,
} from './testUtils';

// Global mock instance
let mockApi: MockAdapter | null = null;

/**
 * Initialize the API mock with default handlers
 * Call this in beforeEach or at the start of test files
 */
export function setupApiMock() {
  // Clean up any existing mock
  if (mockApi) {
    mockApi.restore();
  }
  
  mockApi = new MockAdapter(api, { delayResponse: 0 });
  
  // Setup default handlers
  setupDefaultHandlers(mockApi);
  
  return mockApi;
}

/**
 * Get the current mock adapter instance
 */
export function getMockApi() {
  if (!mockApi) {
    throw new Error('API mock not initialized. Call setupApiMock() first.');
  }
  return mockApi;
}

/**
 * Clean up the API mock
 * Call this in afterEach or at the end of test files
 */
export function cleanupApiMock() {
  if (mockApi) {
    mockApi.restore();
    mockApi = null;
  }
}

/**
 * Reset the API mock to default handlers (clears custom handlers)
 */
export function resetApiMock() {
  if (mockApi) {
    mockApi.reset();
    setupDefaultHandlers(mockApi);
  }
}

/**
 * Setup default API handlers that simulate a logged-in user experience
 */
function setupDefaultHandlers(mock: MockAdapter) {
  const mockUser = createMockUser();
  const mockArtists = [
    createMockArtist({ id: 'artist-1', name: 'Artist One' }),
    createMockArtist({ id: 'artist-2', name: 'Artist Two' }),
    createMockArtist({ id: 'artist-3', name: 'Artist Three' }),
  ];
  const mockAlbums = [
    createMockAlbum({ id: 'album-1', name: 'Album One' }),
    createMockAlbum({ id: 'album-2', name: 'Album Two' }),
  ];
  const mockSongs = [
    createMockSong({ id: 'song-1', title: 'Song One' }),
    createMockSong({ id: 'song-2', title: 'Song Two' }),
  ];
  const mockPlaylists = [
    createMockPlaylist({ id: 'playlist-1', name: 'My Favorites' }),
    createMockPlaylist({ id: 'playlist-2', name: 'Road Trip Mix' }),
  ];
  const mockStats = createMockStatistics();

  // Authentication endpoints
  mock.onGet('/users/me').reply(200, mockUser);
  mock.onPost('/users/authenticate').reply(200, {
    user: mockUser,
    token: 'mock-jwt-token',
    serverVersion: 1,
  });

  // System info endpoint
  mock.onGet('/system/info').reply(200, {
    name: 'MeloAmp Server',
    description: 'Test Server',
    version: '1.1.0',
    majorVersion: 1,
    minorVersion: 1,
    patchVersion: 0,
  });

  // Statistics endpoint
  mock.onGet('/system/stats').reply(200, mockStats);

  // Artists endpoints
  mock.onGet('/artists').reply(200, createMockPaginatedResponse(mockArtists));
  mock.onGet(/\/artists\/recent/).reply(200, createMockPaginatedResponse(mockArtists));
  mock.onGet(/\/artists\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const artist = mockArtists.find(a => a.id === id) || mockArtists[0];
    return [200, artist];
  });

  // Albums endpoints
  mock.onGet('/albums').reply(200, createMockPaginatedResponse(mockAlbums));
  mock.onGet(/\/albums\/recent/).reply(200, createMockPaginatedResponse(mockAlbums));
  mock.onGet(/\/albums\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const album = mockAlbums.find(a => a.id === id) || mockAlbums[0];
    return [200, album];
  });
  mock.onGet(/\/albums\/[^/]+\/songs/).reply(200, createMockPaginatedResponse(mockSongs));

  // Songs endpoints
  mock.onGet('/songs').reply(200, createMockPaginatedResponse(mockSongs));
  mock.onGet(/\/songs\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const song = mockSongs.find(s => s.id === id) || mockSongs[0];
    return [200, song];
  });

  // Playlists endpoints
  mock.onGet('/users/playlists').reply(200, createMockPaginatedResponse(mockPlaylists));
  mock.onGet(/\/playlists\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const playlist = mockPlaylists.find(p => p.id === id) || mockPlaylists[0];
    return [200, playlist];
  });
  mock.onGet(/\/playlists\/[^/]+\/songs/).reply(200, createMockPaginatedResponse(mockSongs));
  mock.onPost('/playlists').reply(201, mockPlaylists[0]);

  // Search endpoint
  mock.onPost('/search').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    return [200, {
      meta: { totalCount: 10, pageSize: 10, currentPage: 1, totalPages: 1, hasNext: false, hasPrevious: false },
      totalCount: 10,
      artists: mockArtists,
      totalArtists: mockArtists.length,
      albums: mockAlbums,
      totalAlbums: mockAlbums.length,
      songs: mockSongs,
      totalSongs: mockSongs.length,
      playlists: mockPlaylists,
      totalPlaylists: mockPlaylists.length,
    }];
  });

  // Scrobble endpoint
  mock.onPost('/scrobble').reply(200, { success: true });
}

/**
 * Helper to mock a 401 response for testing authentication errors
 */
export function mockUnauthorized() {
  const mock = getMockApi();
  mock.onGet('/users/me').reply(401, { message: 'Unauthorized' });
}

/**
 * Helper to mock a 500 error for testing error handling
 */
export function mockServerError(endpoint: string) {
  const mock = getMockApi();
  mock.onAny(endpoint).reply(500, { message: 'Internal Server Error' });
}

/**
 * Helper to mock network error
 */
export function mockNetworkError(endpoint: string) {
  const mock = getMockApi();
  mock.onAny(endpoint).networkError();
}

/**
 * Helper to mock timeout
 */
export function mockTimeout(endpoint: string) {
  const mock = getMockApi();
  mock.onAny(endpoint).timeout();
}

export { MockAdapter };
