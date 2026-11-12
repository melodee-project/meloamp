import {
  USER_SETTINGS_KEY,
  readUserSettings,
  subscribeToUserSettings,
  updateUserSettings,
  updateUserSettingsWith,
  writeUserSettings,
} from './settings';
import { DEFAULT_SETTINGS, EQUALIZER_BAND_COUNT, coerceUserSettings } from './types/settings';
import { RepeatMode } from './types/playback';

describe('settings store', () => {
  test('returns defaults when nothing is stored', () => {
    expect(readUserSettings()).toEqual(DEFAULT_SETTINGS);
  });

  test('repairs malformed JSON and partial payloads', () => {
    localStorage.setItem(USER_SETTINGS_KEY, '{not json');
    expect(readUserSettings().theme).toBe(DEFAULT_SETTINGS.theme);

    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify({ theme: 'ocean', fontScale: 99 }));
    const repaired = readUserSettings();
    expect(repaired.theme).toBe('ocean');
    expect(repaired.fontScale).toBe(3);
    expect(repaired.equalizerGains).toHaveLength(EQUALIZER_BAND_COUNT);
  });

  test('coerceUserSettings drops unknown keys and clamps values', () => {
    const result = coerceUserSettings({
      theme: '',
      language: 42,
      highContrast: 'yes',
      mode: 'neon',
      repeatMode: 'sometimes',
      equalizerGains: [99, -99, 1],
      dashboardRecentLimit: 500,
      extra: 'ignored',
    });

    expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(result.language).toBe(DEFAULT_SETTINGS.language);
    expect(result.highContrast).toBe(false);
    expect(result.mode).toBe('dark');
    expect(result.repeatMode).toBe(RepeatMode.OFF);
    expect(result.equalizerGains[0]).toBe(12);
    expect(result.equalizerGains[1]).toBe(-12);
    expect(result.equalizerGains.slice(3)).toEqual([0, 0, 0]);
    expect(result.dashboardRecentLimit).toBe(100);
    expect('extra' in result).toBe(false);
  });

  test('updateUserSettings merges instead of clobbering other owners', () => {
    updateUserSettings({ theme: 'ocean' });
    updateUserSettings({ repeatMode: RepeatMode.ALL });
    updateUserSettings({ equalizerGains: [1, 2, 3, 4, 5, 6] });
    updateUserSettings({ language: 'de' });

    const merged = readUserSettings();
    expect(merged.theme).toBe('ocean');
    expect(merged.repeatMode).toBe(RepeatMode.ALL);
    expect(merged.equalizerGains).toEqual([1, 2, 3, 4, 5, 6]);
    expect(merged.language).toBe('de');
  });

  test('updateUserSettingsWith derives a patch from current values', () => {
    writeUserSettings({ ...DEFAULT_SETTINGS, fontScale: 1.5 });
    const next = updateUserSettingsWith((current) => ({ fontScale: current.fontScale + 0.25 }));
    expect(next.fontScale).toBe(1.75);
  });

  test('subscribeToUserSettings receives local updates and unsubscribes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToUserSettings(listener);

    updateUserSettings({ theme: 'forest' });
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls.at(-1)?.[0].theme).toBe('forest');

    unsubscribe();
    updateUserSettings({ theme: 'dark' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('does not throw when persistence fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(() => updateUserSettings({ theme: 'ocean' })).not.toThrow();
    expect(warn).toHaveBeenCalled();

    spy.mockRestore();
    warn.mockRestore();
  });
});
