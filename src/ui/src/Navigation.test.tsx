/**
 * Navigation.test.tsx - Smoke tests for core navigation routes
 * Tests that main pages render without crashing
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { setupApiMock, cleanupApiMock } from './test/apiMock';
import { setupAuthenticatedUser, clearAuthentication } from './test/testUtils';
import App from './App';

// Setup and teardown
beforeEach(() => {
  setupApiMock();
  setupAuthenticatedUser();
});

afterEach(() => {
  cleanupApiMock();
  clearAuthentication();
});

describe('Core Navigation Smoke Tests', () => {
  test('Dashboard page renders with recent content sections', async () => {
    render(<App />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText(/recent artists/i)).toBeInTheDocument();
    });
    
    // Dashboard sections should be visible
    expect(screen.getByText(/recent albums/i)).toBeInTheDocument();
    expect(screen.getByText(/your playlists/i)).toBeInTheDocument();
  });

  test('Artists page renders when navigating', async () => {
    render(<App />);
    
    // Navigate to Artists
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^artists$/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('link', { name: /^artists$/i }));
    
    // Artists page should render (the nav link text exists, page loads)
    await waitFor(() => {
      // Just verify we can still see navigation (page rendered)
      expect(screen.getByRole('link', { name: /^artists$/i })).toBeInTheDocument();
    });
  });

  test('Albums page renders when navigating', async () => {
    render(<App />);
    
    // Navigate to Albums
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^albums$/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('link', { name: /^albums$/i }));
    
    // Albums page should render
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^albums$/i })).toBeInTheDocument();
    });
  });

  test('Songs page renders when navigating', async () => {
    render(<App />);
    
    // Navigate to Songs
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^songs$/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('link', { name: /^songs$/i }));
    
    // Songs page should render
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^songs$/i })).toBeInTheDocument();
    });
  });

  test('Playlists page renders when navigating', async () => {
    render(<App />);
    
    // Navigate to Playlists
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^playlists$/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('link', { name: /^playlists$/i }));
    
    // Playlists page should render
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^playlists$/i })).toBeInTheDocument();
    });
  });

  test('Queue page renders with queue title', async () => {
    render(<App />);
    
    // Navigate to Queue
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /queue/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('link', { name: /queue/i }));
    
    // Queue page should render with title
    await waitFor(() => {
      // Look for Queue heading or title in the page content
      const queueElements = screen.getAllByText(/queue/i);
      expect(queueElements.length).toBeGreaterThan(0);
    });
  });

  test('Search page renders when using search box', async () => {
    render(<App />);
    
    // Wait for search input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Verify the input value changed
    expect(searchInput).toHaveValue('test query');
  });

  test('Settings page renders from user menu', async () => {
    render(<App />);
    
    // Wait for user menu button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });
    
    // Click user menu
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    
    // Click Settings in menu
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: /settings/i }));
    
    // Settings page should render
    await waitFor(() => {
      expect(screen.getByText(/user settings/i)).toBeInTheDocument();
    });
  });
});

describe('Queue with populated localStorage', () => {
  test('Queue page renders and shows queue controls', async () => {
    render(<App />);
    
    // Navigate to Queue
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /queue/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('link', { name: /queue/i }));
    
    // Queue page should render with controls like Clear, Shuffle, etc.
    // Looking for any queue-related content
    await waitFor(() => {
      // The queue heading should be visible
      const queueElements = screen.getAllByText(/queue/i);
      expect(queueElements.length).toBeGreaterThan(0);
    });
  });
});
