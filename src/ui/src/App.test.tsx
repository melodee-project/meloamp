/**
 * App.test.tsx - Core application tests
 * Tests authentication flow, navigation, and basic app rendering
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { setupApiMock, cleanupApiMock, getMockApi } from './test/apiMock';
import { setupAuthenticatedUser, clearAuthentication, createMockUser } from './test/testUtils';
import App from './App';
import { updateUserSettings } from './settings';
import { clearJwt, setJwt } from './api';

// Setup and teardown for each test
beforeEach(() => {
  setupApiMock();
  clearAuthentication();
  window.history.replaceState({}, '', '/');
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

  test('shows dashboard when JWT is present and /user/me succeeds', async () => {
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
    expect(screen.getByRole('link', { name: /^playlists$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /songs/i })).toBeInTheDocument();
  });

  test('returns to login when /user/me returns 401', async () => {
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
    mock.onGet('/user/me').reply(401, { message: 'Unauthorized' });
    
    render(<App />);
    
    expect(await screen.findByRole('button', { name: /^login$/i })).toBeInTheDocument();
    expect(localStorage.getItem('jwt')).toBeNull();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  test('returns to login on session expiration at a nested route without reloading', async () => {
    setupAuthenticatedUser();
    window.history.replaceState({}, '', '/albums');
    render(<App />);
    expect(await screen.findByRole('banner')).toBeInTheDocument();
    act(() => clearJwt());
    expect(await screen.findByRole('button', { name: /^login$/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/albums');
  });

  test('keeps the app authenticated when an expired JWT is refreshed', async () => {
    setupAuthenticatedUser();
    setJwt('expired');
    const mock = getMockApi();
    mock.onGet('/user/me').reply(config => config.headers?.Authorization === 'Bearer refreshed'
      ? [200, createMockUser()]
      : [401]);
    mock.onPost('/auth/refresh').reply(200, { token: 'refreshed' });
    render(<App />);
    await waitFor(() => expect(localStorage.getItem('jwt')).toBe('refreshed'));
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^login$/i })).not.toBeInTheDocument();
  });
});

describe('App Navigation', () => {
  beforeEach(() => {
    setupAuthenticatedUser();
  });

  test('renders MeloAmp logo and title', async () => {
    render(<App />);

    expect(await screen.findByAltText(/meloamp logo/i)).toBeInTheDocument();
    expect(screen.getByText('MeloAmp')).toBeInTheDocument();
  });

  test('propagates theme changes to the document and app chrome', async () => {
    localStorage.setItem('userSettings', JSON.stringify({ theme: 'classic', mode: 'light' }));
    render(<App />);

    expect(await screen.findByRole('banner')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('classic');

    act(() => {
      updateUserSettings({ theme: 'retroWave', mode: 'dark' });
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('retroWave');
    });
    expect(document.documentElement.dataset.themeMode).toBe('dark');

    const header = screen.getByRole('banner');
    expect(getComputedStyle(header).backgroundColor).toBe('rgb(45, 0, 54)');
  });

  test('renders main navigation links', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });
    
    const navLinks = ['dashboard', 'artists', 'albums', 'playlists', 'songs'];
    for (const linkName of navLinks) {
      const pattern = new RegExp(`^${linkName}$`, 'i');
      expect(screen.getByRole('link', { name: pattern })).toBeInTheDocument();
    }
  });

  test('renders search input in top bar', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  test('edits and clears the top search while on the search page', async () => {
    window.history.replaceState({}, '', '/search?q=old');
    render(<App />);
    const header = await screen.findByRole('banner');
    const input = within(header).getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new' } });
    expect(input).toHaveValue('new');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(window.location.search).toBe('?q=new'));
    const pageInput = screen.getAllByPlaceholderText(/search artists/i).find(element => element !== input)!;
    await waitFor(() => expect(pageInput).toHaveValue('new'));
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(window.location.search).toBe(''));
    expect(pageInput).toHaveValue('');
  });

  test('renders theme toggle button', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle light\/dark mode/i })).toBeInTheDocument();
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
