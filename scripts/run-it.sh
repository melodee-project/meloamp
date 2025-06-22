#!/usr/bin/env zsh
# run-it.sh - Build and run MeloAmp Electron App locally
# Usage: ./scripts/run-it.sh
set -e

# Windows Compatibility Note
# --------------------------
# This script is for Unix-like shells (zsh/bash). For Windows, use WSL, Git Bash, or the provided run-it-win.bat script.
#
# If using native Windows (cmd/PowerShell), run:
#   scripts\run-it-win.bat
#
# Requirements for Windows:
# - Node.js and npm must be installed
# - Electron will run, but packaging for Linux/macOS requires WSL or CI
# - If you see errors about missing shell commands, use WSL or Git Bash
#
# For best results, use WSL2 with Ubuntu and run this script from the Linux shell.

# Get the absolute path to the project root (one level up from this script)
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

# 1. Build React UI
echo '\n[1/3] Building React UI...'
cd "$PROJECT_ROOT/src/ui"
npm install --legacy-peer-deps
npm run build

# 2. Install Electron dependencies
echo '\n[2/3] Installing Electron dependencies...'
cd "$PROJECT_ROOT/src/electron"
npm install

# 3. Run Electron app
echo '\n[3/3] Launching MeloAmp Electron app...'
npx electron .
