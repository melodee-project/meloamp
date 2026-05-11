import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, createTheme } from '@mui/material';
import ArtistDetailView from './ArtistDetailView';
import { setupApiMock, cleanupApiMock } from '../test/apiMock';
import { testI18n } from '../test/testUtils';

const theme = createTheme({ palette: { mode: 'light' } });

const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => render(
  <I18nextProvider i18n={testI18n}>
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/artists/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  </I18nextProvider>
);

describe('ArtistDetailView', () => {
  beforeEach(() => {
    setupApiMock();
  });

  afterEach(() => {
    cleanupApiMock();
  });

  test('shows loading state initially', () => {
    renderWithProviders(<ArtistDetailView />, { route: '/artists/artist-1' });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows artist name after loading', async () => {
    renderWithProviders(<ArtistDetailView />, { route: '/artists/artist-1' });
    await waitFor(() => {
      expect(screen.getByText('Artist One')).toBeInTheDocument();
    });
  });

  test('displays artist albums section', async () => {
    renderWithProviders(<ArtistDetailView />, { route: '/artists/artist-1' });
    await waitFor(() => {
      expect(screen.getByText('Albums')).toBeInTheDocument();
    });
  });
});
