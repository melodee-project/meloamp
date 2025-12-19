/**
 * Test utilities for MeloAmp UI tests
 * Provides common setup and mocking patterns for React Testing Library tests
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';

// Create a minimal i18n instance for testing
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Default test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

interface WrapperProps {
  children: React.ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

/**
 * Custom render function that wraps components with necessary providers
 */
function customRender(
  ui: ReactElement,
  { initialEntries = ['/'], ...renderOptions }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: WrapperProps) => (
    <I18nextProvider i18n={testI18n}>
      <ThemeProvider theme={testTheme}>
        <CssBaseline />
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Test data factories
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  isAdmin: false,
  isEditor: false,
  roles: [],
  songsPlayed: 100,
  artistsLiked: 10,
  artistsDisliked: 0,
  albumsLiked: 20,
  albumsDisliked: 0,
  songsLiked: 50,
  songsDisliked: 5,
  thumbnailUrl: 'https://example.com/avatar.jpg',
  imageUrl: 'https://example.com/avatar-large.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockArtist = (overrides = {}) => ({
  id: 'artist-1',
  name: 'Test Artist',
  thumbnailUrl: 'https://example.com/artist-thumb.jpg',
  imageUrl: 'https://example.com/artist.jpg',
  userStarred: false,
  userRating: 0,
  albumCount: 5,
  songCount: 50,
  biography: 'A test artist biography',
  genres: ['Rock', 'Pop'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAlbum = (overrides = {}) => ({
  id: 'album-1',
  name: 'Test Album',
  artist: createMockArtist(),
  thumbnailUrl: 'https://example.com/album-thumb.jpg',
  imageUrl: 'https://example.com/album.jpg',
  releaseYear: 2024,
  userStarred: false,
  userRating: 0,
  songCount: 12,
  durationMs: 3600000,
  durationFormatted: '1:00:00',
  description: 'A test album',
  genre: 'Rock',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockSong = (overrides = {}) => ({
  id: 'song-1',
  title: 'Test Song',
  artist: createMockArtist(),
  album: createMockAlbum(),
  streamUrl: 'https://example.com/stream/song-1',
  thumbnailUrl: 'https://example.com/song-thumb.jpg',
  imageUrl: 'https://example.com/song.jpg',
  durationMs: 240000,
  durationFormatted: '4:00',
  userStarred: false,
  userRating: 0,
  songNumber: 1,
  bitrate: 320,
  playCount: 10,
  genre: 'Rock',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPlaylist = (overrides = {}) => ({
  id: 'playlist-1',
  name: 'Test Playlist',
  description: 'A test playlist',
  thumbnailUrl: 'https://example.com/playlist-thumb.jpg',
  imageUrl: 'https://example.com/playlist.jpg',
  durationMs: 7200000,
  durationFormatted: '2:00:00',
  songCount: 30,
  isPublic: true,
  owner: createMockUser(),
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPaginatedResponse = <T,>(data: T[], page = 1, pageSize = 10) => ({
  data,
  meta: {
    totalCount: data.length,
    pageSize,
    currentPage: page,
    totalPages: Math.ceil(data.length / pageSize),
    hasNext: false,
    hasPrevious: page > 1,
  },
});

export const createMockStatistics = () => [
  { type: 'count', title: 'statistic.songsPlayed', data: '1,234', sortOrder: 1 },
  { type: 'count', title: 'statistic.artistsLiked', data: '56', sortOrder: 2 },
  { type: 'count', title: 'statistic.albumsLiked', data: '23', sortOrder: 3 },
];

/**
 * Local storage helpers for testing
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get store() { return { ...store }; },
  };
};

export const setupAuthenticatedUser = (user = createMockUser()) => {
  localStorage.setItem('jwt', 'test-jwt-token');
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('userSettings', JSON.stringify({
    theme: 'classic',
    language: 'en',
    highContrast: false,
    fontScale: 1,
    caching: false,
    mode: 'light',
  }));
};

export const clearAuthentication = () => {
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

// Re-export testing library utilities
export * from '@testing-library/react';

// Export custom render
export { customRender as render };

// Export i18n instance for tests that need to modify it
export { testI18n };
