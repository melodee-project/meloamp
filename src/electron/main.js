// main.js - Electron Main Process
const { app, BrowserWindow, ipcMain, Notification, Menu, dialog } = require('electron');
const path = require('path');
const express = require('express');
const mpris = require('mpris-service');
const fs = require('fs');
const crypto = require('crypto');
const stream = require('stream');
const { promisify } = require('util');
const got = require('got');
const { autoUpdater } = require('electron-updater');

let staticServer;
const SERVER_PORT = 3001;
let mprisPlayer;
let currentPosition = 0;
let lastPositionUpdate = Date.now();
let lastTrackId = null;
let mainWindow = null;

// Auto-updater configuration
autoUpdater.autoDownload = false; // Don't auto-download, let user choose
autoUpdater.autoInstallOnAppQuit = true;

function startStaticServer() {
  if (staticServer) return;
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

  // Serve static files (js, css, images, etc.)
  server.use(express.static(buildPath));

  // For all other routes (SPA routing), serve index.html
  // Express 5 requires named wildcard parameters: {*splat} matches any path
  server.get('{*splat}', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
  staticServer = server.listen(SERVER_PORT, () => {
    console.log('Static server running on http://localhost:' + SERVER_PORT);
  });
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
      mprisPlayer = null;
      ipcMain.removeAllListeners('meloamp-playback-info');
      ipcMain.removeAllListeners('meloamp-position-update');
    });
  } catch (err) {
    console.error('Failed to set up MPRIS:', err);
    mprisPlayer = null;
  }
}

function createWindow() {
  startStaticServer();

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
      devTools: debugConsoleEnabled,
    },
  });

  // Load the React build output via HTTP server
  mainWindow.loadURL('http://localhost:' + SERVER_PORT);

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
  const extension = path.extname(new URL(url).pathname) || '.jpg';
  const cachedArtPath = path.join(cacheDir, hash + extension);

  if (!fs.existsSync(cachedArtPath)) {
    try {
      const pipelineAsync = promisify(stream.pipeline);
      await pipelineAsync(
        got.stream(url),
        fs.createWriteStream(cachedArtPath)
      );
    } catch (error) {
      console.error(`Failed to download and cache album art from ${url}:`, error);
      return ''; // Return empty string if download fails
    }
  }

  return formatArtUrl(cachedArtPath);
}

// Helper function to convert image URL to proper format for MPRIS
function formatArtUrl(url) {
  if (!url) return '';
  
  // If it's already a file:// URL, return as is
  if (url.startsWith('file://')) return url;
  
  // If it's an HTTP/HTTPS URL, we need to handle it properly
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // For remote images, MPRIS spec recommends local caching
    // This is now handled by cacheArtUrl, but we'll leave this for safety
    return url;
  }
  
  // If it's a local path, convert to file:// URL
  if (path.isAbsolute(url)) {
    return 'file://' + url;
  }
  
  return url;
}

// Helper function to generate proper MPRIS track ID
function generateTrackId(trackId) {
  if (!trackId) return '/org/mpris/MediaPlayer2/track/0';
  
  // Ensure track ID follows D-Bus object path rules
  const sanitized = String(trackId).replace(/[^a-zA-Z0-9_]/g, '_');
  return `/org/mpris/MediaPlayer2/track/${sanitized}`;
}

// IPC: Receive playback info from renderer and update MPRIS
ipcMain.on('meloamp-playback-info', async (event, info) => {
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
      const iconPath = artUrl.startsWith('file://') ? artUrl.slice(7) : undefined;
      new Notification({
        title: info.title || 'Now Playing',
        body: `${artistNames.join(', ')} \n${albumName}`,
        icon: iconPath,
        silent: true
      }).show();
    }
  }

  // Log the metadata being sent to MPRIS for debugging
  console.log('Sending MPRIS metadata:', {
    'mpris:trackid': trackId,
    'mpris:length': lengthMicroseconds,
    'mpris:artUrl': artUrl,
    'xesam:title': info.title || '',
    'xesam:album': albumName,
    'xesam:artist': artistNames,
    status: info.status || 'Stopped'
  });
  
  try {
    mprisPlayer.metadata = {
      'mpris:trackid': trackId,
      'mpris:length': lengthMicroseconds,
      'mpris:artUrl': artUrl,
      'xesam:title': info.title || '',
      'xesam:album': albumName,
      'xesam:artist': artistNames,
    };
    
    if (mprisPlayer) {
      mprisPlayer.playbackStatus = info.status || 'Stopped';
      
      // Update position if provided
      if (typeof info.position === 'number') {
        currentPosition = Math.floor(info.position * 1000000); // Convert to microseconds
        lastPositionUpdate = Date.now();
        mprisPlayer.position = currentPosition;
      }
    }
  } catch (err) {
    console.error('Error updating MPRIS properties:', err);
    if (mprisPlayer && mprisPlayer.closed) {
      mprisPlayer = null;
      ipcMain.removeAllListeners('meloamp-playback-info');
      ipcMain.removeAllListeners('meloamp-position-update');
    }
  }
});

// IPC: Handle position updates for MPRIS
ipcMain.on('meloamp-position-update', (event, position) => {
  if (!mprisPlayer || mprisPlayer.closed) return;
  
  try {
    currentPosition = Math.floor(position * 1000000); // Convert to microseconds
    lastPositionUpdate = Date.now();
    mprisPlayer.position = currentPosition;
  } catch (err) {
    console.error('Error updating MPRIS position:', err);
  }
});

// Global error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
  setupApplicationMenu();
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
        title: 'Update Available',
        body: `MeloAmp ${info.version} is available. Click to download.`,
        silent: false
      }).show();
    }

    // Ask user if they want to download
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.`,
      detail: 'Would you like to download it now?',
      buttons: ['Download', 'Later'],
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
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully.',
      detail: 'The update will be installed when you restart MeloAmp.',
      buttons: ['Restart Now', 'Later'],
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
          label: 'Check for Updates...',
          click: () => {
            if (!app.isPackaged) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Development Mode',
                message: 'Auto-updates are only available in packaged builds.',
                buttons: ['OK']
              });
              return;
            }
            autoUpdater.checkForUpdates().catch(err => {
              dialog.showErrorBox('Update Error', err.message);
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
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
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
      label: 'View',
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
      label: 'Help',
      submenu: [
        {
          label: 'About MeloAmp',
          click: () => {
            dialog.showMessageBox(mainWindow, {
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
            label: 'Check for Updates...',
            click: () => {
              if (!app.isPackaged) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Development Mode',
                  message: 'Auto-updates are only available in packaged builds.',
                  buttons: ['OK']
                });
                return;
              }
              autoUpdater.checkForUpdates().catch(err => {
                dialog.showErrorBox('Update Error', err.message);
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
