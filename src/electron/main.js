// main.js - Electron Main Process
const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
let staticServer;
const SERVER_PORT = 3001;

function startStaticServer() {
  if (staticServer) return;
  const server = express();
  const buildPath = path.join(__dirname, '../ui/build');
  // Serve static files
  server.use(express.static(buildPath));

  // Only serve index.html for non-API routes
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

  // Open DevTools for debugging
  win.webContents.openDevTools();

  // Load the React build output via HTTP server
  win.loadURL('http://localhost:' + SERVER_PORT);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
