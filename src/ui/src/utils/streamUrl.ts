/**
 * Stream URL authentication.
 *
 * An `<audio>` element cannot send an `Authorization` header, so the streaming
 * endpoint needs the token in the URL. We deliberately keep tokens **out of the
 * persisted queue**: the queue stores the raw stream URL, and the JWT is
 * injected only when playback starts. That way:
 *   - queue state in localStorage never contains credentials;
 *   - a token refreshed by the 401 interceptor is picked up immediately.
 */

const JWT_PARAM = 'jwt';

export function getStoredJwt(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem('jwt');
  } catch {
    return null;
  }
}

/** Remove any auth material from a stream URL (safe to persist). */
export function stripStreamAuth(url: string | undefined | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url, getBaseOrigin());
    parsed.searchParams.delete(JWT_PARAM);
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Attach the current JWT to a stream URL at playback time. */
export function withStreamAuth(url: string | undefined | null): string {
  if (!url) return '';
  const jwt = getStoredJwt();
  if (!jwt) return url;
  try {
    const parsed = new URL(url, getBaseOrigin());
    if (!parsed.searchParams.has(JWT_PARAM)) {
      parsed.searchParams.set(JWT_PARAM, jwt);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function getBaseOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'http://localhost';
}
