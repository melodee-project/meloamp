// preload.js - Electron Preload Script
// You can expose APIs to the renderer here if needed
const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer
contextBridge.exposeInMainWorld('meloampAPI', {
  sendPlaybackInfo: (info) => ipcRenderer.send('meloamp-playback-info', info),
  sendPosition: (position) => ipcRenderer.send('meloamp-position-update', position)
});

// Expose electron APIs for MPRIS control
contextBridge.exposeInMainWorld('electron', {
  versions: process.versions,
  ipcRenderer: {
    on: (channel, callback) => {
      if (channel === 'meloamp-mpris-control') {
        ipcRenderer.on(channel, callback);
      }
    },
    removeListener: (channel, callback) => {
      if (channel === 'meloamp-mpris-control') {
        ipcRenderer.removeListener(channel, callback);
      }
    }
  }
});
