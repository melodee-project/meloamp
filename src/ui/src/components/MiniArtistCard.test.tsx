import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMockArtist } from '../test/testUtils';
import MiniArtistCard from './MiniArtistCard';

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
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
    fireEvent.click(screen.getByTitle('Test Artist'));
    expect(mockNavigate).toHaveBeenCalledWith('/artists/a1');
  });
});
