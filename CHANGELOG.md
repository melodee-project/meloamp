# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2026-11-11

### Changed
- **UI build tooling: create-react-app → Vite 8.** `react-scripts` is gone.
  - `vite.config.ts` handles dev/build/test config; `index.html` moved to the
    Vite root; assets build to `build/` as before.
  - Tests run on **Vitest 5 + jsdom** (`vi.*` instead of `jest.*`,
    `@testing-library/jest-dom/vitest`, `vi.hoisted` for mock factories).
    All 281 tests pass; coverage is 45% lines (unchanged).
  - ESLint moved to a flat config (`eslint.config.mjs`) with ESLint 10,
    typescript-eslint, react-hooks and testing-library plugins.
  - `REACT_APP_API_URL` remains supported; `VITE_API_URL` is preferred.
- **All direct dependencies updated to their latest releases** (React 19.3,
  MUI 9.5, axios 1.21, i18next 27, react-i18next 18, react-router 7.18,
  zustand 5.1, react-window 2.5, Electron 45.3, electron-builder 26.18,
  electron-updater 6.8, Express 5.3, Vite 8.3, Vitest 5.1).
### Fixed
- **electron-builder config** moved `nsis`/`portable` options to the build root
  (they were under `build.win`, which electron-builder 26.18 rejects) and
  dropped the redundant `directories.app`. Verified with a real
  `electron-builder --linux dir` package run.

- Node baseline raised to **22.12+** (required by Vite 8, Vitest 5, Electron 45);
  CI now uses Node 22. Root `.yarnrc.yml` enables dependency build scripts so
  Electron's binary postinstall runs.
- TypeScript is pinned to **6.0.3** rather than 7.0.2: the latest
  `typescript-eslint` (8.72) supports `<6.1.0`. Remove the pin once
  typescript-eslint supports TS 7.

### Security
- **All 284 open Dependabot alerts resolved** (4 critical, 152 high,
  104 medium, 24 low) across both lockfiles.
  - Removing `react-scripts` eliminated webpack-dev-server, postcss <8.5.12,
    svgo, launch-editor, shell-quote, websocket-driver, node-forge, serialized
    JavaScript and Babel/rollup advisories from `src/ui`.
  - Upgrading Electron 43 → 45.3.1 cleared the Electron advisories.
  - Patched transitives are pinned with `resolutions` (brace-expansion,
    undici, tar, js-yaml, fast-uri, form-data, @xmldom/xmldom, xml2js,
    browserslist, baseline-browser-mapping, source-map-js).
  - `scripts/check.py repo` now fails if `react-scripts` returns or the Node
    engine range drops below 22.12.


## [1.4.0] - 2026-11-11

### Fixed
- **MPRIS/desktop integration restored** (`src/electron/main.js`)
  - `formatArtUrl` was deleted while two call sites remained, so album-art
    caching, MPRIS metadata, and track-change notifications always threw.
    The helper now lives in `src/electron/helpers.js` and is unit-tested.
  - MPRIS `seek`/`position` values were converted from microseconds twice,
    making media-widget seeking a no-op. Main sends seconds; the renderer
    consumes seconds.
  - A D-Bus error no longer permanently detaches the playback IPC listeners
    (`teardownMpris` only closes the player).
- **Settings no longer clobber each other.** `theme`, `language`,
  `repeatMode`/`shuffleEnabled`, and `equalizerGains` were written by four
  independent `localStorage` writers; App's write dropped the other keys on
  every launch. All writers now go through the merging `src/settings.ts` API,
  backed by one validated `UserSettings` shape.
- **Single theme registry.** `App.tsx` and `index.tsx` each declared a theme
  map and a high-contrast theme, with different defaults. Both now use
  `src/themes/registry.ts` (one default, one high-contrast implementation).
- **Player layout.** The fixed player bar ignored the sidebar offset because
  both the wrapper and the player were `position: fixed`. The player now owns
  its positioning and respects the drawer width.
- **Packaging artifacts no longer collide.** `artifactName` includes
  `${os}`/`${arch}`, and Windows `nsis`/`portable` targets have distinct names
  (previously both produced `meloamp-<version>.exe`, and macOS x64/arm64
  overwrote each other).
- **Windows builds work.** Inline POSIX env vars in package scripts were
  replaced with `src/ui/scripts/run-cra.js`; `build-windows.ps1` no longer
  rewrites `.gitignore` (which it never restored).
- **Committed merge conflicts resolved** in `src/ui/package.json` and
  `src/ui/yarn.lock`; the lockfile is Yarn-4 immutable-install clean again.

