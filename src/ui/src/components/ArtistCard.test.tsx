import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ArtistCard from './ArtistCard';
import { createMockArtist } from '../test/testUtils';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ArtistCard', () => {
  test('renders artist name', () => {
    const artist = createMockArtist({ name: 'Test Artist' });
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  test('renders album count', () => {
    const artist = createMockArtist({ albumCount: 5, songCount: 0 });
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  test('renders song count', () => {
    const artist = createMockArtist({ songCount: 50 });
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  test('navigates on click', () => {
    const artist = createMockArtist({ id: 'a1' });
    render(<ArtistCard artist={artist} />);
    fireEvent.click(screen.getByText(artist.name));
    expect(mockNavigate).toHaveBeenCalledWith('/artists/a1');
  });
});
