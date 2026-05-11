import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { LoginRequest, LoginResponse } from './apiModels';

let API_BASE = localStorage.getItem('serverUrl') || process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

let jwt: string | null = localStorage.getItem('jwt');

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

export async function authenticate({ email, password }: LoginRequest): Promise<AxiosResponse<LoginResponse>> {
  return api.post<LoginResponse>('/auth/authenticate', { email, password });
}

export async function apiRequest(path: string, options: Record<string, unknown> = {}): Promise<AxiosResponse> {
  const response = await api.request({ url: path, ...options });
  return response;
}

export default api;
