import i18n from './i18n';
import './locales/en.json';

describe('i18n configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('exports an i18n instance', () => {
    expect(i18n).toBeDefined();
    expect(typeof i18n.t).toBe('function');
  });

  test('defaults to English', () => {
    expect(i18n.language).toBe('en');
  });

  test('can change language', () => {
    i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');
    i18n.changeLanguage('en');
  });

  test('language change persists to localStorage', () => {
    localStorage.setItem('userSettings', JSON.stringify({ language: 'fr' }));
    i18n.changeLanguage('fr');
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    expect(settings.language).toBe('fr');
  });
});
