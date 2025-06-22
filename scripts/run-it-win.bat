@echo off
REM run-it-win.bat - Build and run MeloAmp Electron App locally (Windows)
REM Usage: scripts\run-it-win.bat

REM Get the absolute path to the project root
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..\

REM 1. Build React UI
echo.
echo [1/3] Building React UI...
cd /d %PROJECT_ROOT%src\ui
call npm install --legacy-peer-deps
if %errorlevel% neq 0 exit /b %errorlevel%
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

REM 2. Install Electron dependencies
echo.
echo [2/3] Installing Electron dependencies...
cd /d %PROJECT_ROOT%src\electron
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

REM 3. Run Electron app
echo.
echo [3/3] Launching MeloAmp Electron app...
call npx electron .
