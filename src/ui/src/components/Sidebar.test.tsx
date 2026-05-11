import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import * as testUtils from '../test/testUtils';

const theme = createTheme({ palette: { mode: 'light' } });

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

describe('Sidebar', () => {
  const defaultProps = {
    user: { username: 'TestUser', email: 'test@example.com' },
    isOpen: true,
    onToggle: jest.fn(),
    onThemeToggle: jest.fn(),
    themeMode: 'light' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders user info', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  test('renders sidebar sections', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  test('renders navigation items', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Albums')).toBeInTheDocument();
  });

  test('renders settings link', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders settings and logout section', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    const settingsButtons = screen.getAllByRole('button');
    expect(settingsButtons.length).toBeGreaterThan(0);
  });
});