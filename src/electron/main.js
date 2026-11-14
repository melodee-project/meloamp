// main.js - Electron Main Process
const { app, BrowserWindow, ipcMain, Notification, Menu, dialog, globalShortcut, Tray, nativeImage, shell } = require('electron');
const path = require('path');
const express = require('express');
const mpris = require('mpris-service');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { fileURLToPath } = require('url');
const { autoUpdater } = require('electron-updater');
const {
  artCachePath,
  formatArtUrl,
  generateTrackId,
  isAllowedExternalUrl,
  listenOnAvailablePort,
  sanitizeAccelerator,
  SHELL_PORT_CANDIDATES,
  shellUrl,
} = require('./helpers');
const { translate } = require('./strings');

const LOOPBACK_HOST = '127.0.0.1';

/** Translate a main-process string using the OS locale. */
const t = (key, replacements) => translate(app.getLocale(), key, replacements);
const ART_DOWNLOAD_TIMEOUT_MS = 10_000;
const ART_MAX_BYTES = 10 * 1024 * 1024;

let staticServer;
let SERVER_PORT = 3001;
let mprisPlayer;
let currentPosition = 0;
let lastPositionUpdate = Date.now();
let lastTrackId = null;
let mainWindow = null;
let tray = null;
let mediaShortcutsRegistered = false;
let lastNowPlaying = null;

// Default media key shortcuts (can be customized via settings)
let mediaKeyConfig = {
  playPause: 'MediaPlayPause',
  next: 'MediaNextTrack',
  previous: 'MediaPreviousTrack',
  stop: 'MediaStop'
};

// Auto-updater configuration
autoUpdater.autoDownload = false; // Don't auto-download, let user choose
autoUpdater.autoInstallOnAppQuit = true;

async function startStaticServer() {
  if (staticServer) return SERVER_PORT;
  const server = express();
  // Use the correct path for production (packaged) and development
  const isPackaged = app.isPackaged;
  let buildPath;
  if (isPackaged) {
    // Try both possible locations for build output in asar
    const try1 = path.join(process.resourcesPath, 'build');
    const try2 = path.join(process.resourcesPath, 'app', 'build');
    const fs = require('fs');
    if (fs.existsSync(path.join(try1, 'index.html'))) {
      buildPath = try1;
    } else if (fs.existsSync(path.join(try2, 'index.html'))) {
      buildPath = try2;
    } else {
      console.error('Could not find React build output in packaged app!');
      buildPath = try1; // fallback, will error
    }
  } else {
    buildPath = path.join(__dirname, '../ui/build');
  }

  // Serve static files (js, css, images, etc.) with a strict CSP and
  // no-cache HTML so packaged clients pick up shell updates immediately.
  server.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: http: https:",
        "media-src 'self' blob: http: https:",
        "font-src 'self' data:",
        "connect-src 'self' http: https: ws: wss:",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-ancestors 'none'",
      ].join('; '),
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  server.use(express.static(buildPath));

  // For all other routes (SPA routing), serve index.html
  // Express 5 requires named wildcard parameters: {*splat} matches any path
  server.get('{*splat}', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(buildPath, 'index.html'));
  });

  // Wait for an actual HTTP listener before loading the shell. Keep fallback
  // ports on origins allowed by Melodee's CORS policy.
  staticServer = await listenOnAvailablePort(server, SHELL_PORT_CANDIDATES, LOOPBACK_HOST);
  SERVER_PORT = staticServer.address().port;
  console.log(`Static server running on ${shellUrl(SERVER_PORT)}`);
  return SERVER_PORT;
}

function isDbusSessionAvailable() {
  return !!process.env.DBUS_SESSION_BUS_ADDRESS;
}

