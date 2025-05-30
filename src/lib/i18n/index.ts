import { register, init, getLocaleFromNavigator, locale } from 'svelte-i18n';

register('en', () => import('./locales/en.json'));
register('es', () => import('./locales/es.json'));
register('fr', () => import('./locales/fr.json'));
register('de', () => import('./locales/de.json'));
register('pt', () => import('./locales/pt.json'));
register('ja', () => import('./locales/ja.json'));
register('zh', () => import('./locales/zh.json'));

export async function initI18n() {
	await init({
		fallbackLocale: 'en',
		initialLocale: getLocaleFromNavigator(),
	});
}

export const supportedLocales = [
	{ code: 'en', name: 'English' },
	{ code: 'es', name: 'Español' },
	{ code: 'fr', name: 'Français' },
	{ code: 'de', name: 'Deutsch' },
	{ code: 'pt', name: 'Português' },
	{ code: 'ja', name: '日本語' },
	{ code: 'zh', name: '中文' }
];

export function setLocale(newLocale: string) {
	locale.set(newLocale);
}

export { _, locale } from 'svelte-i18n'; 