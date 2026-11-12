import { activeNavItemSx, appBarSx, chromeColors, drawerPaperSx } from './chrome';
import { getHighContrastTheme, resolveThemedTheme } from './registry';

describe('theme chrome', () => {
  test('light themes produce visibly different header/nav backgrounds', () => {
    const classic = resolveThemedTheme('classic', 'light');
    const ocean = resolveThemedTheme('ocean', 'light');
    const retroWave = resolveThemedTheme('retroWave', 'light');

    expect(chromeColors(classic).appBarBackground).not.toBe(chromeColors(ocean).appBarBackground);
    expect(chromeColors(classic).drawerBackground).not.toBe(chromeColors(retroWave).drawerBackground);
  });

  test('accent follows the theme primary colour', () => {
    const ocean = resolveThemedTheme('ocean', 'light');
    expect(chromeColors(ocean).accent).toBe(ocean.palette.primary.main);
    expect(appBarSx(ocean).borderBottom).toContain(ocean.palette.primary.main);
    expect(drawerPaperSx(ocean).borderRight).toContain(ocean.palette.primary.main);
  });

  test('active navigation item uses primary/contrastText for readability', () => {
    const theme = resolveThemedTheme('retroWave', 'dark');
    const active = activeNavItemSx(theme);
    expect(active.backgroundColor).toBe(theme.palette.primary.main);
    expect(active.color).toBe(theme.palette.primary.contrastText);
  });

  test('high-contrast mode keeps the chrome readable', () => {
    const highContrast = getHighContrastTheme(resolveThemedTheme('classic', 'light'));
    const colors = chromeColors(highContrast);
    expect(colors.appBarBackground).toBe('#000');
    expect(colors.appBarText).toBe('#fff');
    expect(colors.activeItemText).toBe('#000');
  });
});
