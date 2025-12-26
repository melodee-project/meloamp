#!/usr/bin/env bash
set -euo pipefail

# Fast(er) local Linux build for MeloAmp (React UI + Electron packaging)
#
# Key changes vs the original:
# - Avoid repeated installs when node_modules look up-to-date
# - Use Yarn offline preference + frozen lockfile (repro + faster when cache is warm)
# - Build both Linux targets in a single electron-builder run (avoids double packaging)
# - Optional CLEAN=1 to wipe dist/build between runs
#
# Usage:
#   ./build-linux-fast.sh
#   CLEAN=1 ./build-linux-fast.sh          # full clean build
#   SKIP_PACKAGE=1 ./build-linux-fast.sh   # build UI + electron JS only (no packaging)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="$ROOT_DIR/src/ui"
ELECTRON_DIR="$ROOT_DIR/src/electron"
DIST_DIR="$ELECTRON_DIR/dist"
BUILD_DIR="$ELECTRON_DIR/build"

log() { printf "\n[%(%F %T)T] %s\n" -1 "$*"; }

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }; }

yarn_install_if_needed() {
  local dir="$1"
  local lock="$dir/yarn.lock"
  local nm="$dir/node_modules"
  local integrity="$nm/.yarn-integrity"

  if [[ ! -d "$nm" ]]; then
    log "yarn install ($dir) – node_modules missing"
  elif [[ -f "$lock" && ! -f "$integrity" ]]; then
    log "yarn install ($dir) – .yarn-integrity missing"
  elif [[ -f "$lock" && "$lock" -nt "$integrity" ]]; then
    log "yarn install ($dir) – yarn.lock newer than install"
  else
    log "yarn install ($dir) – skipped (looks up-to-date)"
    return 0
  fi

  (cd "$dir" && yarn install --frozen-lockfile)
}

main() {
  log "Step 0/5: Sanity checks"
  need_cmd node
  need_cmd yarn
  need_cmd rsync

  # If you ever run this script with sudo, you'll lose per-user caches (Electron/Yarn)
  # and builds will be slower. Prefer running as a normal user.
  log "Node: $(node -v) | Yarn: $(yarn -v) | User: $(id -un) | HOME: $HOME"

  if [[ "${CLEAN:-0}" == "1" ]]; then
    log "CLEAN=1 => removing $DIST_DIR and $BUILD_DIR"
    rm -rf "$DIST_DIR" "$BUILD_DIR"
  fi

  log "Step 1/5: Install + build React UI"
  yarn_install_if_needed "$UI_DIR"

  # If your UI is CRA, uncomment to speed builds (no source maps):
  # export GENERATE_SOURCEMAP=false
  (cd "$UI_DIR" && time yarn build)

  log "Step 2/5: Sync UI build -> Electron build folder"
  mkdir -p "$BUILD_DIR"
  rsync -a --delete "$UI_DIR/build/" "$BUILD_DIR/"

  log "Step 3/5: Install Electron deps"
  yarn_install_if_needed "$ELECTRON_DIR"

  log "Step 4/5: Package Electron app (linux)"
  if [[ "${SKIP_PACKAGE:-0}" == "1" ]]; then
    log "SKIP_PACKAGE=1 => skipping packaging step"
    exit 0
  fi

  # Ensure electron-builder cache stays warm between runs
  export ELECTRON_CACHE="${ELECTRON_CACHE:-$HOME/.cache/electron}"
  export ELECTRON_BUILDER_CACHE="${ELECTRON_BUILDER_CACHE:-$HOME/.cache/electron-builder}"

  # Build AppImage + deb + tar.gz in ONE run (much faster than separate runs)
  (cd "$ELECTRON_DIR" && time yarn electron-builder --linux AppImage deb tar.gz)

  log "Done. Artifacts should be in: $DIST_DIR"
}

main "$@"
