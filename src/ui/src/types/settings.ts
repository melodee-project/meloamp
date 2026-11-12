import { RepeatMode, isRepeatMode } from './playback';

/**
 * The complete persisted user-settings shape.
 *
 * Every writer (theme, language, queue playback prefs, equalizer) must go
 * through `settings.ts` → `updateUserSettings()` so that one writer can never
 * drop another writer's keys.
 */
export interface UserSettings {
  theme: string;
  language: string;
  highContrast: boolean;
  fontScale: number;
  caching: boolean;
  mode: 'light' | 'dark';
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  equalizerGains: number[];
  dashboardRecentLimit: number;
}

export type SettingsPatch = Partial<UserSettings>;
export type SettingsUpdater = (settings: UserSettings) => UserSettings;

/** Number of bands exposed by the equalizer UI (keep in sync with `useEqualizer`). */
export const EQUALIZER_BAND_COUNT = 6;

export const DEFAULT_SETTINGS: Readonly<UserSettings> = Object.freeze({
  theme: 'berryTwilight',
  language: 'en',
  highContrast: false,
  fontScale: 1,
  caching: false,
  mode: 'dark',
  repeatMode: RepeatMode.OFF,
  shuffleEnabled: false,
  equalizerGains: Object.freeze(Array(EQUALIZER_BAND_COUNT).fill(0)) as unknown as number[],
  dashboardRecentLimit: 10,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clampNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

/**
 * Coerce an untrusted (localStorage / migration) value into a valid
 * `UserSettings` object. Unknown keys are dropped; invalid values fall back to
 * the defaults. This is the only place that should know how to repair settings.
 */
export function coerceUserSettings(raw: unknown): UserSettings {
  const value = isRecord(raw) ? raw : {};
  const gains = Array.isArray(value.equalizerGains) ? value.equalizerGains : [];

  return {
    theme: typeof value.theme === 'string' && value.theme.length > 0 ? value.theme : DEFAULT_SETTINGS.theme,
    language: typeof value.language === 'string' && value.language.length > 0 ? value.language : DEFAULT_SETTINGS.language,
    highContrast: typeof value.highContrast === 'boolean' ? value.highContrast : DEFAULT_SETTINGS.highContrast,
    fontScale: clampNumber(value.fontScale, DEFAULT_SETTINGS.fontScale, 0.5, 3),
    caching: typeof value.caching === 'boolean' ? value.caching : DEFAULT_SETTINGS.caching,
    mode: value.mode === 'light' ? 'light' : 'dark',
    repeatMode: isRepeatMode(value.repeatMode) ? value.repeatMode : DEFAULT_SETTINGS.repeatMode,
    shuffleEnabled: typeof value.shuffleEnabled === 'boolean' ? value.shuffleEnabled : DEFAULT_SETTINGS.shuffleEnabled,
    equalizerGains: Array.from({ length: EQUALIZER_BAND_COUNT }, (_, index) =>
      clampNumber(gains[index], 0, -12, 12),
    ),
    dashboardRecentLimit: clampNumber(value.dashboardRecentLimit, DEFAULT_SETTINGS.dashboardRecentLimit, 1, 100),
  };
}
