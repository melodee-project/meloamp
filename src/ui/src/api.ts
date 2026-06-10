import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { LoginRequest, LoginResponse } from './apiModels';
import { clearUser } from './storage';

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
  clearUser();
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

let refreshInFlight: Promise<string | null> | null = null;

const isAuthEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes('/auth/authenticate') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/password-reset') ||
    url.includes('/auth/revoke') ||
    url.includes('/auth/logout')
  );
};

const performRefresh = async (): Promise<string | null> => {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await api.post<{ token?: string }>('/auth/refresh');
      const newToken = res.data?.token;
      if (newToken) {
        setJwt(newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      const newToken = await performRefresh();
      if (newToken) {
        originalRequest._retry = true;
        originalRequest.headers = originalRequest.headers ?? ({} as any);
        (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
        return api.request(originalRequest);
      }
    }

    if (status === 401) {
      clearJwt();
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
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
