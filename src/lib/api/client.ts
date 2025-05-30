import { fetch } from '@tauri-apps/plugin-http';
import { auth } from '../stores/auth';
import { get } from 'svelte/store';

export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	user: {
		id: string;
		email: string;
		username: string;
		avatar?: string;
	};
	token: string;
}

class ApiClient {
	private getHeaders(): HeadersInit {
		const authState = get(auth);
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Accept-Encoding': 'gzip, deflate, br'
		};

		if (authState.token) {
			headers['Authorization'] = `Bearer ${authState.token}`;
		}

		return headers;
	}

	private getBaseUrl(): string {
		const authState = get(auth);
		if (!authState.apiUrl) {
			throw new Error('API URL not configured');
		}
		return authState.apiUrl.replace(/\/$/, '');
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		const url = `${this.getBaseUrl()}${endpoint}`;
		
		const response = await fetch(url, {
			...options,
			headers: {
				...this.getHeaders(),
				...options.headers
			}
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async login(apiUrl: string, credentials: LoginRequest): Promise<LoginResponse> {
		const url = `${apiUrl.replace(/\/$/, '')}/auth/login`;
		
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Accept-Encoding': 'gzip, deflate, br'
			},
			body: JSON.stringify(credentials)
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || 'Login failed');
		}

		const result = await response.json();
		return result.data;
	}

	async get<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: 'GET' });
	}

	async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}

	async getPaginated<T>(
		endpoint: string,
		page: number = 1,
		limit: number = 20
	): Promise<PaginatedResponse<T>> {
		const url = `${endpoint}?page=${page}&limit=${limit}`;
		const response = await this.get<PaginatedResponse<T>>(url);
		return response.data;
	}
}

export const apiClient = new ApiClient(); 