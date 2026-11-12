# MeloAmp Themes

This folder contains all theme definitions for the MeloAmp application. Themes control the application's color palette, typography, and some UI shape details, allowing users to personalize their experience.

## How Themes Work

- **Theme files:**
  - Each theme lives in a `.ts` file (e.g., `rainbowTheme.ts`) that exports a
    Material-UI (MUI) theme object using `createTheme`. This defines the palette,
    typography, and shape for the theme.
  - Themes are registered once in `registry.ts`; the app, settings UI, gallery,
    and tests all read from that registry. There are no per-theme JSON files:
    user preferences live in a single `userSettings` localStorage entry managed
    by `src/settings.ts`.
- **Theme Selection:**
  - Users can select a theme in the app's Settings page. The selected theme is saved in local storage and applied throughout the app using MUI's `ThemeProvider`.
  - The navigation bar and all UI elements update to reflect the active theme.
- **Theme Map:**
  - The app maintains a `themeMap` object that maps theme names (e.g., `rainbow`, `classic`) to their corresponding theme objects. This allows dynamic switching.

## Adding a New Theme

1. **Create the theme file:**
   - Copy an existing theme file (e.g., `classicTheme.ts`) and modify the
     `palette`, `typography`, and `shape` as desired. Save it as
     `<yourThemeName>Theme.ts`.
2. **Register it** in `themes/registry.ts` (`THEME_CATALOG`) with a unique id and
   category.
3. **Translate it**: add `localThemeGallery.themes.<id>.name` and
   `.description` to `src/locales/en.json` (other locales fall back to English).

2. **Register the Theme in the App:**
   - Import your new theme in `App.tsx` and `index.tsx`:
     ```ts
     import yourThemeNameTheme from './themes/yourThemeNameTheme';
     ```
   - Add it to the `themeMap` object:
     ```ts
     const themeMap = {
       ...
       yourThemeName: yourThemeNameTheme,
     };
     ```

3. **Add to Theme Selection Dropdown:**
   - In `UserSettings.tsx`, add your theme to the `themes` array:
     ```ts
     { label: 'Your Theme Name', value: 'yourThemeName' }
     ```

4. **Test Your Theme:**
   - Start the app, go to Settings, and select your new theme. The UI should update to reflect your customizations.

## Tips
- Use unique and accessible color combinations.
- You can use any valid MUI palette and typography options.
- For inspiration, see the existing theme files in this folder.

---
For more details, see the main project README or the documentation in `docs/requirements.md`.
