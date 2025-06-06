import axios from 'axios';
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
}

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config: any) => {
  if (jwt) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${jwt}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response && error.response.status === 401) {
      clearJwt();
      window.location.href = '/'; // Always redirect to root (login view)
    }
    return Promise.reject(error);
  }
);

export function setApiBaseUrl(url: string) {
  API_BASE = url;
  api.defaults.baseURL = url;
}

export async function authenticate({ email, password }: LoginRequest): Promise<{ data: LoginResponse }> {
  return api.post<LoginResponse>('/users/authenticate', { email, password });
}

export async function apiRequest(path: string, options: any = {}) {
  const response = await api.request({ url: path, ...options });
  const data = response.data;
  // If response has a 'meta' and 'data' property, treat as paginated
  if (data && typeof data === 'object' && 'meta' in data && 'data' in data) {
    return { ...response, data };
  }
  // Otherwise, treat as detail model
  return { ...response, data };
}

export default api;
