import {
  DEFAULT_THEME_ID,
  THEME_CATALOG,
  THEME_IDS,
  THEME_MAP,
  applyMode,
  getHighContrastTheme,
  isKnownTheme,
  resolveTheme,
  resolveThemedTheme,
} from './registry';

describe('theme registry', () => {
  test('ids are unique and every entry resolves', () => {
    expect(new Set(THEME_IDS).size).toBe(THEME_IDS.length);
    expect(THEME_CATALOG).toHaveLength(18);
    for (const id of THEME_IDS) {
      expect(THEME_MAP[id]).toBeDefined();
      expect(resolveTheme(id)).toBeDefined();
    }
  });

  test('isKnownTheme recognises registered ids only', () => {
    expect(isKnownTheme('ocean')).toBe(true);
    expect(isKnownTheme('nope')).toBe(false);
    expect(isKnownTheme(undefined)).toBe(false);
  });

  test('unknown ids fall back to the default theme', () => {
    expect(resolveTheme('does-not-exist').palette.primary).toBeDefined();
    expect(resolveThemedTheme('does-not-exist', 'light')).toBeDefined();
    expect(DEFAULT_THEME_ID).toBe('berryTwilight');
  });

  test('factory themes honour the requested mode', () => {
    expect(resolveThemedTheme('aurora', 'dark').palette.mode).toBe('dark');
    expect(resolveThemedTheme('aurora', 'light').palette.mode).toBe('light');
  });

  test('fixed themes keep their palette when the mode changes', () => {
    const dark = resolveThemedTheme('ocean', 'dark');
    expect(dark.palette.mode).toBe('dark');
    expect(dark.palette.background.default).toBe('#e0f7fa');
  });

  test('applyMode preserves the theme background and text', () => {
    const base = resolveTheme('classic', 'light');
    const applied = applyMode(base, 'dark');
    expect(applied.palette.mode).toBe('dark');
    expect(applied.palette.background.default).toBe(base.palette.background.default);
    expect(applied.palette.background.paper).toBe(base.palette.background.paper);
  });

  test('high-contrast theme overrides key palette colours', () => {
    const highContrast = getHighContrastTheme(resolveTheme('classic', 'light'));
    expect(highContrast.palette.background.default).toBe('#000');
    expect(highContrast.palette.text.primary).toBe('#fff');
  });
});
