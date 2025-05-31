import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';
export type SearchType = 'artists' | 'albums' | 'songs' | 'playlists';

export interface ThemeState {
	theme: Theme;
	language: string;
	preferences: {
		autoPlay: boolean;
		volume: number;
		quality: 'low' | 'medium' | 'high';
		notifications: boolean;
		defaultSearchTypes: SearchType[];
	};
}

const defaultThemeState: ThemeState = {
	theme: 'system',
	language: 'en',
	preferences: {
		autoPlay: false,
		volume: 0.8,
		quality: 'high',
		notifications: true,
		defaultSearchTypes: ['artists', 'albums', 'songs', 'playlists']
	}
};

function createThemeStore() {
	const { subscribe, set, update } = writable<ThemeState>(defaultThemeState);

	return {
		subscribe,
		setTheme: (theme: Theme) => {
			update(state => {
				const newState = { ...state, theme };
				if (browser) {
					localStorage.setItem('meloamp_theme', JSON.stringify(newState));
					applyTheme(theme);
				}
				return newState;
			});
		},
		setLanguage: (language: string) => {
			update(state => {
				const newState = { ...state, language };
				if (browser) {
					localStorage.setItem('meloamp_theme', JSON.stringify(newState));
				}
				return newState;
			});
		},
		updatePreferences: (preferences: Partial<ThemeState['preferences']>) => {
			update(state => {
				const newState = {
					...state,
					preferences: { ...state.preferences, ...preferences }
				};
				if (browser) {
					localStorage.setItem('meloamp_theme', JSON.stringify(newState));
				}
				return newState;
			});
		},
		init: () => {
			if (browser) {
				const stored = localStorage.getItem('meloamp_theme');
				if (stored) {
					try {
						const themeState = JSON.parse(stored);
						set(themeState);
						applyTheme(themeState.theme);
					} catch (e) {
						console.error('Failed to parse stored theme state:', e);
						applyTheme('system');
					}
				} else {
					applyTheme('system');
				}
			}
		}
	};
}

function applyTheme(theme: Theme) {
	if (!browser) return;

	const root = document.documentElement;
	
	if (theme === 'system') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.classList.toggle('dark', prefersDark);
	} else {
		root.classList.toggle('dark', theme === 'dark');
	}
}

export const themeStore = createThemeStore(); 