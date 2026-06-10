export function readJsonFromStorage(storage: Storage, key: string): unknown | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readUser(): { id: string; [k: string]: unknown } | null {
  const fromLocal = readJsonFromStorage(localStorage, 'user');
  if (fromLocal && typeof fromLocal === 'object') return fromLocal as { id: string; [k: string]: unknown };
  const fromSession = readJsonFromStorage(sessionStorage, 'user');
  if (fromSession && typeof fromSession === 'object') return fromSession as { id: string; [k: string]: unknown };
  return null;
}

export function writeUser(user: unknown): void {
  const payload = JSON.stringify(user);
  localStorage.setItem('user', payload);
  sessionStorage.setItem('user', payload);
}

export function clearUser(): void {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
}
