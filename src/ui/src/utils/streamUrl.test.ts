import { getStoredJwt, stripStreamAuth, withStreamAuth } from './streamUrl';

describe('stream URL auth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('withStreamAuth appends the current JWT', () => {
    localStorage.setItem('jwt', 'token-1');
    const result = withStreamAuth('https://api.example/song/stream/abc');
    expect(result).toContain('jwt=token-1');
  });

  test('withStreamAuth is idempotent', () => {
    localStorage.setItem('jwt', 'token-1');
    const once = withStreamAuth('/stream/a');
    const twice = withStreamAuth(once);
    expect(twice).toBe(once);
  });

  test('withStreamAuth returns the URL unchanged without a token', () => {
    expect(withStreamAuth('/stream/a')).toBe('/stream/a');
    expect(withStreamAuth('')).toBe('');
    expect(withStreamAuth(undefined)).toBe('');
  });

  test('stripStreamAuth removes credentials and keeps other params', () => {
    const stripped = stripStreamAuth('https://api.example/stream?a=1&jwt=secret');
    expect(stripped).not.toContain('jwt');
    expect(stripped).toContain('a=1');
  });

  test('stripStreamAuth tolerates junk input', () => {
    expect(stripStreamAuth('')).toBe('');
    expect(stripStreamAuth(null)).toBe('');
    expect(() => stripStreamAuth('not a url with spaces')).not.toThrow();
    expect(stripStreamAuth('not a url with spaces')).not.toContain('jwt');
  });

  test('getStoredJwt reflects localStorage', () => {
    expect(getStoredJwt()).toBeNull();
    localStorage.setItem('jwt', 'abc');
    expect(getStoredJwt()).toBe('abc');
  });
});