function setupMpris(win) {
  if (!isDbusSessionAvailable()) {
    console.warn('D-Bus session bus not available. MPRIS integration will be disabled.');
    mprisPlayer = null;
    return;
  }
  try {
    mprisPlayer = mpris({
      name: 'MeloAmp',
      identity: 'MeloAmp',
      supportedUriSchemes: ['http', 'https'],
      supportedMimeTypes: ['audio/mpeg', 'audio/flac', 'audio/mp3', 'audio/wav', 'audio/ogg'],
      supportedInterfaces: ['player'],
      canRaise: true,
      canQuit: true,
      canControl: true,
      canPlay: true,
      canPause: true,
      canSeek: true,
      canGoPrevious: true,
      canGoNext: true
    });

    // Set up event handlers
    mprisPlayer.on('play', () => win.webContents.send('meloamp-mpris-control', 'play'));
    mprisPlayer.on('pause', () => win.webContents.send('meloamp-mpris-control', 'pause'));
    mprisPlayer.on('next', () => win.webContents.send('meloamp-mpris-control', 'next'));
    mprisPlayer.on('previous', () => win.webContents.send('meloamp-mpris-control', 'previous'));
    mprisPlayer.on('stop', () => win.webContents.send('meloamp-mpris-control', 'stop'));
    mprisPlayer.on('seek', (offset) => win.webContents.send('meloamp-mpris-control', 'seek', offset / 1000000)); // Convert to seconds
    mprisPlayer.on('position', (event) => win.webContents.send('meloamp-mpris-control', 'position', event.position / 1000000)); // Convert to seconds

    // Set initial properties
    mprisPlayer.playbackStatus = 'Stopped';

    // Listen for D-Bus errors and clean up
    mprisPlayer.on('error', (err) => {
      console.error('MPRIS D-Bus error:', err);
      teardownMpris();
    });
  } catch (err) {
    console.error('Failed to set up MPRIS:', err);
    mprisPlayer = null;
  }
}

function createWindow() {
  // Enable DevTools (debug console) in development by default.
  // In packaged builds, opt-in via: MELOAMP_DEBUG_CONSOLE=1
  const debugConsoleEnabled = !app.isPackaged || process.env.MELOAMP_DEBUG_CONSOLE === '1';
  
  // Set icon path for taskbar/tray
  let iconPath;
  if (app.isPackaged) {
    iconPath = path.join(process.resourcesPath, 'resources', 'logo.png');
  } else {
    iconPath = path.join(__dirname, 'resources', 'logo.png');
  }
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: debugConsoleEnabled,
    },
  });

  // Never let the app window navigate away from the local shell, and route
  // external links through the OS browser (validated http/https only).
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) shell.openExternal(url).catch(() => undefined);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    if (target.hostname !== 'localhost' && target.hostname !== LOOPBACK_HOST) {
      event.preventDefault();
      if (isAllowedExternalUrl(url)) shell.openExternal(url).catch(() => undefined);
    }
  });

  mainWindow.on('show', () => updateTrayMenu(lastNowPlaying));
  mainWindow.on('hide', () => updateTrayMenu(lastNowPlaying));

  // Load the React build output via HTTP server
  // Use `localhost` (not 127.0.0.1): Melodee CORS allows localhost origins.
  mainWindow.loadURL(shellUrl(SERVER_PORT));

  if (debugConsoleEnabled) {
    mainWindow.webContents.on('did-finish-load', () => {
      // Use a detached window so the console is always visible.
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
  }

  // MPRIS setup
  if (!mprisPlayer) {
    setupMpris(mainWindow);
  }
}

// Helper function to cache remote album art
async function cacheArtUrl(url) {
  if (!url || !url.startsWith('http')) {
    return formatArtUrl(url);
  }

  const cacheDir = path.join(app.getPath('cache'), 'meloamp-art');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const hash = crypto.createHash('sha256').update(url).digest('hex');
  const cachedArtPath = artCachePath(cacheDir, url, hash);

  if (!fs.existsSync(cachedArtPath)) {
    const removePartial = () => {
      try {
        if (fs.existsSync(cachedArtPath)) fs.unlinkSync(cachedArtPath);
      } catch (cleanupError) {
        console.error(`Failed to clean up partial album art cache file ${cachedArtPath}:`, cleanupError);
      }
    };

    try {
      await new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const request = client.get(url, { timeout: ART_DOWNLOAD_TIMEOUT_MS }, (response) => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            response.resume();
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }

          const contentType = String(response.headers['content-type'] || '');
          if (contentType && !contentType.startsWith('image/')) {
            response.resume();
            reject(new Error(`Unexpected content-type: ${contentType}`));
            return;
          }

          const declaredLength = Number(response.headers['content-length']);
          if (Number.isFinite(declaredLength) && declaredLength > ART_MAX_BYTES) {
            response.resume();
            reject(new Error(`Artwork too large: ${declaredLength} bytes`));
            return;
          }

          let received = 0;
          const fileStream = fs.createWriteStream(cachedArtPath);

          response.on('data', (chunk) => {
            received += chunk.length;
            if (received > ART_MAX_BYTES) {
              response.destroy(new Error('Artwork exceeded size limit'));
            }
          });
          response.on('error', (error) => {
            fileStream.destroy();
            removePartial();
            reject(error);
          });
          response.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });
          fileStream.on('error', (error) => {
            removePartial();
            reject(error);
          });
        });

        request.on('timeout', () => {
          request.destroy(new Error('Artwork download timed out'));
        });
        request.on('error', (error) => {
          removePartial();
          reject(error);
        });
      });
    } catch (error) {
      removePartial();
      console.error(`Failed to download and cache album art from ${url}:`, error);
      return '';
    }
  }

  return formatArtUrl(cachedArtPath);
}

