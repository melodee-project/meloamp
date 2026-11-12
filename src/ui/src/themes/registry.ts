import { createTheme, Theme } from '@mui/material/styles';

import acidPopTheme from './acidPopTheme';
import bubblegumTheme from './bubblegumTheme';
import candyTheme from './candyTheme';
import classicTheme from './classicTheme';
import darkTheme from './darkTheme';
import fiestaTheme from './fiestaTheme';
import forestTheme from './forestTheme';
import modernMinimalTheme from './modernMinimalTheme';
import oceanTheme from './oceanTheme';
import rainbowTheme from './rainbowTheme';
import retroWaveTheme from './retroWaveTheme';
import scarlettTheme from './scarlettTheme';
import spaceFunkTheme from './spaceFunkTheme';
import sunsetTheme from './sunsetTheme';
import winAmpTheme from './winAmpTheme';
import { getAuroraTheme } from './auroraTheme';
import { getBerryTwilightTheme } from './berryTwilightTheme';
import { getMonoContrastTheme } from './monoContrastTheme';

export type ThemeMode = 'light' | 'dark';
export type ThemeFactory = (mode: ThemeMode) => Theme;
export type ThemeValue = Theme | ThemeFactory;

export type ThemeCategory = 'classic' | 'dark' | 'colorful' | 'wild';

export interface ThemeCatalogEntry {
  id: string;
  category: ThemeCategory;
  value: ThemeValue;
}

/**
 * Single source of truth for built-in themes.
 *
 * Everything (App, settings UI, gallery, tests, `scripts/check.py` parity
 * checks) must derive from this list — do not re-declare theme maps elsewhere.
 */
export const THEME_CATALOG: readonly ThemeCatalogEntry[] = Object.freeze([
  { id: 'classic', category: 'classic', value: classicTheme },
  { id: 'ocean', category: 'classic', value: oceanTheme },
  { id: 'sunset', category: 'classic', value: sunsetTheme },
  { id: 'forest', category: 'classic', value: forestTheme },
  { id: 'dark', category: 'dark', value: darkTheme },
  { id: 'modernMinimal', category: 'dark', value: modernMinimalTheme },
  { id: 'monoContrast', category: 'dark', value: getMonoContrastTheme },
  { id: 'winAmp', category: 'dark', value: winAmpTheme },
  { id: 'retroWave', category: 'colorful', value: retroWaveTheme },
  { id: 'spaceFunk', category: 'colorful', value: spaceFunkTheme },
  { id: 'aurora', category: 'colorful', value: getAuroraTheme },
  { id: 'berryTwilight', category: 'colorful', value: getBerryTwilightTheme },
  { id: 'rainbow', category: 'wild', value: rainbowTheme },
  { id: 'candy', category: 'wild', value: candyTheme },
  { id: 'bubblegum', category: 'wild', value: bubblegumTheme },
  { id: 'acidPop', category: 'wild', value: acidPopTheme },
  { id: 'fiesta', category: 'wild', value: fiestaTheme },
  { id: 'scarlett', category: 'wild', value: scarlettTheme },
]);

export const THEME_MAP: Readonly<Record<string, ThemeValue>> = Object.freeze(
  THEME_CATALOG.reduce<Record<string, ThemeValue>>((map, entry) => {
    map[entry.id] = entry.value;
    return map;
  }, {}),
);

export const THEME_IDS: readonly string[] = Object.freeze(THEME_CATALOG.map((entry) => entry.id));

export const DEFAULT_THEME_ID = 'berryTwilight';

export function isKnownTheme(id: string | undefined | null): boolean {
  return typeof id === 'string' && id in THEME_MAP;
}

/** Resolve a theme id to a concrete MUI theme, falling back to the default. */
export function resolveTheme(id: string | undefined | null, mode: ThemeMode = 'dark'): Theme {
  const key = isKnownTheme(id) ? (id as string) : DEFAULT_THEME_ID;
  const value = THEME_MAP[key];
  return typeof value === 'function' ? value(mode) : value;
}

/** Apply a light/dark mode on top of a fixed (non-factory) theme. */
export function applyMode(baseTheme: Theme, mode: ThemeMode): Theme {
  return createTheme({
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      mode,
      background: mode === 'dark'
        ? { default: '#121212', paper: '#1e1e1e' }
        : baseTheme.palette.background,
      text: mode === 'dark'
        ? { primary: '#ffffff', secondary: 'rgba(255,255,255,0.7)' }
        : baseTheme.palette.text,
    },
  });
}

/**
 * Resolve theme + mode in one step. Factory themes handle their own mode;
 * fixed themes get the palette mode applied.
 */
export function resolveThemedTheme(id: string | undefined | null, mode: ThemeMode): Theme {
  const key = isKnownTheme(id) ? (id as string) : DEFAULT_THEME_ID;
  const value = THEME_MAP[key];
  if (typeof value === 'function') return value(mode);
  return applyMode(value, mode);
}

/**
 * High-contrast overlay. Intentionally hard-coded colours: it overrides the
 * palette completely so every theme meets the same contrast guarantees.
 */
export function getHighContrastTheme(baseTheme: Theme): Theme {
  return createTheme({
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      background: { default: '#000', paper: '#111' },
      text: { primary: '#fff', secondary: '#ff0' },
      primary: { main: '#fff', contrastText: '#000' },
      secondary: { main: '#ff0', contrastText: '#000' },
      divider: '#fff',
      error: { main: '#ff1744' },
      warning: { main: '#ffd600' },
      info: { main: '#00eaff' },
      success: { main: '#76ff03' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            color: '#000',
            backgroundColor: '#fff',
            border: '2px solid #ff0',
            fontWeight: 700,
          },
        },
      },
    },
  });
}
