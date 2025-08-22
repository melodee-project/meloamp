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
- ⚡ **Scrobbling**, scrobbling of play and play complete activity
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
When running the AppImage on Fedora you might need to tell it which GTK to use 
```
./meloamp*.AppImage --gtk-version=3
```

### Run the UI locally (development / debug)

If you want to iterate on UI changes quickly and test them in a browser before packaging into Electron, run the React development server and open the app at http://localhost:3000. This is the fastest feedback loop for UI changes.

1) Start the UI dev server

For fish shell (copy-paste as-is):

```fish
cd src/ui
npm install
npm start
```

Or using a single-line env (works in most shells):

```sh
REACT_APP_API_URL=http://your-melodee-api:4000 npm start
```

Notes:
- The UI dev server serves the React app at http://localhost:3000 by default.
- The frontend `api` module will use `localStorage.serverUrl` if set, otherwise `process.env.REACT_APP_API_URL` (so you can point the UI at a remote Melodee API while developing).

2) Point the UI to an API and authenticate

- To change the API URL from the browser console (useful when not restarting the dev server):

```js
localStorage.setItem('serverUrl', 'http://your-melodee-api:4000/api/v1');
location.reload();
```

- To set a JWT for authenticated flows (in browser console):

```js
localStorage.setItem('jwt', '<your-jwt-token>');
location.reload();
```

3) Test in Electron (optional)

Once you are happy with the UI changes in the browser, build the UI and run Electron so the desktop app serves the local build:

```fish
cd src/ui
npm run build
cd ../electron
npm install
npm start
```

This matches the production flow used by the packaged app: Electron serves the static build output from `src/ui/build`.

Advanced: If you prefer to run Electron that directly loads the React dev server (hot-reload inside Electron), you can modify `src/electron/main.js` to conditionally load `http://localhost:3000` when present (this is an advanced workflow and requires editing the Electron main process).


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