async function handleMprisPlaybackInfo(event, info) {
  if (!mprisPlayer || mprisPlayer.closed) return;
  
  // Extract correct metadata fields for MPRIS
  const albumName = typeof info.album === 'object' && info.album?.name ? info.album.name : (info.album || '');
  
  // Always convert artist to array of strings
  let artistNames = [];
  if (Array.isArray(info.artist)) {
    artistNames = info.artist.map(a => (typeof a === 'object' ? a.name : a)).filter(name => typeof name === 'string' && name.length > 0);
  } else if (typeof info.artist === 'object' && info.artist?.name) {
    artistNames = [info.artist.name];
  } else if (typeof info.artist === 'string') {
    artistNames = [info.artist];
  }
  
  // Prefer album image, fallback to song or artist image
  let artUrlRaw = '';
  if (info.album && typeof info.album === 'object' && info.album.imageUrl) {
    artUrlRaw = info.album.imageUrl;
  } else if (info.artUrl) {
    artUrlRaw = info.artUrl;
  } else if (Array.isArray(info.artist) && info.artist[0]?.imageUrl) {
    artUrlRaw = info.artist[0].imageUrl;
  }
  
  const artUrl = await cacheArtUrl(artUrlRaw);
  const trackId = generateTrackId(info.trackId);
  const lengthMicroseconds = (info.length || 0) * 1000000; // Convert to microseconds
  
  // Send desktop notification on track change
  if (info.trackId && info.trackId !== lastTrackId && info.status === 'Playing') {
    lastTrackId = info.trackId;
    if (Notification.isSupported()) {
      const iconPath = artUrl.startsWith('file://') ? fileURLToPath(artUrl) : undefined;
      new Notification({
        title: info.title || 'Now Playing',
        body: `${artistNames.join(', ')} \n${albumName}`,
        icon: iconPath,
        silent: true
      }).show();
    }
  }

  try {
    mprisPlayer.metadata = {
      'mpris:trackid': trackId,
      'mpris:length': lengthMicroseconds,
      'mpris:artUrl': artUrl,
      'xesam:title': info.title || '',
      'xesam:album': albumName,
      'xesam:artist': artistNames,
    };
    
    mprisPlayer.playbackStatus = info.status || 'Stopped';
    
    // Update position if provided
    if (typeof info.position === 'number') {
      currentPosition = Math.floor(info.position * 1000000); // Convert to microseconds
      lastPositionUpdate = Date.now();
      mprisPlayer.position = currentPosition;
    }
  } catch (err) {
    console.error('Error updating MPRIS properties:', err);
    if (mprisPlayer && mprisPlayer.closed) {
      teardownMpris();
    }
  }
}

function handleMprisPositionUpdate(event, position) {
  if (!mprisPlayer || mprisPlayer.closed) return;
  
  try {
    currentPosition = Math.floor(position * 1000000); // Convert to microseconds
    lastPositionUpdate = Date.now();
    mprisPlayer.position = currentPosition;
  } catch (err) {
    console.error('Error updating MPRIS position:', err);
  }
}

function teardownMpris() {
  if (mprisPlayer) {
    try { mprisPlayer.close?.(); } catch {}
  }
  mprisPlayer = null;
}

// IPC: Receive playback info from renderer and update MPRIS.
// Registered once: `teardownMpris` only closes the D-Bus player, so a transient
// D-Bus failure cannot permanently detach these handlers.
ipcMain.on('meloamp-playback-info', handleMprisPlaybackInfo);
ipcMain.on('meloamp-position-update', handleMprisPositionUpdate);

// ============================================
// Global Media Keys
// ============================================