### Security
- Stream JWTs are injected at playback time and never persisted in queue
  state (queue URLs previously kept stale tokens and localStorage held them).
- Electron shell: strict CSP + `no-referrer` on the local server, loopback-only
  binding, `sandbox: true`, navigation/window-open handlers, capped and
  timed-out artwork downloads, accelerator allowlist, and preload callbacks
  no longer receive raw IPC events.
- Media-key accelerators supplied by the renderer are validated against an
  allowlist (including blocking Alt+F4/Ctrl+Alt+Del).

### Changed
- API response handling is centralised (`unwrapApiResponse` /
  `unwrapApiPage`); pages no longer guess between three envelope shapes.
- List pages share `usePaginatedList`, and data effects use `useApiEffect`
  so requests are aborted on unmount/dependency change.
- Queue songs derive from the API `Song` type; shuffle restore tracks the
  current song by identity, `toMinimal` keeps `userStarred`, and persistence
  side effects moved out of Zustand updaters.
- Removed the unused next-track preload element/hook (it re-downloaded every
  track without providing gapless playback) and the duplicated theme JSON
  files.
- Electron native surfaces (tray, dialogs, notifications) now use
  `src/electron/strings.js` with dictionaries for all nine supported locales,
  and standard menu roles for OS-localised File/Edit/View menus.
- Missing `en.json` keys added (131), hardcoded JSX/native strings routed
  through `t()`; `scripts/check.py` now fails on missing keys, orphaned locale
  keys, and hardcoded JSX text.

### Added
- `scripts/do-prechecks.py` + `scripts/check.py`: fail-fast pre-push gates for
  whitespace, repository hygiene, i18n, Electron syntax/tests, typecheck,
  lint, UI tests with coverage, and the production build.
- Unit tests for settings, theme registry, error/stream helpers, paginated
  data loading, Electron helpers/strings, and smoke tests for previously
  untested pages. Coverage gates raised from ~25% to a 39% line ratchet.


## [1.3.0] - 2026-07-14

### Added
- **Visual local theme gallery** (`src/ui/src/pages/LocalThemeGallery.tsx`)
  - Replaces the server-dependent ThemesPage at `/themes` with a local gallery
    of all 18 built-in themes, categorized as Classic, Dark, Colorful, and Wild.
  - Each theme card displays live color swatches (primary, secondary, paper
    background, text), the theme's border radius, and a light/dark mode badge.
  - One-click apply persists to localStorage with no server dependency.
  - Hover lift animation and active theme indicator for clear feedback.

### Fixed
- **Queue playback not advancing to next track** (`src/ui/src/pages/Player.tsx`)
  - Added `onEnded` handler to the `<audio>` element that auto-advances to
    the next track, wraps to the start (repeat-all), restarts (repeat-one),
    or stops at the end of the queue.
- **`got.stream is not a function` crash in album art caching**
  (`src/electron/main.js`)
  - Replaced `got` (v14, ESM-only, no `got.stream` function) with native
    Node.js `https`/`http` modules in `cacheArtUrl`, eliminating the
    ESM/CJS compatibility issue and the runtime crash on track change.

### Changed
- All version references bumped to `1.3.0` (UI and Electron packages now
  share a single version number).

## [1.2.0] - 2026-06-10

### Added
- **API hardening**
  - 401-response interceptor that automatically calls `/auth/refresh`,
    deduplicates concurrent refreshes, retries the original request with the
  new token, and only clears the JWT when the refresh itself fails.
  - Auth-endpoint allowlist (`/auth/authenticate`, `/auth/refresh`,
    `/auth/password-reset/*`, `/auth/revoke`, `/auth/logout`) to prevent
    refresh loops on legitimate auth failures.
  - New `src/ui/src/storage.ts` centralizing JSON read/write of the `user`
    blob across `localStorage` and `sessionStorage`; reused by `api.ts`,
    `App.tsx`, and `LoginPage.tsx`.
  - 11 new unit tests covering the refresh-on-401 path, the clear-on-final-
    failure path, and every `storage` helper.

- **Player refactor (`src/ui/src/pages/Player.tsx`)**
  - 1,361-line monolith split into a 440-line orchestrator plus seven focused
    custom hooks:
    - `useEqualizer` — Web Audio peaking-filter chain with EQ band persistence.
    - `useScrobble` — debounced `NOW_PLAYING` / `PLAYED` scrobble timer.
    - `useMediaSession` — Media Session metadata + action handlers.
    - `usePlaybackBridge` — MPRIS, global media-key, and window-custom-event
      bridges with proper listener cleanup.
    - `useNextTrackPreload` — gapless next-track preloading.
    - `usePlaybackErrorRecovery` — retry / skip / stop logic with bounded
      consecutive-failure counter.
    - `useTrayUpdate` — now-playing payload pushed to the Electron tray.

