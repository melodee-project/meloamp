// main.js - Electron Main Process
const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
let staticServer;
const SERVER_PORT = 3001;

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

  // Open DevTools for debugging
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
