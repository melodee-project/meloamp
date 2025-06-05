// preload.js - Electron Preload Script
// You can expose APIs to the renderer here if needed
window.addEventListener('DOMContentLoaded', () => {
  // Example: Expose version info
  window.electron = {
    versions: process.versions,
  };
});
