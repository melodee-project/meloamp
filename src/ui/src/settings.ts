import {
  DEFAULT_SETTINGS,
  SettingsPatch,
  UserSettings,
  coerceUserSettings,
} from './types/settings';

export const USER_SETTINGS_KEY = 'userSettings';

/** Fired on `window` after settings are written so live UI can re-sync. */
export const USER_SETTINGS_EVENT = 'meloamp:user-settings-changed';

const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Read settings, repairing malformed or partial payloads. */
export function readUserSettings(): UserSettings {
  const store = storage();
  if (!store) return coerceUserSettings(DEFAULT_SETTINGS);
  try {
    const raw = store.getItem(USER_SETTINGS_KEY);
    if (!raw) return coerceUserSettings(DEFAULT_SETTINGS);
    return coerceUserSettings(JSON.parse(raw));
  } catch {
    return coerceUserSettings(DEFAULT_SETTINGS);
  }
}

function emit(settings: UserSettings): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent<UserSettings>(USER_SETTINGS_EVENT, { detail: settings }));
}

/** Replace the full settings object. Prefer `updateUserSettings`. */
export function writeUserSettings(settings: UserSettings): UserSettings {
  const normalized = coerceUserSettings(settings);
  try {
    storage()?.setItem(USER_SETTINGS_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn('[settings] Failed to persist user settings:', error);
  }
  emit(normalized);
  return normalized;
}

/**
 * Merge a patch into the current settings and persist the result.
 *
 * This is the *only* supported write path: it preserves keys owned by other
 * subsystems (equalizer gains, repeat/shuffle, language, ...).
 */
export function updateUserSettings(patch: SettingsPatch): UserSettings {
  return writeUserSettings({ ...readUserSettings(), ...patch });
}

/** Merge the result of an updater function into the current settings. */
export function updateUserSettingsWith(updater: (current: UserSettings) => SettingsPatch): UserSettings {
  return writeUserSettings({ ...readUserSettings(), ...updater(readUserSettings()) });
}

/** Subscribe to settings changes from any subsystem. Returns an unsubscribe fn. */
export function subscribeToUserSettings(listener: (settings: UserSettings) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<UserSettings>).detail;
    listener(detail ?? readUserSettings());
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === USER_SETTINGS_KEY) listener(readUserSettings());
  };

  window.addEventListener(USER_SETTINGS_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(USER_SETTINGS_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