- **Electron main process hardening (`src/electron/main.js`)**
  - MPRIS handlers hoisted to named module-scope functions
    (`handleMprisPlaybackInfo`, `handleMprisPositionUpdate`) so
    `teardownMpris` removes only the specific listener reference instead of
    calling `removeAllListeners`.
  - Tray menu now rebuilds reactively on `mainWindow` `show` / `hide` events;
    the recursive `updateTrayMenu` self-call in the click handler is gone.
  - `dialog.showMessageBox` calls route through a new `showOwnerSafeDialog`
    helper that passes `undefined` as owner when `mainWindow` is destroyed
    (tray-only mode).
  - `index.html` served with `Cache-Control: no-cache, no-store,
    must-revalidate` so packaged users receive the latest shell after an
    auto-update.
  - Dead `formatArtUrl` helper removed; `format` debug-log block in the
    MPRIS metadata path trimmed.

- **Tooling**
  - TypeScript `target` raised from `es5` to `es2020` for smaller bundles.
  - `jest` coverage thresholds raised (global 25% lines / 25% statements /
    20% functions / 17% branches) with per-file targets: `api.ts` ≥ 80%,
    `queueStore.ts` ≥ 80% branches + 90% lines, `storage.ts` ≥ 80%.

### Changed
- `useKeyboardShortcuts` `formatShortcut` uses
  `navigator.userAgentData?.platform` with `navigator.userAgent` fallback
  instead of the deprecated `navigator.platform`.
- `MinimalSong` in `queueStore` is now derived from `Song` via `Pick<>` so
  the persisted shape cannot drift from the runtime type.
- `App.tsx` replaces a hand-rolled inline SVG `CircularProgress` with the
  real MUI component.
- Suppress the "browserslist caniuse-lite data is 6 months old" warning via
  `BROWSERSLIST_IGNORE_OLD_DATA=1` on all `react-scripts` scripts. The bundled
  `caniuse-lite@1.0.30001797` data lags upstream and the warning is not
  actionable from the project; it is silenced in dev, test, and CI builds.


### Fixed
- `ArtistCard.test.tsx` no longer imports a non-existent `ArtistCardProps`
  named export and uses `container.querySelector` for the click test,
  eliminating two pre-existing build-time TS errors.
- `queueStore.test.ts` `mockSong` now returns a fully-typed `Song` (with
  `as any` for `Artist`/`Album` shape), resolving the cascading TS errors
  the production build surfaced.
- Pre-existing test-side `act(...)` warnings are unchanged but no longer
  cause `tsc --noEmit` failures that block `yarn build`.

## [1.1.0] - 2026-05-11

### Added
- **Yarn 4 migration and Electron infrastructure overhaul**
  - Repository switched to Yarn 4.14.1 with per-package immutable lockfiles.
  - `scripts/build-linux.sh` gains deterministic install behavior with
    `.yarn-state.yml` freshness check, `CLEAN=1` and `SKIP_PACKAGE=1` flags,
    and `electron-cache` / `electron-builder-cache` warmup.
  - Internal Express static server (port 3001) gains dynamic port fallback
    (3001-3003, then 0) and a secure `shell.openExternal` IPC handler exposed
    through `preload.js`.
  - CI workflow (`.github/workflows/build.yml`) fans out to Linux / Windows /
    macOS packaging jobs and uploads a `coverage-report` artifact.
  - `AGENTS.md` added as the canonical local-development reference.
  - Jest coverage reporting (text, lcov, json-summary) configured for the
    UI package; `node_modules` and `setupTests.ts` excluded from coverage.

- **Feature pages**
  - **Analytics** dashboard, **Advanced Search**, and **Admin Users** pages
    (admin-only route).
  - **Recommendations**, **Shares**, **Smart Playlists**, and **Themes**
    pages with full functionality (create, share, vote, theme switcher).
  - Browse views support per-entity filtering on Favorites.
  - New shared `EmptyState`, `ErrorState`, and `LoadingState` components
    used across list views for consistent UX.

- **UI hardening**
  - Hook stability improvements: `useEffect` dependency arrays audited
    across `App.tsx`, `SearchPage`, `LoginPage`, and `Player`.
  - `react-i18next` locales and `theme` system extended with several new
    palettes (aurora, berryTwilight, monoContrast, retroWave, spaceFunk,
    acidPop, fiesta, scarlett, winAmp).

