import { setJwt, clearJwt, getJwt, setApiBaseUrl, unwrapApiResponse, buildEndpoint, apiRequest, authenticate, requestPasswordReset, confirmPasswordReset, logoutAllDevices, revokeSession, refreshSession } from './api';
import api from './api';
import MockAdapter from 'axios-mock-adapter';

let mockApi: MockAdapter;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearJwt();
  mockApi = new MockAdapter(api);
});

afterEach(() => {
  mockApi.restore();
});

describe('setJwt / getJwt / clearJwt', () => {
  test('setJwt stores token and persists to localStorage', () => {
    setJwt('test-token');
    expect(getJwt()).toBe('test-token');
    expect(localStorage.getItem('jwt')).toBe('test-token');
  });

  test('clearJwt removes token and user data', () => {
    localStorage.setItem('jwt', 'test-token');
    localStorage.setItem('user', '{"id":"u1"}');
    sessionStorage.setItem('user', '{"id":"u1"}');
    clearJwt();
    expect(getJwt()).toBeNull();
    expect(localStorage.getItem('jwt')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });
});

describe('setApiBaseUrl', () => {
  test('updates API base URL', () => {
    setApiBaseUrl('http://new-url/api/v1');
    expect(api.defaults.baseURL).toBe('http://new-url/api/v1');
  });
});

describe('unwrapApiResponse', () => {
  test('returns null for null/undefined input', () => {
    expect(unwrapApiResponse(null)).toBeNull();
    expect(unwrapApiResponse(undefined)).toBeNull();
  });

  test('returns the value directly for non-object', () => {
    expect(unwrapApiResponse('hello')).toBe('hello');
    expect(unwrapApiResponse(42)).toBe(42);
  });

  test('unwraps nested data envelope', () => {
    const response = { data: { data: ['result'] } };
    expect(unwrapApiResponse(response)).toEqual(['result']);
  });

  test('unwraps single-level data envelope', () => {
    const response = { data: 'direct' };
    expect(unwrapApiResponse(response)).toBe('direct');
  });
});

describe('buildEndpoint', () => {
  test('replaces path parameters', () => {
    expect(buildEndpoint('/artists/{id}', { id: '123' })).toBe('/artists/123');
  });

  test('replaces multiple parameters', () => {
    expect(buildEndpoint('/{a}/{b}', { a: 'x', b: 'y' })).toBe('/x/y');
  });

  test('handles empty params', () => {
    expect(buildEndpoint('/test')).toBe('/test');
  });

  test('encodes special characters', () => {
    expect(buildEndpoint('/search/{q}', { q: 'hello world' })).toBe('/search/hello%20world');
  });
});

describe('apiRequest', () => {
  test('sends request with correct config', async () => {
    mockApi.onGet('/test').reply(200, { success: true });
    const result = await apiRequest('/test');
    expect(result.data).toEqual({ success: true });
  });

  test('includes JWT header when token is set', async () => {
    setJwt('my-jwt');
    mockApi.onGet('/secure').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer my-jwt');
      return [200, { ok: true }];
    });
    const result = await apiRequest('/secure');
    expect(result.data).toEqual({ ok: true });
  });

  test('handles 401 error by clearing JWT', async () => {
    setJwt('expired');
    mockApi.onGet('/user/me').reply(401, { message: 'Unauthorized' });
    await expect(apiRequest('/user/me')).rejects.toThrow();
    expect(getJwt()).toBeNull();
  });

  test('refreshes token on 401 and retries the request', async () => {
    setJwt('expired');
    let authedRequests = 0;
    mockApi.onPost('/auth/refresh').reply(() => [200, { token: 'new-token' }]);
    mockApi.onGet('/user/me').reply((config) => {
      const header = (config.headers as Record<string, string> | undefined)?.Authorization;
      if (header === 'Bearer new-token') {
        authedRequests += 1;
        return [200, { id: 'u1' }];
      }
      return [401, { message: 'Unauthorized' }];
    });
    const res = await apiRequest('/user/me');
    expect(res.data).toEqual({ id: 'u1' });
    expect(authedRequests).toBe(1);
    expect(getJwt()).toBe('new-token');
  });

  test('clears JWT when refresh also fails on 401', async () => {
    setJwt('expired');
    mockApi.onPost('/auth/refresh').reply(401);
    mockApi.onGet('/user/me').reply(401);
    await expect(apiRequest('/user/me')).rejects.toThrow();
    expect(getJwt()).toBeNull();
  });

  test('does not loop refreshing auth endpoints', async () => {
    setJwt('expired');
    mockApi.onPost('/auth/refresh').reply(401);
    await expect(refreshSession()).rejects.toThrow();
    expect(mockApi.history.post.filter((h) => h.url === '/auth/refresh').length).toBe(1);
  });
});

describe('authenticate', () => {
  test('calls auth endpoint and returns login data', async () => {
    mockApi.onPost('/auth/authenticate').reply(200, {
      user: { id: 'u1', username: 'test' },
      token: 'mock-token',
      serverVersion: 1,
    });
    const res = await authenticate({ email: 'test@test.com', password: 'pass' });
    expect(res.data.token).toBe('mock-token');
    expect(res.data.user.id).toBe('u1');
  });
});

describe('auth helper functions', () => {
  test('requestPasswordReset calls correct endpoint', async () => {
    mockApi.onPost('/auth/password-reset/request').reply(200, {});
    await requestPasswordReset('test@test.com');
    expect(mockApi.history.post.length).toBe(1);
    expect(JSON.parse(mockApi.history.post[0].data)).toEqual({ email: 'test@test.com' });
  });

  test('confirmPasswordReset calls correct endpoint', async () => {
    mockApi.onPost('/auth/password-reset/confirm').reply(200, {});
    await confirmPasswordReset('token123', 'newPass123');
    expect(mockApi.history.post.length).toBe(1);
    expect(JSON.parse(mockApi.history.post[0].data)).toEqual({ token: 'token123', newPassword: 'newPass123' });
  });

  test('logoutAllDevices calls correct endpoint', async () => {
    mockApi.onPost('/auth/logout').reply(200, {});
    await logoutAllDevices();
    expect(mockApi.history.post.length).toBe(1);
  });

  test('revokeSession calls correct endpoint', async () => {
    mockApi.onPost('/auth/revoke').reply(200, {});
    await revokeSession();
    expect(JSON.parse(mockApi.history.post[0].data)).toEqual({ reason: 'user_request' });
  });

  test('refreshSession calls correct endpoint', async () => {
    mockApi.onPost('/auth/refresh').reply(200, {});
    await refreshSession();
    expect(mockApi.history.post.length).toBe(1);
  });
});
