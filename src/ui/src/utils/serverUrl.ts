/**
 * Normalise the Melodee server URL a user pastes into the login form.
 *
 * Melodee's API lives under `/api/v1`. Users commonly enter either the site
 * root (`https://music.example.com`) or the API root with a trailing slash;
 * both must resolve to the same base URL. A wrong base URL is a silent
 * connection failure (the site root redirects to the HTML login page), so this
 * is applied everywhere the base URL is stored or read.
 */
const API_SUFFIX = '/api/v1';

export function normalizeServerUrl(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';

  const withoutTrailingSlashes = trimmed.replace(/\/+$/, '');
  if (withoutTrailingSlashes.toLowerCase().endsWith(API_SUFFIX)) {
    return withoutTrailingSlashes;
  }
  return `${withoutTrailingSlashes}${API_SUFFIX}`;
}
