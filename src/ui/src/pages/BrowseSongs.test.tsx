import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import BrowseSongs from '../pages/BrowseSongs';
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

describe('BrowseSongs', () => {
  beforeEach(() => {
    setupApiMock();
  });

  afterEach(() => {
    cleanupApiMock();
  });

  test('renders page title', async () => {
    renderWithProviders(<BrowseSongs />);
    await testUtils.waitFor(() => {
      expect(screen.getByText('Songs')).toBeInTheDocument();
    });
  });

  test('renders song list', async () => {
    renderWithProviders(<BrowseSongs />);
    await testUtils.waitFor(() => {
      const songCards = document.querySelectorAll('.MuiCard-root');
      expect(songCards.length).toBeGreaterThan(0);
    });
  });
});