- **Test infrastructure**
  - 50+ new unit tests across `App`, `Navigation`, `Player`,
    `Search`, `StateComponents`, `i18n`, `debug`, and `queueStore`,
    using `axios-mock-adapter` via the shared `setupApiMock()` helper.
  - Per-file coverage thresholds (api, queueStore) defined.
  - `npm-check-updates` / `ncu` added to devDependencies for audit runs.

### Changed
- **CI**: `setup-node` no longer uses Yarn cache (avoids stale lockfile
  issues with immutable installs). `electron-builder --publish never`
  enforced for all build jobs.
- API endpoints migrated from plural `users` to singular `user` for
  authentication / me routes.
- README rewritten with feature matrix, repository structure, prerequisites,
  step-by-step developer onboarding, and troubleshooting section.
- `package.json` files list trimmed to drop `node_modules` from packaged
  Electron artifacts.

### Fixed
- `BrowseArtists` sort change no longer triggers default form submission.
- ESLint warnings about missing navigation effect dependencies in
  `SearchPage` resolved.

## [1.0.0] - 2025-12-18

First feature-complete release. Cross-platform desktop client for the
[Melodee](https://melodee.org) API.

### Added

- **Frontend (`src/ui`)** — React 19 + MUI 7 + Zustand SPA built with CRA.
  - **Authentication**: JWT login flow with `/auth/authenticate`,
    password-reset request / confirm endpoints, session revocation.
  - **Browsing**: artists, albums, songs, playlists, favorites, genres
    (with detail route), search (basic + advanced), charts, history,
    requests, and artist lookup.
  - **Playback**: queue with shuffle, repeat (off/all/one), play-next /
    add-to-queue, drag-and-drop reorder via `@hello-pangea/dnd`, undo
    for remove and clear, equalizer (60 Hz – 10 kHz bands), volume and
    progress controls, keyboard shortcuts (`space`, `Ctrl+K`,
    `Ctrl+Shift+P`, `Ctrl+←/→`, `Ctrl+Q`, `Ctrl+,`), command palette.
  - **Library management**: playlist CRUD, share, import, public-share
    playback route. Star / rate tracks, add to favorites.
  - **Themes**: 17+ visual themes (classic, ocean, sunset, forest, dark,
    modernMinimal, rainbow, candy, bubblegum, aurora, berryTwilight,
    monoContrast, retroWave, spaceFunk, acidPop, fiesta, scarlett, winAmp)
    with light / dark mode and high-contrast variant.
  - **i18n**: 9 locales (en, de, es, fr, it, ja, pt, ru, zh-CN) via
    `react-i18next`.
  - **Scrobbling**: client-side `NOW_PLAYING` (after 10 s) and `PLAYED`
    (after 70% of duration) reports.
  - **State**: Zustand `useQueueStore` with `MinimalSong` projection for
    localStorage persistence (debounced 1 s).

- **Electron shell (`src/electron`)** — Electron 40 + Express 5 with
  internal static server on port 3001 serving the CRA build.
  - **MPRIS** integration on Linux for OS-level media controls (D-Bus
    session bus auto-detected, gracefully disabled when unavailable).
  - **Global media keys** (`MediaPlayPause`, `MediaNextTrack`, etc.)
    registered via Electron `globalShortcut`.
  - **System tray** with now-playing tooltip, show / hide window toggle,
    and play / pause / next / previous controls.
  - **Desktop notifications** on track change.
  - **Auto-updater** via `electron-updater` with GitHub release channel
    (opt-in download prompt, install-on-quit).
  - **Packaging**: `electron-builder` config for AppImage + tar.gz on
    Linux, NSIS + portable + zip on Windows, dmg + zip on macOS (x64
    and arm64). Application icon, product name, app id
    `org.melodee.meloamp`.

- **Build / tooling**
  - CRA 5 (`react-scripts`) with TypeScript 5, ES2020 target,
    `resolveJsonModule`, `isolatedModules`.
  - `react-app` ESLint preset; Jest + React Testing Library.
  - `scripts/build-linux.sh` for one-command Linux packaging.
  - GitHub Actions workflow building and uploading Linux, Windows, and
    macOS artifacts and publishing a GitHub release on `v*` tags.

### Notes
- This is the initial public release; the `package.json` versions
  (`ui@1.2.0` / `electron@1.1.0`) reflect in-development iteration labels;
  from 1.3.0 onward both packages share a single version number.
  that predate this changelog.
- The 80+ commits before `1.0.0` are squashed here; see `git log` for
  the full pre-release history.
