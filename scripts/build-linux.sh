#!/usr/bin/env bash
# build-linux.sh - Build MeloAmp Electron App for Linux platforms only
# Usage: ./scripts/build-linux.sh

# ---
# NOTE: As this build script process bundles the entire Electron app, it may take some time to complete.
# NOTE: It is not unusual for this process to take up to 5 minutes.
# ---

set -euo pipefail

# Change to the project root directory (the parent of scripts/)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Build notes:
#
# Manjaro/Arch-based systems:
#   sudo pacman -S --needed base-devel rpm-tools fakeroot
#   # For AppImage support:
#   sudo pacman -S --needed libxcrypt-compat
#
# Debian/Ubuntu-based systems:
#   sudo apt-get update
#   sudo apt-get install -y rpm fakeroot libxcrypt-compat
#   sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils at-spi2-core libuuid1
#
# Fedora-based systems:
#   sudo dnf install -y rpm-build rpmdevtools fakeroot xz
#   sudo dnf install -y libxcrypt-compat gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-core libuuid

# Cleanup function to restore .gitignore on exit (success or failure)
cleanup() {
  cd "$PROJECT_ROOT"
  if [[ -f .gitignore.bak ]]; then
    echo -e "\n[cleanup] Restoring .gitignore..."
    mv .gitignore.bak .gitignore
  fi
}
trap cleanup EXIT

# Warn if running as root
if [[ $EUID -eq 0 ]]; then
  echo "[ERROR] Do not run this script as root or with sudo."
  exit 1
fi

# Check for required commands
for cmd in yarn node; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "[ERROR] Required command '$cmd' not found. Please install it first."
    exit 1
  fi
done

echo -e "\n[1/5] Building React UI..."
cd "$PROJECT_ROOT/src/ui"
yarn install
yarn build

echo -e "\n[2/5] Copying React build output to Electron app..."
cd "$PROJECT_ROOT"
rm -rf src/electron/build
cp -r src/ui/build src/electron/build

# Remove build from .gitignore temporarily for packaging
if grep -q '^src/electron/build/' .gitignore 2>/dev/null; then
  cp .gitignore .gitignore.bak
  sed -i '/^src\/electron\/build\//d' .gitignore
fi

echo -e "\n[3/5] Installing Electron dependencies..."
cd "$PROJECT_ROOT/src/electron"
yarn install

echo -e "\n[4/5] Building Electron App for Linux..."
echo "    Building tar.gz..."
timeout 300 yarn run electron-builder --linux tar.gz --publish never || true
echo "    Building AppImage..."
timeout 300 yarn run electron-builder --linux AppImage --publish never || true

echo -e "\n[5/5] Build complete! Find your packages in src/electron/dist/"
ls -la "$PROJECT_ROOT/src/electron/dist/" 2>/dev/null || true
