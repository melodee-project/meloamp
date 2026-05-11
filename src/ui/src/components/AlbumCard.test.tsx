import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import AlbumCard from './AlbumCard';
import { createMockAlbum } from '../test/testUtils';
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

describe('AlbumCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders album name', () => {
    const album = createMockAlbum({ name: 'Test Album' });
    renderWithProviders(<AlbumCard album={album} />);
    expect(screen.getByText('Test Album')).toBeInTheDocument();
  });

  test('renders artist name', () => {
    const album = createMockAlbum({ artist: { name: 'Test Artist' } } as any);
    renderWithProviders(<AlbumCard album={album} />);
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  test('renders album content', () => {
    const album = createMockAlbum({ name: 'Test Album', releaseYear: 2024, songCount: 12 });
    renderWithProviders(<AlbumCard album={album} />);
    expect(screen.getByText('Test Album')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  test('shows album thumbnail', () => {
    const album = createMockAlbum({ thumbnailUrl: 'https://example.com/thumb.jpg' });
    renderWithProviders(<AlbumCard album={album} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });

  test('navigates on click', () => {
    const album = createMockAlbum({ id: 'album-123' });
    renderWithProviders(<AlbumCard album={album} />);
    const card = screen.getByText('Test Album').closest('.MuiCard-root');
    if (card) {
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/albums/album-123');
    }
  });
});