import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import MiniSongCard from './MiniSongCard';
import { createMockSong } from '../test/testUtils';
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
        {ui}
      </ThemeProvider>
    </I18nextProvider>
  );
}

describe('MiniSongCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders song title', () => {
    const song = createMockSong({ title: 'Test Song' });
    renderWithProviders(<MiniSongCard song={song} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  test('renders artist name', () => {
    const song = createMockSong({ artist: { name: 'Test Artist' } } as any);
    renderWithProviders(<MiniSongCard song={song} />);
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  test('renders album name when present', () => {
    const song = createMockSong({ album: { name: 'Test Album', id: 'album-1' } } as any);
    renderWithProviders(<MiniSongCard song={song} />);
    expect(screen.getByText('Test Album')).toBeInTheDocument();
  });

  test('renders duration formatted', () => {
    const song = createMockSong({ durationFormatted: '3:45' });
    renderWithProviders(<MiniSongCard song={song} />);
    expect(screen.getByText('3:45')).toBeInTheDocument();
  });

  test('renders song number', () => {
    const song = createMockSong({ songNumber: 5 });
    renderWithProviders(<MiniSongCard song={song} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('renders add to queue button', () => {
    const song = createMockSong();
    renderWithProviders(<MiniSongCard song={song} />);
    expect(screen.getByRole('button', { name: /add as last in queue/i })).toBeInTheDocument();
  });

  test('handles onClick callback when provided', () => {
    const song = createMockSong();
    const onClick = jest.fn();
    renderWithProviders(<MiniSongCard song={song} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test Song'));
    expect(onClick).toHaveBeenCalledWith(song);
  });

  test('renders skip next button', () => {
    const song = createMockSong();
    renderWithProviders(<MiniSongCard song={song} />);
    expect(screen.getByRole('button', { name: /play next/i })).toBeInTheDocument();
  });

  test('handles card click navigation', () => {
    const song = createMockSong({ id: 'song-123' });
    renderWithProviders(<MiniSongCard song={song} />);
    fireEvent.click(screen.getByText('Test Song'));
    expect(mockNavigate).toHaveBeenCalledWith('/songs/song-123');
  });
});