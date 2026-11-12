import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { LoginRequest, LoginResponse, Meta } from './apiModels';
import { clearUser } from './storage';
import { getErrorStatus } from './utils/errors';

let API_BASE = localStorage.getItem('serverUrl') || process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

let jwt: string | null = localStorage.getItem('jwt');

export interface ApiPayload<T> {
  data?: T;
}

/** Pagination metadata returned by the Melodee API envelope. */
export type ApiMeta = Meta;

/** A list payload plus its pagination metadata. */
export interface ApiPage<T> {
  items: T[];
  meta?: ApiMeta;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Maximum envelope depth we unwrap (guards against pathological responses). */
const MAX_ENVELOPE_DEPTH = 3;

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
  async (error: unknown) => {
    const status = getErrorStatus(error);
    const originalRequest = (error as { config?: InternalAxiosRequestConfig & { _retry?: boolean } })?.config;

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      const newToken = await performRefresh();
      if (newToken) {
        originalRequest._retry = true;
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
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

export function getApiBaseUrl(): string {
  return API_BASE;
}

/** Type guard for the pagination metadata envelope. */
function isMeta(value: unknown): value is ApiMeta {
  return isRecord(value) && typeof value.totalCount === 'number';
}

/**
 * Unwrap the API envelope (`{ data: payload }`, possibly nested) down to the
 * payload itself. Non-envelope values are returned unchanged, so call sites can
 * use a single helper regardless of endpoint shape.
 *
 * Prefer `unwrapApiPage` for list endpoints that also carry `meta`.
 */
export function unwrapApiResponse<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;

  let current: unknown = value;
  for (let depth = 0; depth < MAX_ENVELOPE_DEPTH; depth += 1) {
    if (!isRecord(current) || !('data' in current) || current.data === undefined || current.data === null) {
      break;
    }
    current = current.data;
  }

  return current as T;
}

/**
 * Unwrap a list endpoint into `{ items, meta }`.
 *
 * Accepts `T[]`, `{ data: T[]; meta? }`, `{ items: T[]; meta? }` and nested
 * envelopes, so pages never need to guess the response shape.
 */
export function unwrapApiPage<T>(value: unknown): ApiPage<T> {
  const unwrapped = unwrapApiResponse<unknown>(value);
  const meta = isRecord(value) && isMeta(value.meta) ? value.meta : undefined;

  if (Array.isArray(unwrapped)) return { items: unwrapped as T[], meta };
  if (isRecord(unwrapped)) {
    const items = unwrapped.items ?? unwrapped.data ?? unwrapped.results;
    if (Array.isArray(items)) {
      const nestedMeta = isRecord(unwrapped) && isMeta(unwrapped.meta) ? unwrapped.meta : meta;
      return { items: items as T[], meta: nestedMeta };
    }
  }
  return { items: [], meta };
}

export function buildEndpoint(path: string, params: Record<string, string | number | boolean> = {}) {
  return Object.entries(params).reduce((next, [name, value]) => {
    const token = encodeURIComponent(String(value));
    return next.replace(`{${name}}`, token);
  }, path);
}

export async function apiRequest<T = unknown>(path: string, options: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
  return api.request<T>({ url: path, ...options });
}

/** Convenience GET that forwards an abort signal (see `useApiEffect`). */
export async function apiGet<T = unknown>(path: string, options: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
  return api.get<T>(path, options);
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
