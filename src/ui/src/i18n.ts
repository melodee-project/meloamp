import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import zhCN from './locales/zh-CN.json';
import { readUserSettings, updateUserSettings } from './settings';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'ru', label: 'Русский' },
] as const;

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
};

const supported = new Set<string>(SUPPORTED_LANGUAGES.map((language) => language.code));

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: supported.has(readUserSettings().language) ? readUserSettings().language : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

i18n.on('languageChanged', (language) => {
  if (supported.has(language)) {
    updateUserSettings({ language });
  }
});

export default i18n;
