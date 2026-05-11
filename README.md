# MeloAmp

![MeloAmp Logo](graphics/logo.png)

**MeloAmp** is a cross-platform desktop music client for the [Melodee](https://melodee.org) API. It uses:

- React 19 + MUI 7 frontend
- Electron + Express shell
- Zustand for UI state
- React Router + i18n + Material theming

It targets Linux, Windows, and macOS.

---

## Table of Contents

- [Repository structure](#repository-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Developer onboarding](#developer-onboarding)
- [Local development workflows](#local-development-workflows)
- [Build and packaging](#build-and-packaging)
- [Testing and coverage](#testing-and-coverage)
- [Application architecture](#application-architecture)
- [Configuration notes](#configuration-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

> Note: This project is intended to run with Yarn 4 and uses a monorepo layout with two independent package folders.

---

## Repository structure

```text
src/
  ui/       # React 19 + MUI + Zustand app
  electron/  # Electron main process + preload + package/build config
scripts/    # Convenience build scripts
AGENTS.md  # Local development and architecture instructions
```

There is no shared workspace root config.

---

## Features

- 🎵 Stream music from a Melodee server
- 🖼️ Browse by artist, album, playlist, and songs
- 🎚️ Playback queue with shuffle/repeat and queue actions
- ✅ Save to playlist and playlist management
- ⭐ Star and rate tracks, then play next / add to queue
- 🎛️ Equalizer and playback preferences
- 🌈 Theme system with multiple visual themes and high-contrast options
- 🌍 i18n with 9 locales
- 🔒 JWT auth flow
- 📦 Linux/Windows/macOS packaging via electron-builder
- 🖥️ Electron shell with optional MPRIS on Linux
- ♻️ Scrobbling support and tray controls
- ♿ Keyboard and media controls support

---

## Prerequisites

- Node.js 20+ (CI uses Node 20)
- Yarn 4.x (repo enforces this via `packageManager` in the root `package.json`)
  - `yarn --version` should report `4.x`
- `rsync` for Linux packaging script
- `rpm-tools` / `fakeroot` / `libxcrypt-compat` on Linux builders as needed
- Git

### Why Yarn 4

This project is now using Yarn 4 across `src/ui` and `src/electron` with deterministic installs per package lockfile:

- `src/ui/yarn.lock`
- `src/electron/yarn.lock` (generated from `src/electron/package.json`)

Enable Yarn 4 for this repo with:

```bash
corepack enable
corepack prepare yarn@4.14.1 --activate
```

Linux dependency examples:

- Arch/Manjaro: `sudo pacman -S --needed base-devel rpm-tools fakeroot libxcrypt-compat`
- Ubuntu/Debian: `sudo apt-get update && sudo apt-get install -y rpm fakeroot libxcrypt-compat`
- Fedora: `sudo dnf install -y rpm-build rpmdevtools fakeroot xz libxcrypt-compat`

---

## Developer onboarding

This section is intentionally detailed so a new contributor can get from clone to a running app in one pass.

### 1) Clone and prepare the repository

```bash
cd /path/to/workspace
git clone https://github.com/melodee/meloamp.git
cd meloamp
```

### 2) Verify Node/Yarn toolchain

Run this once per machine:

```bash
node -v
yarn -v
```

- Required baseline: Node 20+, Yarn 4.x.
- If `yarn -v` is not a 4.x version, run:

```bash
corepack prepare yarn@4.14.1 --activate
```

### 3) Install dependencies (package-by-package)

Install frontend and Electron dependencies separately so each lockfile stays consistent:

```bash
cd src/ui
yarn install
cd ../electron
yarn install
```

Do **not** run install at the repo root.

### 4) Confirm lockfiles were generated in place

You should have:

- `src/ui/yarn.lock`
- `src/electron/yarn.lock`

If you add/update dependencies, keep lockfile updates scoped to the package you changed.

### 5) Start with the fastest local loop (UI work)

```bash
cd src/ui
yarn start
```

Open [http://localhost:3000](http://localhost:3000).

If your API endpoint is not the default, set the env var before startup:

```bash
REACT_APP_API_URL=http://host:4000 yarn start
```

### 6) Run desktop wrapper for integration checks

When you need Electron parity:

```bash
cd src/ui
yarn build
cd ../electron
yarn start
```

Electron serves the built frontend from `src/electron/build` through `http://localhost:3001`.

### 7) API URL and auth quick-checks

In your browser console while the UI is open:

```js
localStorage.setItem('serverUrl', 'http://your-api-host:4000/api/v1')
localStorage.setItem('jwt', '<your-jwt-token>')
location.reload()
```

---

## Local development workflows

### UI-only development

```bash
cd src/ui
yarn start
```

Useful debug helpers:

```js
localStorage.setItem('serverUrl', 'http://your-api-host:4000/api/v1')
localStorage.setItem('jwt', '<your-jwt-token>')
location.reload()
```

### Electron desktop testing

Electron serves the prebuilt React output in `src/electron/build`.

```bash
cd src/ui
yarn build
cd ../electron
yarn start
```

The app serves on `localhost:3001` with fallback ports if already in use.

### Development API URL flow

- `REACT_APP_API_URL` is read during React startup for API base URL overrides.
- `localStorage.serverUrl` (set by frontend) also influences API routing and supports quick re-pointing between environments.

### Test commands

From `src/ui`:

```bash
yarn test              # interactive/watch mode
yarn test --watchAll=false --coverage

yarn test:coverage     # single run + coverage report
```

Coverage output:

- `src/ui/coverage/lcov-report/index.html`
- `src/ui/coverage/lcov.info`
- `src/ui/coverage/coverage-summary.json`

For CI parity use the immutable install command:

```bash
cd src/ui
yarn install --immutable
```

Use this instead of a regular install when you specifically want to enforce lockfile exactness:

```bash
cd src/electron
yarn install --immutable
```

### Useful maintenance commands

If you add or update dependencies, run the package-level install and commit the updated lockfile:

```bash
cd src/ui      # or src/electron
yarn install
```

Use immutable installs for CI and fresh-checkout checks.

---

## Build and packaging

### Production Linux build

```bash
./scripts/build-linux.sh
```

Optional variants:

- `CLEAN=1 ./scripts/build-linux.sh` to force a clean build
- `SKIP_PACKAGE=1 ./scripts/build-linux.sh` to run UI+Electron sync only (no packaging)

Artifacts are written to:

- `src/electron/dist/`

Packages configured in Electron config:

- AppImage
- deb
- tar.gz

### Build for other OSes

Use electron-builder commands from `src/electron`:

```bash
cd src/electron
yarn electron-builder --linux AppImage deb tar.gz

yarn electron-builder --win nsis portable zip

yarn electron-builder --mac dmg zip
```

### CI reference and expected outcomes

GitHub Actions is defined in `.github/workflows/build.yml` and does:

1. Run UI tests with coverage
2. Build UI
3. Build Linux / Windows / macOS Electron packages
4. On tags `v*`, publish GitHub release artifacts

---

## Application architecture

### Frontend (React)

- Location: `src/ui`
- State: Zustand stores (`src/ui/src/queueStore.ts`), not Redux/context for app state
- Themes: MUI theme map in `src/ui/src/themes/`
- i18n: `react-i18next`, locale resources under `src/ui/src/locales/`
- Testing: Jest + React Testing Library, `src/ui/src/test` helpers

### Electron shell

- Location: `src/electron`
- Serves `src/electron/build` via local Express server (default port 3001)
- IPC bridge is exposed in `src/electron/preload.js`
- MPRIS, tray, global media shortcuts and auto-updater are handled in main process
- New IPC channels must also be added to allowlists in preload

### Data and runtime expectations

- Queue and playback preferences are persisted to `localStorage`.
- MPRIS requires D-Bus session bus on Linux.
- DevTools are disabled in packaged builds.
- Set `MELOAMP_DEBUG_CONSOLE=1` for devtools in packaged app sessions.

---

## Configuration notes

- Theme, equalizer, and playback settings are managed in app UI and persisted in local storage.
- Supported locales are configured under `src/ui/src/locales/`.
- Use `localStorage` values with care when switching environments.

## Troubleshooting

- **Node/yarn mismatch**: ensure `yarn -v` is Yarn 4.x.
- **Port conflicts**: Electron static server tries fallback ports if `3001` is occupied.
- **Linux packaging failures**: run `CLEAN=1` and confirm Linux build dependencies are installed.
- **Yarn immutable install fails** with lockfile errors after dependency changes: run `yarn install` in that package to refresh the lockfile.
- **MPRIS not available on Linux**: requires D-Bus session bus (`DBUS_SESSION_BUS_ADDRESS` should be set by desktop session).
- **Fedora AppImage issues**: use `--gtk-version=3` when needed.

---

## Contributing

1. Fork and create a feature branch
2. Keep changes scoped and aligned with existing architecture (`zustand`, i18n, Material-UI patterns)
3. Run tests before opening a PR
4. Prefer small, reviewable commits

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

For support or questions: [info@melodee.org](mailto:info@melodee.org)