function registerMediaKeys() {
  if (mediaShortcutsRegistered) {
    unregisterMediaKeys();
  }

  try {
    // Play/Pause
    if (mediaKeyConfig.playPause) {
      globalShortcut.register(mediaKeyConfig.playPause, () => {
        console.log('Media key: Play/Pause');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('meloamp-media-key', 'playPause');
        }
      });
    }

    // Next Track
    if (mediaKeyConfig.next) {
      globalShortcut.register(mediaKeyConfig.next, () => {
        console.log('Media key: Next');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('meloamp-media-key', 'next');
        }
      });
    }

    // Previous Track
    if (mediaKeyConfig.previous) {
      globalShortcut.register(mediaKeyConfig.previous, () => {
        console.log('Media key: Previous');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('meloamp-media-key', 'previous');
        }
      });
    }

    // Stop
    if (mediaKeyConfig.stop) {
      globalShortcut.register(mediaKeyConfig.stop, () => {
        console.log('Media key: Stop');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('meloamp-media-key', 'stop');
        }
      });
    }

    mediaShortcutsRegistered = true;
    console.log('Global media keys registered');
  } catch (err) {
    console.error('Failed to register media keys:', err);
  }
}

function unregisterMediaKeys() {
  globalShortcut.unregisterAll();
  mediaShortcutsRegistered = false;
  console.log('Global media keys unregistered');
}

// IPC: Update media key configuration
ipcMain.on('meloamp-update-media-keys', (event, config) => {
  if (!config || typeof config !== 'object') return;

  // Only accept accelerators from a strict allowlist; the renderer must not be
  // able to register arbitrary global shortcuts.
  const next = { ...mediaKeyConfig };
  for (const action of Object.keys(next)) {
    if (!(action in config)) continue;
    if (config[action] === null || config[action] === '') {
      next[action] = '';
      continue;
    }
    const sanitized = sanitizeAccelerator(config[action]);
    if (sanitized === null) {
      console.warn(`Ignoring invalid accelerator for ${action}:`, config[action]);
      continue;
    }
    next[action] = sanitized;
  }

  mediaKeyConfig = next;
  console.log('Updating media key configuration:', mediaKeyConfig);
  registerMediaKeys();
});

// IPC: Get current media key configuration
ipcMain.handle('meloamp-get-media-keys', () => {
  return mediaKeyConfig;
});

// ============================================
// System Tray
// ============================================

function createTray() {
  // Set icon path for tray
  let iconPath;
  if (app.isPackaged) {
    iconPath = path.join(process.resourcesPath, 'resources', 'logo.png');
  } else {
    iconPath = path.join(__dirname, 'resources', 'logo.png');
  }

  // Create tray icon (use smaller icon for tray on some platforms)
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    // Resize for tray (16x16 or 22x22 depending on platform)
    if (process.platform === 'darwin') {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
    } else {
      trayIcon = trayIcon.resize({ width: 22, height: 22 });
    }
  } catch (err) {
    console.error('Failed to load tray icon:', err);
    return;
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('MeloAmp');

  updateTrayMenu();

  // Click behavior
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });

  console.log('System tray created');
}

