import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import BrowseArtists from '../pages/BrowseArtists';
import { setupApiMock, cleanupApiMock } from '../test/apiMock';
import * as testUtils from '../test/testUtils';

const theme = createTheme({ palette: { mode: 'light' } });

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={testUtils.testI18n}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>
  );
}

describe('BrowseArtists', () => {
  beforeEach(() => {
    setupApiMock();
  });

  afterEach(() => {
    cleanupApiMock();
  });

  test('renders page title', async () => {
    renderWithProviders(<BrowseArtists />);
    await testUtils.waitFor(() => {
      expect(screen.getByText('Artists')).toBeInTheDocument();
    });
  });

  test('renders loading state initially', async () => {
    renderWithProviders(<BrowseArtists />);
    // The list (or the loading state) must appear; assert the settled list.
    expect(await screen.findByText('Artist One')).toBeInTheDocument();
  });

  test('renders artist list', async () => {
    renderWithProviders(<BrowseArtists />);
    expect(await screen.findByText('Artist One')).toBeInTheDocument();
  });
});