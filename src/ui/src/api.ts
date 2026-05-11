import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { LoginRequest, LoginResponse } from './apiModels';

let API_BASE = localStorage.getItem('serverUrl') || process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

let jwt: string | null = localStorage.getItem('jwt');

export interface ApiPayload<T> {
  data?: T;
}

export function setJwt(token: string) {
  jwt = token;
  localStorage.setItem('jwt', token);
}

export function clearJwt() {
  jwt = null;
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
}

export function getJwt(): string | null {
  return jwt;
}

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response && error.response.status === 401) {
      clearJwt();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export function setApiBaseUrl(url: string) {
  API_BASE = url;
  api.defaults.baseURL = url;
}

export function unwrapApiResponse<T>(value: AxiosResponse<T> | { data: T } | T | null | undefined): T | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'data' in value) {
    const envelope = value as { data: unknown };
    const payload: any = envelope.data;
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
      return payload.data as T;
    }
    return payload as T;
  }
  return value as T;
}

export function buildEndpoint(path: string, params: Record<string, string | number | boolean> = {}) {
  return Object.entries(params).reduce((next, [name, value]) => {
    const token = encodeURIComponent(String(value));
    return next.replace(`{${name}}`, token);
  }, path);
}

export async function apiRequest<T = unknown>(path: string, options: Record<string, unknown> = {}): Promise<AxiosResponse<T>> {
  const response = await api.request<T>({ url: path, ...options });
  return response;
}

export async function authenticate({ email, password }: LoginRequest): Promise<AxiosResponse<LoginResponse>> {
  return api.post<LoginResponse>('/auth/authenticate', { email, password });
}

export async function requestPasswordReset(email: string) {
  return api.post('/auth/password-reset/request', { email });
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  return api.post('/auth/password-reset/confirm', { token, newPassword });
}

export async function logoutAllDevices() {
  return api.post('/auth/logout');
}

export async function revokeSession() {
  return api.post('/auth/revoke', { reason: 'user_request' });
}

export async function refreshSession() {
  return api.post('/auth/refresh');
}

export default api;