function updateTrayMenu(nowPlaying = null) {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    // Now playing info (if available)
    ...(nowPlaying ? [
      { label: nowPlaying.title || t('tray.unknownTrack'), enabled: false },
      { label: nowPlaying.artist || t('tray.unknownArtist'), enabled: false },
      { type: 'separator' }
    ] : []),
    // Playback controls
    {
      label: t('tray.playPause'),
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('meloamp-media-key', 'playPause');
        }
      }
    },
    {
      label: t('tray.next'),
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('meloamp-media-key', 'next');
        }
      }
    },
    {
      label: t('tray.previous'),
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('meloamp-media-key', 'previous');
        }
      }
    },
    { type: 'separator' },
    // Window controls
    {
      label: mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() ? t('tray.hideWindow') : t('tray.showWindow'),
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: t('tray.quit'),
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// IPC: Update tray with now playing info
ipcMain.on('meloamp-tray-update', (event, nowPlaying) => {
  lastNowPlaying = nowPlaying || null;
  updateTrayMenu(lastNowPlaying);
  
  // Update tray tooltip with current track
  if (tray) {
    const tooltip = lastNowPlaying?.title
      ? `MeloAmp - ${lastNowPlaying.title}${lastNowPlaying.artist ? ` - ${lastNowPlaying.artist}` : ''}`
      : 'MeloAmp';
    tray.setToolTip(tooltip);
  }
});

ipcMain.handle('meloamp-open-external', async (event, rawUrl) => {
  if (!isAllowedExternalUrl(rawUrl)) {
    console.warn('Refusing to open non-http(s) URL:', rawUrl);
    return false;
  }
  await shell.openExternal(new URL(rawUrl).toString());
  return true;
});

// Global error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

app.whenReady().then(async () => {
  try {
    await startStaticServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start static server:', error);
    dialog.showErrorBox(t('dialog.startupErrorTitle'), t('dialog.startupErrorMessage'));
    app.quit();
    return;
  }

  createTray();
  registerMediaKeys();
  setupAutoUpdater();
  setupApplicationMenu();
});

// Clean up on quit
app.on('will-quit', () => {
  unregisterMediaKeys();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ============================================
// Auto-Updater Setup
// ============================================

function setupAutoUpdater() {
  // Only enable auto-updater in packaged builds
  if (!app.isPackaged) {
    console.log('Auto-updater disabled in development mode');
    return;
  }

  // Configure auto-updater logging
  autoUpdater.logger = console;

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    sendUpdateStatus('checking');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    sendUpdateStatus('available', info);
    
    // Show notification
    if (Notification.isSupported()) {
      new Notification({
        title: t('notification.updateAvailableTitle'),
        body: t('notification.updateAvailableBody', { version: info.version }),
        silent: false
      }).show();
    }

    // Ask user if they want to download
    showOwnerSafeDialog({
      type: 'info',
      title: t('dialog.updateAvailableTitle'),
      message: t('dialog.updateAvailableMessage', { version: info.version }),
      detail: t('dialog.updateAvailableDetail'),
      buttons: [t('dialog.download'), t('dialog.later')],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
    sendUpdateStatus('not-available', info);
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    sendUpdateStatus('error', { message: err.message });
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`Download progress: ${progress.percent.toFixed(1)}%`);
    sendUpdateStatus('downloading', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    sendUpdateStatus('downloaded', info);
    
    // Ask user to restart
    showOwnerSafeDialog({
      type: 'info',
      title: t('dialog.updateReadyTitle'),
      message: t('dialog.updateReadyMessage'),
      detail: t('dialog.updateReadyDetail'),
      buttons: [t('dialog.restartNow'), t('dialog.later')],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Check for updates on startup (after a short delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Failed to check for updates:', err);
    });
  }, 5000);
}

function sendUpdateStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('meloamp-update-status', { status, ...data });
  }
}

function showOwnerSafeDialog(options) {
  const owner = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
  return dialog.showMessageBox(owner, options);
}

// IPC handler for manual update check
ipcMain.on('meloamp-check-for-updates', () => {
  if (!app.isPackaged) {
    sendUpdateStatus('error', { message: 'Updates are only available in packaged builds' });
    return;
  }
  autoUpdater.checkForUpdates().catch(err => {
    sendUpdateStatus('error', { message: err.message });
  });
});

// ============================================
// Application Menu
// ============================================

function setupApplicationMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: t('menu.checkUpdates'),
          click: () => {
            if (!app.isPackaged) {
              showOwnerSafeDialog({
                type: 'info',
                title: t('dialog.devModeTitle'),
                message: t('dialog.devModeMessage'),
                buttons: [t('dialog.ok')]
              });
              return;
            }
            autoUpdater.checkForUpdates().catch(err => {
              dialog.showErrorBox(t('dialog.updateErrorTitle'), err.message);
            });
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File menu
    {
      role: 'fileMenu',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit menu
    {
      role: 'editMenu',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // View menu
    {
      role: 'viewMenu',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: t('menu.about'),
          click: () => {
            showOwnerSafeDialog({
              type: 'info',
              title: 'About MeloAmp',
              message: `MeloAmp v${app.getVersion()}`,
              detail: 'Cross-platform streaming client for Melodee.\n\nBuilt with Electron.',
              buttons: ['OK']
            });
          }
        },
        ...(isMac ? [] : [
          { type: 'separator' },
          {
            label: t('menu.checkUpdates'),
            click: () => {
              if (!app.isPackaged) {
                showOwnerSafeDialog({
                  type: 'info',
                  title: 'Development Mode',
                  message: 'Auto-updates are only available in packaged builds.',
                  buttons: ['OK']
                });
                return;
              }
              autoUpdater.checkForUpdates().catch(err => {
                dialog.showErrorBox(t('dialog.updateErrorTitle'), err.message);
              });
            }
          }
        ])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
