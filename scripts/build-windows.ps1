# build-windows.ps1 - Build the MeloAmp Windows packages (nsis, portable, zip).
# Usage: .\scripts\build-windows.ps1
$ErrorActionPreference = 'Stop'

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$UiDir = Join-Path $Root 'src/ui'
$ElectronDir = Join-Path $Root 'src/electron'
$BuildDir = Join-Path $ElectronDir 'build'

Write-Host "`n[1/4] Installing and building the React UI..."
Push-Location $UiDir
try {
    if (-not (Test-Path 'yarn.lock')) {
        throw "src/ui/yarn.lock not found. Run 'yarn install' with Yarn 4 first."
    }
    yarn install --immutable
    if ($LASTEXITCODE -ne 0) { throw "yarn install failed" }
    $env:CI = 'true'
    yarn build
    if ($LASTEXITCODE -ne 0) { throw "yarn build failed" }
} finally {
    Pop-Location
}

Write-Host "`n[2/4] Syncing UI build into the Electron shell..."
if (Test-Path $BuildDir) { Remove-Item -Recurse -Force $BuildDir }
New-Item -ItemType Directory -Path $BuildDir | Out-Null
Copy-Item -Recurse -Force (Join-Path $UiDir 'build/*') $BuildDir

Write-Host "`n[3/4] Installing Electron dependencies..."
Push-Location $ElectronDir
try {
    if (-not (Test-Path 'yarn.lock')) {
        throw "src/electron/yarn.lock not found. Run 'yarn install' with Yarn 4 first."
    }
    yarn install --immutable
    if ($LASTEXITCODE -ne 0) { throw "yarn install failed" }

    Write-Host "`n[4/4] Packaging for Windows (nsis, portable, zip)..."
    yarn electron-builder --win nsis portable zip --publish never
    if ($LASTEXITCODE -ne 0) { throw "electron-builder failed" }
} finally {
    Pop-Location
}

Write-Host "`nDone. Artifacts are in src/electron/dist/"
