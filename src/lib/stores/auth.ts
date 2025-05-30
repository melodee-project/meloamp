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
			localStorage.removeItem('auth');
			set(initialState);
		},
		init() {
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
						
						// Verify the configuration was applied
						console.log('🔍 API base URL after configuration:', api.getCurrentBaseUrl());
						
						set(authState);
						console.log('✅ Auth state restored successfully');
					} else {
						console.log('❌ Invalid auth state, missing required fields');
					}
				} catch (error) {
					console.error('❌ Failed to parse stored auth state:', error);
					localStorage.removeItem('auth');
				}
			} else {
				console.log('ℹ️ No stored auth state found');
			}
		}
	};
}

export const auth = createAuthStore(); 