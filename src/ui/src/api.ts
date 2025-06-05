import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

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

api.interceptors.request.use((config) => {
  if (jwt) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${jwt}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearJwt();
      window.location.href = '/'; // Always redirect to root (login view)
    }
    return Promise.reject(error);
  }
);

export default api;
