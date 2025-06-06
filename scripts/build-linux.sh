#!/usr/bin/env zsh
# build-linux.sh - Build MeloAmp Electron App for Linux platforms only
# Usage: ./scripts/build-linux.sh
set -e

# 1. Build React UI
print '\n[1/4] Building React UI...'
cd ../src/ui
npm install
npm run build

# 2. Install Electron dependencies
print '\n[2/4] Installing Electron dependencies...'
cd ../electron
npm install

# 3. Ensure electron-builder is installed
if ! npx electron-builder --version > /dev/null 2>&1; then
  print '\n[3/4] Installing electron-builder...'
  npm install --save-dev electron-builder
fi

# 4. Build Electron App for Linux only
print '\n[4/4] Building Electron App for Linux (AppImage, rpm, deb, snap, pacman, tar.gz)...'
npx electron-builder --linux AppImage rpm deb snap pacman tar.gz

print '\nBuild complete! Find your packages in src/electron/dist/'
