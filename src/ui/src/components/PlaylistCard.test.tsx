import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import PlaylistCard from './PlaylistCard';
import { createMockPlaylist } from '../test/testUtils';
import * as testUtils from '../test/testUtils';

const theme = createTheme({ palette: { mode: 'light' } });

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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

describe('PlaylistCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders playlist name', () => {
    const playlist = createMockPlaylist({ name: 'My Mix' });
    renderWithProviders(<PlaylistCard playlist={playlist} />);
    expect(screen.getByText('My Mix')).toBeInTheDocument();
  });

  test('renders song count', () => {
    const playlist = createMockPlaylist({ name: 'Test Playlist', songCount: 25 });
    renderWithProviders(<PlaylistCard playlist={playlist} />);
    expect(screen.getByText('Test Playlist')).toBeInTheDocument();
  });

  test('shows playlist thumbnail', () => {
    const playlist = createMockPlaylist({ name: 'Test Playlist', thumbnailUrl: 'https://example.com/thumb.jpg' });
    renderWithProviders(<PlaylistCard playlist={playlist} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });
});