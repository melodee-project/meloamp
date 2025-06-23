# build-windows.ps1 - Build MeloAmp Electron App for Windows 10/11
# Usage: .\scripts\build-windows.ps1

$ErrorActionPreference = 'Stop'

# Change to the project root directory (the parent of scripts/)
Set-Location (Join-Path $PSScriptRoot '..')

Write-Host "`n[1/5] Building React UI..."
Set-Location src/ui
if (Test-Path yarn.lock) {
    yarn install --check-files --verbose
    yarn build
} else {
    npm install
    npm run build
}
Set-Location ../..

Write-Host "`n[2/5] Copying React build output to Electron app..."
Remove-Item -Recurse -Force src/electron/build -ErrorAction SilentlyContinue
Copy-Item -Recurse src/ui/build src/electron/build

# Remove build from .gitignore temporarily for packaging
if (Select-String -Path .gitignore -Pattern '^src/electron/build/' -Quiet) {
    (Get-Content .gitignore) | Where-Object { $_ -notmatch '^src/electron/build/' } | Set-Content .gitignore
}

Write-Host "`n[3/5] Installing Electron dependencies..."
Set-Location src/electron
if (Test-Path yarn.lock) {
    yarn install --check-files --verbose
} else {
    npm install
}

Write-Host "`n[4/5] Building Electron App for Windows (nsis, portable, zip)..."
# You must have electron-builder installed and configured in package.json
# This will create .exe installers and portable builds
if (Test-Path yarn.lock) {
    yarn run electron-builder --win nsis portable zip
} else {
    npx electron-builder --win nsis portable zip
}

# Restore .gitignore if backup exists
Write-Host "`n[post-build] Restoring .gitignore ignore rules..."
if (Test-Path ../.gitignore.bak) {
    Move-Item ../.gitignore.bak ../.gitignore -Force
}

Write-Host "`n[5/5] Build complete! Find your packages in src/electron/dist/"
