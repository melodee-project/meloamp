// main.js - Electron Main Process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const mpris = require('mpris-service');
let staticServer;
const SERVER_PORT = 3001;
let mprisPlayer;

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

  server.use(express.static(buildPath));

  server.get(/^\/(?!api).*/, (req, res) => {
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
      name: 'meloamp',
      identity: 'MeloAmp',
      supportedUriSchemes: ['file', 'http'],
      supportedMimeTypes: ['audio/mpeg', 'audio/flac', 'audio/mp3'],
      supportedInterfaces: ['player']
    });
    mprisPlayer.on('play', () => win.webContents.send('meloamp-mpris-control', 'play'));
    mprisPlayer.on('pause', () => win.webContents.send('meloamp-mpris-control', 'pause'));
    mprisPlayer.on('next', () => win.webContents.send('meloamp-mpris-control', 'next'));
    mprisPlayer.on('previous', () => win.webContents.send('meloamp-mpris-control', 'previous'));

    // Listen for D-Bus errors and clean up
    mprisPlayer.on('error', (err) => {
      console.error('MPRIS D-Bus error:', err);
      mprisPlayer = null;
      ipcMain.removeAllListeners('meloamp-playback-info');
    });
  } catch (err) {
    console.error('Failed to set up MPRIS:', err);
    mprisPlayer = null;
  }
}

function createWindow() {
  startStaticServer();
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Hide the default menu bar
  win.setMenu(null);

  // Load the React build output via HTTP server
  win.loadURL('http://localhost:' + SERVER_PORT);

  // MPRIS setup
  if (!mprisPlayer) {
    setupMpris(win);
  }
}

// IPC: Receive playback info from renderer and update MPRIS
ipcMain.on('meloamp-playback-info', (event, info) => {
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
  let artUrl = '';
  if (info.album && typeof info.album === 'object' && info.album.imageUrl) {
    artUrl = info.album.imageUrl;
  } else if (info.artUrl) {
    artUrl = info.artUrl;
  } else if (Array.isArray(info.artist) && info.artist[0]?.imageUrl) {
    artUrl = info.artist[0].imageUrl;
  }
  // Log the metadata being sent to MPRIS for debugging
  console.log('Sending MPRIS metadata:', {
    'mpris:trackid': info.trackId || '/org/mpris/MediaPlayer2/track/0',
    'mpris:length': info.length || 0,
    'mpris:artUrl': artUrl,
    'xesam:title': info.title || '',
    'xesam:album': albumName,
    'xesam:artist': artistNames,
    status: info.status || 'Stopped'
  });
  try {
    mprisPlayer.metadata = {
      'mpris:trackid': info.trackId || '/org/mpris/MediaPlayer2/track/0',
      'mpris:length': info.length || 0,
      'mpris:artUrl': artUrl,
      'xesam:title': info.title || '',
      'xesam:album': albumName,
      'xesam:artist': artistNames,
    };
    if (mprisPlayer) mprisPlayer.playbackStatus = info.status || 'Stopped';
  } catch (err) {
    console.error('Error updating MPRIS properties:', err);
    if (mprisPlayer && mprisPlayer.closed) {
      mprisPlayer = null;
      ipcMain.removeAllListeners('meloamp-playback-info');
    }
  }
});

// Global error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
