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
			console.log('🏪 Auth store login called');
			console.log('📡 API URL:', apiUrl);
			console.log('📧 Email:', email);
			
			try {
				console.log('📞 Calling api.login...');
				const response = await api.login({ serverUrl: apiUrl, email, password });
				console.log('✅ API login response:', response);
				
				const newState: AuthState = {
					isAuthenticated: true,
					user: response.user,
					token: response.token,
					apiUrl
				};

				// Store in localStorage
				console.log('💾 Storing auth state in localStorage');
				localStorage.setItem('auth', JSON.stringify(newState));
				
				console.log('🔄 Updating auth store state');
				set(newState);
				return response;
			} catch (error) {
				console.error('❌ Auth store login error:', error);
				throw error;
			}
		},
		logout() {
			console.log('🔴 Logging out and clearing auth state');
			localStorage.removeItem('auth');
			api.setToken('');
			api.setBaseUrl('');
			set(initialState);
		},
		async validateToken(): Promise<boolean> {
			try {
				console.log('🔍 Validating stored token...');
				await api.getProfile();
				console.log('✅ Token is valid');
				return true;
			} catch (error) {
				console.log('❌ Token validation failed:', error);
				return false;
			}
		},
		async init() {
			console.log('🏁 Auth store init called');
			const stored = localStorage.getItem('auth');
			if (stored) {
				try {
					const authState: AuthState = JSON.parse(stored);
					console.log('🔍 Stored auth state found:', authState);
					
					if (authState.isAuthenticated && authState.token && authState.apiUrl) {
						console.log('✅ Valid auth state found, configuring API...');
						console.log('📡 Setting API base URL to:', authState.apiUrl);
						console.log('🔑 Setting API token length:', authState.token.length);
						
						api.setBaseUrl(authState.apiUrl);
						api.setToken(authState.token);
						
						// Validate the token by making a test API call
						console.log('🔍 Validating token with server...');
						const isTokenValid = await this.validateToken();
						
						if (isTokenValid) {
							console.log('✅ Token is valid, restoring auth state');
							set(authState);
						} else {
							console.log('❌ Token is invalid/expired, clearing auth state');
							localStorage.removeItem('auth');
							api.setToken('');
							api.setBaseUrl('');
							set(initialState);
						}
					} else {
						console.log('❌ Invalid auth state, missing required fields');
						localStorage.removeItem('auth');
						set(initialState);
					}
				} catch (error) {
					console.error('❌ Failed to parse stored auth state or validate token:', error);
					localStorage.removeItem('auth');
					set(initialState);
				}
			} else {
				console.log('ℹ️ No stored auth state found');
				set(initialState);
			}
		}
	};
}

export const auth = createAuthStore(); 