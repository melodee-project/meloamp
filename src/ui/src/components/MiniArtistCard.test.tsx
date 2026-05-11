import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMockArtist } from '../test/testUtils';
import MiniArtistCard from './MiniArtistCard';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('MiniArtistCard', () => {
  test('renders artist name', () => {
    const artist = createMockArtist({ name: 'Test Artist' });
    render(<MiniArtistCard artist={artist} />);
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  test('renders artist image', () => {
    const artist = createMockArtist({ imageUrl: 'https://example.com/artist.jpg' });
    render(<MiniArtistCard artist={artist} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/artist.jpg');
  });

  test('navigates on click', () => {
    const artist = createMockArtist({ id: 'a1' });
    render(<MiniArtistCard artist={artist} />);
    screen.getByTitle('Test Artist').click();
    expect(mockNavigate).toHaveBeenCalledWith('/artists/a1');
  });
});
