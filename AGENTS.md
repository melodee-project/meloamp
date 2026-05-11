# AGENTS.md

## Architecture

Two-package monorepo with no shared workspace config:
- `src/ui/` — React 19 + MUI 7 + Zustand CRA app (the entire frontend)
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

**Run tests:**
```sh
cd src/ui && yarn test --watchAll=false             # single run
cd src/ui && yarn test                               # watch mode (CRA default)
```

**Production Linux build:**
```sh
./scripts/build-linux.sh                             # AppImage + deb + tar.gz → src/electron/dist/
CLEAN=1 ./scripts/build-linux.sh                    # full clean
SKIP_PACKAGE=1 ./scripts/build-linux.sh             # UI build only, no Electron packaging
```

## Package Manager

Use **yarn** (classic v1). The root `package.json` enforces `yarn@1.22.22`. Do not use npm in `src/ui/` or `src/electron/` — mixing lockfiles breaks CI. `package-lock.json` is gitignored in both sub-packages.

## Testing

- Framework: Jest + React Testing Library (via CRA/react-scripts)
- API mocking: **axios-mock-adapter** attached to the shared axios instance in `src/ui/src/api.ts`. Test helpers in `src/ui/src/test/apiMock.ts` and `src/ui/src/test/testUtils.ts`
- Always call `setupApiMock()` / `cleanupApiMock()` in beforeEach/afterEach when mocking API
- `setupTests.ts` polyfills TextEncoder/TextDecoder (needed by react-router v7), matchMedia, ResizeObserver, IntersectionObserver, and clears localStorage between tests

## Key Conventions

- State: Zustand stores (e.g., `src/ui/src/queueStore.ts`). Do not introduce Redux or Context-based state management.
- i18n: All user-visible strings must go through `react-i18next` (`t()` calls). Locales in `src/ui/src/locales/` (9 languages).
- Theming: MUI `createTheme` in `src/ui/src/themes/`. Theme map registered in `App.tsx` and `index.tsx`. No hard-coded colors.
- IPC channels: Electron↔renderer communication uses `meloamp-` prefixed channels defined in `preload.js`. Do not add new IPC channels without adding them to the `validChannels` allowlist in `preload.js`.

## Electron Gotchas

- MPRIS (Linux media integration) requires D-Bus session bus; automatically disabled if `$DBUS_SESSION_BUS_ADDRESS` is unset.
- DevTools are disabled in packaged builds. Re-enable with `MELOAMP_DEBUG_CONSOLE=1`.
- Auto-updater only runs in packaged builds (`app.isPackaged`).
- Express 5 is used in `main.js`; route wildcards use `{*splat}` syntax, not `*`.
- Fedora AppImage may need `--gtk-version=3` flag.

## CI

GitHub Actions workflow: `.github/workflows/build.yml`
- Flow: test → build-ui → build-linux / build-windows / build-macos (parallel)
- Tags matching `v*` trigger a GitHub Release with all platform artifacts
- Uses Node 20, yarn with frozen lockfile
- `CI=false` env set during UI build (CRA treats warnings as errors in CI by default)