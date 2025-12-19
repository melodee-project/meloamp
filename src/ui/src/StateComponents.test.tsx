import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import ErrorState from './components/ErrorState';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Wrapper for i18n
const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('LoadingState', () => {
  it('renders with default message', () => {
    renderWithI18n(<LoadingState />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderWithI18n(<LoadingState message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('renders inline with fullPage=false', () => {
    const { container } = renderWithI18n(<LoadingState fullPage={false} />);
    // Inline mode should have display: flex
    const loadingBox = container.firstChild as HTMLElement;
    expect(loadingBox).toHaveStyle({ display: 'flex' });
  });

  it('renders with different sizes', () => {
    const { rerender } = renderWithI18n(<LoadingState size="small" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    rerender(
      <I18nextProvider i18n={i18n}>
        <LoadingState size="large" />
      </I18nextProvider>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders generic empty state by default', () => {
    renderWithI18n(<EmptyState />);
    expect(screen.getByText(/nothing here/i)).toBeInTheDocument();
  });

  it('renders type-specific empty state', () => {
    renderWithI18n(<EmptyState type="queue" />);
    expect(screen.getByText(/queue is empty/i)).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    renderWithI18n(
      <EmptyState 
        title="Custom Title" 
        description="Custom description text" 
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleClick = jest.fn();
    renderWithI18n(
      <EmptyState 
        action={{ label: 'Add Songs', onClick: handleClick }} 
      />
    );
    
    const button = screen.getByRole('button', { name: 'Add Songs' });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders different types correctly', () => {
    const types = ['songs', 'albums', 'artists', 'playlists', 'search', 'favorites', 'genres'] as const;
    
    types.forEach((type) => {
      const { unmount } = renderWithI18n(<EmptyState type={type} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      unmount();
    });
  });
});

describe('ErrorState', () => {
  it('renders generic error by default', () => {
    renderWithI18n(<ErrorState />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderWithI18n(<ErrorState message="Failed to load songs" />);
    expect(screen.getByText('Failed to load songs')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const handleRetry = jest.fn();
    renderWithI18n(<ErrorState onRetry={handleRetry} />);
    
    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders with custom retry label', () => {
    renderWithI18n(
      <ErrorState 
        onRetry={() => {}} 
        retryLabel="Reload Page" 
      />
    );
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
  });

  it('renders inline alert when fullPage=false', () => {
    renderWithI18n(<ErrorState fullPage={false} message="Network error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders different error types correctly', () => {
    const types = ['network', 'notFound', 'unauthorized', 'forbidden'] as const;
    
    types.forEach((type) => {
      const { unmount } = renderWithI18n(<ErrorState type={type} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      unmount();
    });
  });
});
