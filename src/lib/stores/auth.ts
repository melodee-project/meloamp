import { writable } from 'svelte/store';
import type { User } from '../types/user';
import { api } from '../api';

export interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
	apiUrl: string | null;
}

const initialState: AuthState = {
	isAuthenticated: false,
	user: null,
	token: null,
	apiUrl: null
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		async login(apiUrl: string, email: string, password: string) {
			try {
				const response = await api.login({ serverUrl: apiUrl, email, password });
				
				const newState: AuthState = {
					isAuthenticated: true,
					user: response.user,
					token: response.token,
					apiUrl
				};

				// Store in localStorage
				localStorage.setItem('auth', JSON.stringify(newState));
				
				set(newState);
				return response;
			} catch (error) {
				throw error;
			}
		},
		logout() {
			localStorage.removeItem('auth');
			set(initialState);
		},
		init() {
			const stored = localStorage.getItem('auth');
			if (stored) {
				try {
					const authState: AuthState = JSON.parse(stored);
					if (authState.isAuthenticated && authState.token && authState.apiUrl) {
						api.setBaseUrl(authState.apiUrl);
						api.setToken(authState.token);
						set(authState);
					}
				} catch (error) {
					console.error('Failed to parse stored auth state:', error);
					localStorage.removeItem('auth');
				}
			}
		}
	};
}

export const auth = createAuthStore(); 