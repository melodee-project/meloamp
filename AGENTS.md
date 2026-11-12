# AGENTS.md

## Architecture

Two-package monorepo with no shared workspace config:
- `src/ui/` — React 19 + MUI 9 + Zustand CRA app (the entire frontend)
- `src/electron/` — Electron main process shell that serves the React build via a local Express server on port 3001

Build flow: `src/ui` builds to `src/ui/build/` → rsynced to `src/electron/build/` → Electron serves it. There is no hot-reload bridge between CRA dev server and Electron by default.

## Commands

**UI dev server (fastest feedback loop):**
```sh
cd src/ui && yarn install && yarn start            # http://localhost:3000
REACT_APP_API_URL=http://host:4000 yarn start       # point at a real API
```

**Run Electron desktop app:**
```sh
cd src/ui && yarn install && yarn build
cd src/electron && yarn install && yarn start       # serves from src/electron/build
```

**Run tests and quality gates:**
```sh
cd src/ui && yarn test --watchAll=false             # single run
cd src/ui && yarn test                               # watch mode (CRA default)
cd src/ui && yarn test:coverage                      # single run + thresholds
cd src/ui && yarn typecheck && yarn lint             # tsc + eslint (zero warnings)
cd src/electron && yarn test                         # node --test helpers/strings
```

**Run all pre-push checks (from the repo root):**
```sh
python3 scripts/do-prechecks.py          # everything (tests + production build)
python3 scripts/do-prechecks.py --fast   # skip tests/build for a quick pass
```

**Production Linux build:**
```sh
./scripts/build-linux.sh                             # AppImage + deb + tar.gz → src/electron/dist/
CLEAN=1 ./scripts/build-linux.sh                    # full clean
SKIP_PACKAGE=1 ./scripts/build-linux.sh             # UI build only, no Electron packaging
```

## Package Manager
	
Use **yarn** 4.x (root `package.json` uses `packageManager`).
Keep installs lockfile-based and deterministic with immutable lockfile installs.
Do not use npm in `src/ui/` or `src/electron/` — mixing lockfiles breaks CI.

Recommended setup:
```sh
corepack enable
corepack prepare yarn@4.14.1 --activate
```

## Testing

- Framework: Jest + React Testing Library (via CRA/react-scripts)
- API mocking: **axios-mock-adapter** attached to the shared axios instance in `src/ui/src/api.ts`. Test helpers in `src/ui/src/test/apiMock.ts` and `src/ui/src/test/testUtils.ts`
- Use `settle()`/`findBy*` so in-flight requests finish before a test ends; pending `setState` leaks into the next test otherwise
- Coverage thresholds in `src/ui/package.json` are a ratchet (global + api/queueStore/settings/storage/registry/utils). Raise them when you add tests; never lower them to make a build pass
- Always call `setupApiMock()` / `cleanupApiMock()` in beforeEach/afterEach when mocking API
- `setupTests.ts` polyfills TextEncoder/TextDecoder (needed by react-router v7), matchMedia, ResizeObserver, IntersectionObserver, and clears localStorage between tests

## Key Conventions

- State: Zustand stores (e.g., `src/ui/src/queueStore.ts`). Do not introduce Redux or Context-based state management.
- Settings: `src/settings.ts` is the **only** write path for `userSettings` (`updateUserSettings` merges). Never write the key directly — four subsystems (theme/language/playback/equalizer) share it.
- i18n: All user-visible strings must go through `react-i18next` (`t()` calls), including native Electron surfaces (`src/electron/strings.js`). Locales in `src/ui/src/locales/` (9 languages). `en.json` must contain every key used in code; other locales fall back to English and must not contain orphan keys. `scripts/check.py i18n` enforces this.
- Theming: MUI `createTheme` in `src/ui/src/themes/`. `themes/registry.ts` is the single theme registry (ids, categories, defaults, high-contrast); do not re-declare theme maps. No hard-coded colours outside theme definitions.
- API: unwrap envelopes with `unwrapApiResponse` / `unwrapApiPage`; use `useApiEffect` for cancellable data effects and `usePaginatedList` for list pages.
- Stream URLs: queue entries store raw URLs; the JWT is injected at playback time via `utils/streamUrl.ts`. Never persist credentials.
- IPC channels: Electron↔renderer communication uses `meloamp-` prefixed channels. Add new inbound channels to `INBOUND_CHANNELS` in `preload.js`; `scripts/check.py repo` verifies main/preload stay in sync.
- Main-process helpers: keep pure logic in `src/electron/helpers.js` and translations in `strings.js` so they can be unit-tested with `node --test` (no display server).

## Electron Gotchas

- MPRIS (Linux media integration) requires D-Bus session bus; automatically disabled if `$DBUS_SESSION_BUS_ADDRESS` is unset.
- DevTools are disabled in packaged builds. Re-enable with `MELOAMP_DEBUG_CONSOLE=1`.
- Auto-updater only runs in packaged builds (`app.isPackaged`).
- Express 5 is used in `main.js`; route wildcards use `{*splat}` syntax, not `*`.
- The static server binds `127.0.0.1` and sends a strict CSP; keep new network origins in mind if you add APIs.
- macOS builds use hardened runtime + `resources/entitlements.mac.plist`; signing/notarization needs `CSC_*`/`APPLE_*` env vars in CI.
- Fedora AppImage may need `--gtk-version=3` flag.

## CI

GitHub Actions workflow: `.github/workflows/build.yml`
- Flow: static checks (prechecks --fast) → test → build-ui → build-linux / build-windows / build-macos (parallel)
- Tags matching `v*` trigger a GitHub Release with all platform artifacts
- Uses Node 20, yarn with immutable lockfile installs
- `CI=false` env set during UI build (CRA treats warnings as errors in CI by default)
