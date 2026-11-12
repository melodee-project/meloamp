// preload.js - Electron Preload Script
//
// Security notes:
//  - Renderer callbacks never receive Electron's `IpcRendererEvent` object;
//    only the payload arguments are forwarded.
//  - Inbound channels are allowlisted (keep in sync with `main.js`).
const { contextBridge, ipcRenderer } = require('electron');

const INBOUND_CHANNELS = Object.freeze([
  'meloamp-mpris-control',
  'meloamp-update-status',
  'meloamp-media-key',
]);

const isAllowedChannel = (channel) => INBOUND_CHANNELS.includes(channel);

// Map<channel, Map<rendererCallback, ipcWrapper>> so `removeListener` can
// remove exactly the wrapper that was registered.
const listenerRegistry = new Map();

function onChannel(channel, callback) {
  if (!isAllowedChannel(channel) || typeof callback !== 'function') return;

  const wrapper = (_event, ...args) => callback(...args);
  if (!listenerRegistry.has(channel)) listenerRegistry.set(channel, new Map());
  listenerRegistry.get(channel).set(callback, wrapper);
  ipcRenderer.on(channel, wrapper);
}

function removeChannelListener(channel, callback) {
  if (!isAllowedChannel(channel)) return;
  const channelRegistry = listenerRegistry.get(channel);
  const wrapper = channelRegistry?.get(callback);
  if (!wrapper) return;
  ipcRenderer.removeListener(channel, wrapper);
  channelRegistry.delete(callback);
}

contextBridge.exposeInMainWorld('meloampAPI', {
  sendPlaybackInfo: (info) => ipcRenderer.send('meloamp-playback-info', info),
  sendPosition: (position) => ipcRenderer.send('meloamp-position-update', position),
  checkForUpdates: () => ipcRenderer.send('meloamp-check-for-updates'),
  updateMediaKeys: (config) => ipcRenderer.send('meloamp-update-media-keys', config),
  getMediaKeys: () => ipcRenderer.invoke('meloamp-get-media-keys'),
  updateTray: (nowPlaying) => ipcRenderer.send('meloamp-tray-update', nowPlaying),
  openExternal: (url) => ipcRenderer.invoke('meloamp-open-external', url),
});

contextBridge.exposeInMainWorld('electron', {
  versions: process.versions,
  ipcRenderer: {
    on: onChannel,
    removeListener: removeChannelListener,
    allowedChannels: [...INBOUND_CHANNELS],
  },
});
