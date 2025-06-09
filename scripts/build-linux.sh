#!/usr/bin/env zsh
# build-linux.sh - Build MeloAmp Electron App for Linux platforms only
# Usage: ./scripts/build-linux.sh
set -euo pipefail

# Change to the project root directory (the parent of scripts/)
cd "$(dirname "$0")/.."

# Build notes;
# If you are using a Debian-based system, you may also need to install the following packages:
# sudo apt-get update
# sudo apt-get install rpm fakeroot
# sudo apt-get install -y libxcrypt-compat
# sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils at-spi2-core libuuid1
# sudo apt-get install rpm fakeroot libxcrypt-compat libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils at-spi2-core libuuid1

# If you are using a Fedora-based system, you may need to install the following packages:
# sudo dnf install libxcrypt-compat
# sudo dnf install rpm-build rpmdevtools fakeroot
# sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-core libuuid
# sudo dnf install rpm-build fakeroot gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-core libuuid
# sudo dnf install xz

# If you are using an Arch-based system, you may need to install the following packages:
# sudo pacman -S rpm fakeroot
# sudo pacman -S libxcrypt-compat
# sudo pacman -S rpm fakeroot libxcrypt-compat


# Warn if running as root
if [[ $EUID -eq 0 ]]; then
  echo "[ERROR] Do not run this script as root or with sudo."
  exit 1
fi

# 1. Build React UI
echo '\n[1/5] Building React UI...'
cd src/ui
yarn install --check-files --verbose
yarn build
cd ../..

# 2. Copy React build output to Electron app directory
echo '\n[2/5] Copying React build output to Electron app...'
rm -rf src/electron/build
cp -r src/ui/build src/electron/build
# Remove build from .gitignore temporarily for packaging
if grep -q '^src/electron/build/' .gitignore; then
  sed -i.bak '/^src\/electron\/build\//d' .gitignore
fi

# 3. Install Electron dependencies
echo '\n[3/5] Installing Electron dependencies...'
cd src/electron
yarn install --check-files --verbose

# 4. Build Electron App for Linux only
echo '\n[4/5] Building Electron App for Linux (AppImage, deb, tar.gz)...'
yarn run electron-builder --linux AppImage deb tar.gz

# Restore .gitignore if backup exists
echo '\n[post-build] Restoring .gitignore ignore rules...'
if [ -f .gitignore.bak ]; then
  mv .gitignore.bak .gitignore
fi

echo '\n[5/5] Build complete! Find your packages in src/electron/dist/'
