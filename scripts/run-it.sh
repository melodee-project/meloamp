#!/usr/bin/env bash
# run-it.sh - Build and launch MeloAmp locally (Linux/macOS).
# Usage: ./scripts/run-it.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="$ROOT_DIR/src/ui"
ELECTRON_DIR="$ROOT_DIR/src/electron"

log() { printf '\n[%s] %s\n' "$1" "$2"; }

log "1/4" "Installing UI dependencies (Yarn 4)"
(cd "$UI_DIR" && yarn install --immutable)

log "2/4" "Building the React UI"
(cd "$UI_DIR" && CI=true yarn build)

log "3/4" "Syncing UI build into the Electron shell"
mkdir -p "$ELECTRON_DIR/build"
rsync -a --delete "$UI_DIR/build/" "$ELECTRON_DIR/build/"

log "4/4" "Installing Electron dependencies and launching"
(cd "$ELECTRON_DIR" && yarn install --immutable && yarn start)
