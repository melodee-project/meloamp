// preload.js - Electron Preload Script
// You can expose APIs to the renderer here if needed
const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer
contextBridge.exposeInMainWorld('meloampAPI', {
  sendPlaybackInfo: (info) => ipcRenderer.send('meloamp-playback-info', info),
  sendPosition: (position) => ipcRenderer.send('meloamp-position-update', position),
  checkForUpdates: () => ipcRenderer.send('meloamp-check-for-updates')
});

// Expose electron APIs for MPRIS control and updates
contextBridge.exposeInMainWorld('electron', {
  versions: process.versions,
  ipcRenderer: {
    on: (channel, callback) => {
      const validChannels = ['meloamp-mpris-control', 'meloamp-update-status'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, callback);
      }
    },
    removeListener: (channel, callback) => {
      const validChannels = ['meloamp-mpris-control', 'meloamp-update-status'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, callback);
      }
    }
  }
});
