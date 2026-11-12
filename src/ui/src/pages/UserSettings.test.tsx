import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, createTheme } from '@mui/material';

import UserSettings from './UserSettings';
import { DEFAULT_SETTINGS } from '../types/settings';
import { testI18n } from '../test/testUtils';

const theme = createTheme();

function setupUserSettings(settings = DEFAULT_SETTINGS, onChange = vi.fn()) {
  render(
    <I18nextProvider i18n={testI18n}>
      <ThemeProvider theme={theme}>
        <UserSettings settings={{ ...settings }} onChange={onChange} />
      </ThemeProvider>
    </I18nextProvider>,
  );
  return { onChange };
}

describe('UserSettings theme picker', () => {
  test('propagates the selected theme to the parent', () => {
    const { onChange } = setupUserSettings();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Ocean' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ theme: 'ocean' }));
  });

  test('restore defaults resets theme and mode', () => {
    const { onChange } = setupUserSettings({ ...DEFAULT_SETTINGS, theme: 'ocean', mode: 'light' });

    fireEvent.click(screen.getByRole('button', { name: testI18n.t('settings.restoreDefaults') }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ theme: DEFAULT_SETTINGS.theme, mode: DEFAULT_SETTINGS.mode }),
    );
  });
});
