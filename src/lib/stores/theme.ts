import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type BaseTheme = 'light' | 'dark' | 'system';
export type ColorTheme = 'blue' | 'purple' | 'green' | 'orange' | 'red';
export type SearchType = 'artists' | 'albums' | 'songs' | 'playlists';

export interface ThemeState {
	baseTheme: BaseTheme;
	colorTheme: ColorTheme;
	language: string;
	preferences: {
		autoPlay: boolean;
		volume: number;
		quality: 'low' | 'medium' | 'high';
		notifications: boolean;
		defaultSearchTypes: SearchType[];
	};
}

// Color palette definitions
const colorPalettes = {
	blue: {
		primary: {
			50: '239 246 255',   // blue-50
			100: '219 234 254',  // blue-100
			200: '191 219 254',  // blue-200
			300: '147 197 253',  // blue-300
			400: '96 165 250',   // blue-400
			500: '59 130 246',   // blue-500
			600: '37 99 235',    // blue-600
			700: '29 78 216',    // blue-700
			800: '30 64 175',    // blue-800
			900: '30 58 138',    // blue-900
		}
	},
	purple: {
		primary: {
			50: '250 245 255',   // purple-50
			100: '243 232 255',  // purple-100
			200: '233 213 255',  // purple-200
			300: '196 181 253',  // purple-300
			400: '167 139 250',  // purple-400
			500: '139 92 246',   // purple-500
			600: '124 58 237',   // purple-600
			700: '109 40 217',   // purple-700
			800: '91 33 182',    // purple-800
			900: '76 29 149',    // purple-900
		}
	},
	green: {
		primary: {
			50: '240 253 244',   // green-50
			100: '220 252 231',  // green-100
			200: '187 247 208',  // green-200
			300: '134 239 172',  // green-300
			400: '74 222 128',   // green-400
			500: '34 197 94',    // green-500
			600: '22 163 74',    // green-600
			700: '21 128 61',    // green-700
			800: '22 101 52',    // green-800
			900: '20 83 45',     // green-900
		}
	},
	orange: {
		primary: {
			50: '255 247 237',   // orange-50
			100: '255 237 213',  // orange-100
			200: '254 215 170',  // orange-200
			300: '253 186 116',  // orange-300
			400: '251 146 60',   // orange-400
			500: '249 115 22',   // orange-500
			600: '234 88 12',    // orange-600
			700: '194 65 12',    // orange-700
			800: '154 52 18',    // orange-800
			900: '124 45 18',    // orange-900
		}
	},
	red: {
		primary: {
			50: '254 242 242',   // red-50
			100: '254 226 226',  // red-100
			200: '254 202 202',  // red-200
			300: '252 165 165',  // red-300
			400: '248 113 113',  // red-400
			500: '239 68 68',    // red-500
			600: '220 38 38',    // red-600
			700: '185 28 28',    // red-700
			800: '153 27 27',    // red-800
			900: '127 29 29',    // red-900
		}
	}
};

const defaultThemeState: ThemeState = {
	baseTheme: 'system',
	colorTheme: 'blue',
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
		setBaseTheme: (baseTheme: BaseTheme) => {
			update(state => {
				const newState = { ...state, baseTheme };
				if (browser) {
					localStorage.setItem('meloamp_theme', JSON.stringify(newState));
					applyTheme(newState.baseTheme, newState.colorTheme);
				}
				return newState;
			});
		},
		setColorTheme: (colorTheme: ColorTheme) => {
			update(state => {
				const newState = { ...state, colorTheme };
				if (browser) {
					localStorage.setItem('meloamp_theme', JSON.stringify(newState));
					applyTheme(newState.baseTheme, newState.colorTheme);
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
						// Handle migration from old theme system
						if (typeof themeState.theme === 'string') {
							const migratedState = {
								...defaultThemeState,
								...themeState,
								baseTheme: themeState.theme,
								colorTheme: 'blue'
							};
							delete migratedState.theme;
							set(migratedState);
							applyTheme(migratedState.baseTheme, migratedState.colorTheme);
						} else {
							set(themeState);
							applyTheme(themeState.baseTheme, themeState.colorTheme);
						}
					} catch (e) {
						console.error('Failed to parse stored theme state:', e);
						applyTheme('system', 'blue');
					}
				} else {
					applyTheme('system', 'blue');
				}
			}
		}
	};
}

function applyTheme(baseTheme: BaseTheme, colorTheme: ColorTheme) {
	if (!browser) return;

	console.log('🔄 Applying theme:', { baseTheme, colorTheme });
	const root = document.documentElement;
	console.log('🔄 Root element:', root);
	console.log('🔄 Current classes before:', root.className);
	
	// Apply dark/light mode
	if (baseTheme === 'system') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		console.log('🔄 System prefers dark:', prefersDark);
		root.classList.toggle('dark', prefersDark);
	} else {
		console.log('🔄 Setting base theme directly to:', baseTheme);
		root.classList.toggle('dark', baseTheme === 'dark');
	}
	
	// Apply color theme
	console.log('🔄 Applying color theme:', colorTheme);
	const palette = colorPalettes[colorTheme];
	if (palette) {
		// Set CSS custom properties for the color theme
		Object.entries(palette.primary).forEach(([shade, rgb]) => {
			root.style.setProperty(`--color-primary-${shade}`, rgb);
		});
		
		// Add theme class for any theme-specific styling
		root.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-orange', 'theme-red');
		root.classList.add(`theme-${colorTheme}`);
	}
	
	console.log('🔄 Current classes after:', root.className);
}

export const themeStore = createThemeStore(); 