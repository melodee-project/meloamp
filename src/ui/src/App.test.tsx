/**
 * App.test.tsx - Core application tests
 * Tests authentication flow, navigation, and basic app rendering
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { setupApiMock, cleanupApiMock, getMockApi } from './test/apiMock';
import { setupAuthenticatedUser, clearAuthentication } from './test/testUtils';
import App from './App';

// Setup and teardown for each test
beforeEach(() => {
  setupApiMock();
  clearAuthentication();
});

afterEach(() => {
  cleanupApiMock();
  clearAuthentication();
});

describe('App Authentication', () => {
  test('shows login form when no JWT is present', async () => {
    // Ensure no JWT
    localStorage.removeItem('jwt');
    
    render(<App />);
    
    // Should show login page elements
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows dashboard when JWT is present and /users/me succeeds', async () => {
    // Setup authenticated user
    setupAuthenticatedUser();
    
    render(<App />);
    
    // Should show navigation elements (dashboard page)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });
    
    // Should show navigation bar elements (they are links, not buttons)
    expect(screen.getByRole('link', { name: /artists/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /albums/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /playlists/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /songs/i })).toBeInTheDocument();
  });

  test('returns to login when /users/me returns 401', async () => {
    // Setup user with JWT, but mock 401 response
    localStorage.setItem('jwt', 'expired-token');
    localStorage.setItem('userSettings', JSON.stringify({
      theme: 'classic',
      language: 'en',
      highContrast: false,
      fontScale: 1,
      mode: 'light',
    }));
    
    // Mock 401 response
    const mock = getMockApi();
    mock.onGet('/users/me').reply(401, { message: 'Unauthorized' });
    
    render(<App />);
    
    // Since the 401 interceptor clears JWT and redirects, we should see login form
    // Note: The interceptor uses window.location.href which JSDOM doesn't handle,
    // so we check for JWT being cleared instead
    await waitFor(() => {
      // The axios interceptor should clear JWT on 401
      // After that, the app should show login form
      expect(localStorage.getItem('jwt')).toBeNull();
    });
  });
});

describe('App Navigation', () => {
  beforeEach(() => {
    setupAuthenticatedUser();
  });

  test('renders MeloAmp logo and title', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByAltText(/meloamp logo/i)).toBeInTheDocument();
      expect(screen.getByText('MeloAmp')).toBeInTheDocument();
    });
  });

  test('renders main navigation links', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });
    
    const navLinks = ['Dashboard', 'Artists', 'Albums', 'Playlists', 'Songs'];
    for (const linkName of navLinks) {
      expect(screen.getByRole('link', { name: new RegExp(linkName, 'i') })).toBeInTheDocument();
    }
  });

  test('renders search input in top bar', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  test('renders theme toggle button', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle mode/i })).toBeInTheDocument();
    });
  });

  test('renders queue link', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /queue/i })).toBeInTheDocument();
    });
  });
});

describe('App Error Handling', () => {
  test('handles API errors gracefully during dashboard load', async () => {
    setupAuthenticatedUser();
    
    // Mock error responses for dashboard data
    const mock = getMockApi();
    mock.onGet('/system/stats').reply(500, { message: 'Server Error' });
    
    render(<App />);
    
    // App should still render with error message displayed
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
    
    // Navigation should still work
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });
});

