#!/usr/bin/env zsh
# build-it.sh - Build MeloAmp Electron App for all major platforms
# Usage: ./scripts/build-it.sh
set -e

# 1. Build React UI
print '\n[1/5] Building React UI...'
cd ../src/ui
npm install
npm run build

# 2. Install Electron dependencies
print '\n[2/5] Installing Electron dependencies...'
cd ../electron
npm install

# 3. Ensure electron-builder is installed
if ! npx electron-builder --version > /dev/null 2>&1; then
  print '\n[3/5] Installing electron-builder...'
  npm install --save-dev electron-builder
fi

# 4. Build Electron App for all major platforms
print '\n[4/5] Building Electron App for all platforms (Linux, Windows, macOS where possible)...'
# Linux: AppImage, rpm, deb, snap, pacman, tar.gz
# Windows: nsis (installer), portable (standalone exe)
# macOS: dmg, zip (macOS builds require a Mac or special CI)
npx electron-builder --linux AppImage rpm deb snap pacman tar.gz --win nsis portable --mac dmg zip || print '\nNote: Windows and macOS builds may require Wine or a Mac.'

# 5. Done
print '\nBuild complete! Find your packages in src/electron/dist/'
