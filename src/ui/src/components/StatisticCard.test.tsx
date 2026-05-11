import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, createTheme } from '@mui/material';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import StatisticCard from './StatisticCard';
import { Statistic, StatisticType } from '../apiModels';

const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

const theme = createTheme({ palette: { mode: 'light' } });

const renderWithProviders = (ui: React.ReactElement) => render(
  <I18nextProvider i18n={testI18n}>
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  </I18nextProvider>
);

describe('StatisticCard', () => {
  test('renders data value', () => {
    const stat: Statistic = { type: StatisticType.COUNT, title: 'statistic.songsPlayed', data: '1,234' };
    renderWithProviders(<StatisticCard stat={stat} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });
});
