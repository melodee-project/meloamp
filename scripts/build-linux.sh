#!/usr/bin/env zsh
# build-linux.sh - Build MeloAmp Electron App for Linux platforms only
# Usage: ./scripts/build-linux.sh
set -e

# 1. Build React UI
print '\n[1/4] Building React UI...'
cd ../src/ui
rm -rf node_modules package-lock.json yarn.lock
npm cache clean --force
npm install -g yarn
yarn install --check-files --verbose
yarn build

# If you are using a Debian-based system, you may also need to install the following packages:
# sudo apt-get update
# sudo apt-get install rpm fakeroot
# sudo apt-get install -y libxcrypt-compat
# sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils at-spi2-core libuuid1
# sudo apt-get install rpm fakeroot libxcrypt-compat libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils at-spi2-core libuuid1

# If you are using a Fedora-based system, you may need to install the following packages:
# sudo dnf install libxcrypt-compat
# sudo dnf install rpm-build fakeroot
# sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-core libuuid
# sudo dnf install rpm-build fakeroot gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-core libuuid

# If you are using an Arch-based system, you may need to install the following packages:
# sudo pacman -S rpm fakeroot
# sudo pacman -S libxcrypt-compat
# sudo pacman -S rpm fakeroot libxcrypt-compat

# 2. Install Electron dependencies
print '\n[2/4] Installing Electron dependencies...'
cd ../electron
rm -rf node_modules package-lock.json yarn.lock
npm cache clean --force
yarn install --check-files --verbose

# 3. Ensure electron-builder is installed
print '\n[3/4] Installing electron-builder...'
yarn add --dev electron-builder

# 4. Build Electron App for Linux only
print '\n[4/4] Building Electron App for Linux (AppImage, deb, tar.gz)...'
npx electron-builder --linux AppImage deb tar.gz

print '\nBuild complete! Find your packages in src/electron/dist/'
