// preload.js - Electron Preload Script
// You can expose APIs to the renderer here if needed
const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  // Example: Expose version info
  window.electron = {
    versions: process.versions,
  };
});

contextBridge.exposeInMainWorld('meloampAPI', {
  sendPlaybackInfo: (info) => ipcRenderer.send('meloamp-playback-info', info)
});
