import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, createTheme } from '@mui/material';
import PlaylistDetailView from './PlaylistDetailView';
import { setupApiMock, cleanupApiMock } from '../test/apiMock';
import { testI18n } from '../test/testUtils';

const theme = createTheme({ palette: { mode: 'light' } });

const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => render(
  <I18nextProvider i18n={testI18n}>
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/playlists/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  </I18nextProvider>
);

describe('PlaylistDetailView', () => {
  beforeEach(() => {
    setupApiMock();
  });

  afterEach(() => {
    cleanupApiMock();
  });

  test('shows loading state initially', () => {
    renderWithProviders(<PlaylistDetailView />, { route: '/playlists/playlist-1' });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows playlist name after loading', async () => {
    renderWithProviders(<PlaylistDetailView />, { route: '/playlists/playlist-1' });
    await waitFor(() => {
      expect(screen.getByText('My Favorites')).toBeInTheDocument();
    });
  });

  test('displays songs section after loading', async () => {
    renderWithProviders(<PlaylistDetailView />, { route: '/playlists/playlist-1' });
    await waitFor(() => {
      expect(screen.getByText('Songs')).toBeInTheDocument();
    });
  });
});
