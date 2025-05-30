import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	id: string;
	email: string;
	username: string;
	avatar?: string;
}

export interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
	apiUrl: string | null;
}

const defaultAuthState: AuthState = {
	isAuthenticated: false,
	user: null,
	token: null,
	apiUrl: null
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(defaultAuthState);

	return {
		subscribe,
		login: (user: User, token: string, apiUrl: string) => {
			const authState = {
				isAuthenticated: true,
				user,
				token,
				apiUrl
			};
			set(authState);
			if (browser) {
				localStorage.setItem('meloamp_auth', JSON.stringify(authState));
			}
		},
		logout: () => {
			set(defaultAuthState);
			if (browser) {
				localStorage.removeItem('meloamp_auth');
			}
		},
		init: () => {
			if (browser) {
				const stored = localStorage.getItem('meloamp_auth');
				if (stored) {
					try {
						const authState = JSON.parse(stored);
						set(authState);
					} catch (e) {
						console.error('Failed to parse stored auth state:', e);
					}
				}
			}
		}
	};
}

export const auth = createAuthStore(); 