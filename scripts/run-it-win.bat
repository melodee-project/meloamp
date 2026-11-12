@echo off
REM run-it-win.bat - Build and launch MeloAmp locally (Windows).
REM Usage: scripts\run-it-win.bat
setlocal
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."
set "UI_DIR=%ROOT_DIR%\src\ui"
set "ELECTRON_DIR=%ROOT_DIR%\src\electron"

echo.
echo [1/4] Installing UI dependencies (Yarn 4)...
pushd "%UI_DIR%" || exit /b 1
call yarn install --immutable
if errorlevel 1 exit /b %errorlevel%

echo.
echo [2/4] Building the React UI...
set CI=true
call yarn build
if errorlevel 1 exit /b %errorlevel%
popd

echo.
echo [3/4] Syncing UI build into the Electron shell...
if exist "%ELECTRON_DIR%\build" rmdir /s /q "%ELECTRON_DIR%\build"
xcopy /e /i /q "%UI_DIR%\build" "%ELECTRON_DIR%\build" >nul
if errorlevel 1 exit /b %errorlevel%

echo.
echo [4/4] Installing Electron dependencies and launching...
pushd "%ELECTRON_DIR%" || exit /b 1
call yarn install --immutable
if errorlevel 1 exit /b %errorlevel%
call yarn start
popd
endlocal
