import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import ru from './locales/ru.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  it: { translation: it },
  ja: { translation: ja },
  'zh-CN': { translation: zhCN },
  ru: { translation: ru },
  // Add more languages here
};

function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem('userSettings');
    if (!stored) return 'en';
    const parsed = JSON.parse(stored);
    return parsed?.language || 'en';
  } catch {
    return 'en';
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

i18n.on('languageChanged', (lng) => {
  try {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    settings.language = lng;
    localStorage.setItem('userSettings', JSON.stringify(settings));
  } catch {}
});

export default i18n;
