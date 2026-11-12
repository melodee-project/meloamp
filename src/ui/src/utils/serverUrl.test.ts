import { normalizeServerUrl } from './serverUrl';

describe('normalizeServerUrl', () => {
  test('appends the API suffix to a site root', () => {
    expect(normalizeServerUrl('https://music.example.com')).toBe('https://music.example.com/api/v1');
  });

  test('does not duplicate the API suffix', () => {
    expect(normalizeServerUrl('https://music.example.com/api/v1')).toBe('https://music.example.com/api/v1');
    expect(normalizeServerUrl('https://music.example.com/api/v1/')).toBe('https://music.example.com/api/v1');
  });

  test('trims whitespace and trailing slashes', () => {
    expect(normalizeServerUrl('  https://music.example.com/  ')).toBe('https://music.example.com/api/v1');
  });

  test('handles empty values', () => {
    expect(normalizeServerUrl('')).toBe('');
    expect(normalizeServerUrl(null)).toBe('');
    expect(normalizeServerUrl(undefined)).toBe('');
  });
});
