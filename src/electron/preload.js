// preload.js - Electron Preload Script
// You can expose APIs to the renderer here if needed
const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer
contextBridge.exposeInMainWorld('meloampAPI', {
  sendPlaybackInfo: (info) => ipcRenderer.send('meloamp-playback-info', info),
  sendPosition: (position) => ipcRenderer.send('meloamp-position-update', position),
  checkForUpdates: () => ipcRenderer.send('meloamp-check-for-updates'),
  // Media key configuration
  updateMediaKeys: (config) => ipcRenderer.send('meloamp-update-media-keys', config),
  getMediaKeys: () => ipcRenderer.invoke('meloamp-get-media-keys'),
  // Tray updates
  updateTray: (nowPlaying) => ipcRenderer.send('meloamp-tray-update', nowPlaying)
});

// Expose electron APIs for MPRIS control, updates, and media keys
contextBridge.exposeInMainWorld('electron', {
  versions: process.versions,
  ipcRenderer: {
    on: (channel, callback) => {
      const validChannels = ['meloamp-mpris-control', 'meloamp-update-status', 'meloamp-media-key'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, callback);
      }
    },
    removeListener: (channel, callback) => {
      const validChannels = ['meloamp-mpris-control', 'meloamp-update-status', 'meloamp-media-key'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, callback);
      }
    }
  }
});
