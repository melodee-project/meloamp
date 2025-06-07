# MeloAmp

![MeloAmp Logo](graphics/logo.png)

**MeloAmp** is a modern, cross-platform streaming client for the [Melodee](https://melodee.org) music API. Built with React, Material-UI, and Electron, MeloAmp delivers a beautiful, responsive, and customizable music experience for Linux, Windows, and macOS.

> It Really Whips the Llama's A**

---

## Features

- 🎵 **Stream music** from your Melodee server
- 🖼️ Browse by **Artist, Album, Song, Playlist**
- 📝 **Playback queue** with drag-and-drop, shuffle, and save as playlist
- ⭐ **Favorite/unfavorite** songs directly from the player
- 🎚️ **Equalizer** with persistent user settings
- 🌈 **Modern UI** with multiple color themes (light/dark/classic/ocean/forest/sunset)
- 🔒 **JWT authentication**
- 📦 **Cross-platform builds** (AppImage, DEB, RPM, Snap, Pacman, tar.gz)
- ⚡ **Gapless playback**, crossfade, and scrobbling
- 🖥️ **Electron desktop app** with native menus and notifications
- 🛠️ **Accessible** and keyboard-friendly

---

## Screenshots

> _Add screenshots here to showcase the UI_

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [Electron](https://www.electronjs.org/)
- Linux: For packaging, install `libxcrypt-compat`:
  - Ubuntu/Debian: `sudo apt-get install -y libxcrypt-compat`
  - Fedora: `sudo dnf install libxcrypt-compat`
  - Arch: `sudo pacman -S libxcrypt-compat`

### Build & Run (Development)

```sh
# 1. Build the React UI
cd src/ui
npm install
npm run build

# 2. Start the Electron app
cd ../electron
npm install
npm start
```

### Build for Linux (Production)

```sh
./scripts/build-linux.sh
```
- Packages will be output to `src/electron/dist/`
- Requires `electron-builder` (installed automatically by the script)

---

## Configuration
- **API URL:** Set your Melodee API endpoint in the app or via environment variables.
- **User settings** (theme, equalizer, etc.) are stored in `localStorage` and can be managed in the app settings.

---

## Contributing

Contributions are welcome! Please:
- Open issues for bugs or feature requests
- Fork and submit pull requests
- Follow the [Contributor Covenant](https://www.contributor-covenant.org/)

---

## License

This project is licensed under the [ISC License](LICENSE).

---

## Credits
- [Melodee API](https://melodee.org)
- [React](https://reactjs.org/), [Material-UI](https://mui.com/), [Electron](https://www.electronjs.org/)

---

## Contact

For support or questions, contact [info@melodee.org](mailto:info@melodee.org).
