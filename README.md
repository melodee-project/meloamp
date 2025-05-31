# MeloAmp

![MeloAmp Logo](./graphics/logo.png)

**MeloAmp** is a modern, cross-platform desktop music streaming application built with **Tauri**, **Svelte 5**, and **Tailwind CSS**. It provides a seamless music experience across Windows, macOS, and Linux with support for multiple languages and beautiful themes.

## Features

- 🎨 **Multiple Themes**: Choose from multiple beautiful color themes (blue, purple, green, orange, red)
- 🌐 **Multi-language Support**: Available in English, Spanish, French, German, and more
- 🔍 **Advanced Search**: Find artists, albums, songs, and playlists instantly
- 📱 **Cross-platform**: Works on Windows, macOS, and Linux
- 🎵 **Rich Music Library**: Browse and organize your music collection
- ⚡ **Fast & Lightweight**: Built with Tauri for optimal performance
- 🔐 **Secure**: SSL support for secure connections
- 📊 **User Dashboard**: Quick access to your recent music
- 🎧 **Playlist Management**: Create and manage your playlists
- 🌙 **Dark Mode**: Beautiful dark and light theme support

## Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Search
![Search](./screenshots/search.png)

### Artist View
![Artist View](./screenshots/artist.png)

### Settings
![Settings](./screenshots/settings.png)

## Quick Start

### Prerequisites

- **Node.js** (v18 or later)
- **Rust** (latest stable)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/meloamp.git
   cd meloamp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run tauri:dev
   ```

4. **Build for production**
   ```bash
   npm run tauri:build
   ```

## Usage

1. **Connect to Server**: Enter your music server URL and login credentials
2. **Browse Music**: Explore artists, albums, and songs
3. **Search**: Use the search bar to find specific content
4. **Create Playlists**: Organize your favorite music
5. **Settings**: Customize theme, language, and audio preferences

## Development

### Project Structure
```
src/
├── src/
│   ├── lib/
│   │   ├── api.ts              # API service
│   │   ├── i18n.ts             # Internationalization
│   │   ├── components/         # Svelte components
│   │   ├── stores/             # Svelte stores
│   │   └── locales/            # Translation files
│   ├── routes/                 # SvelteKit routes
│   └── app.css                 # Global styles
├── src-tauri/                  # Tauri backend
├── static/                     # Static assets
└── package.json
```

### Adding New Languages

1. Create a new locale file in `src/lib/locales/`
2. Add the language to `src/lib/i18n.ts`
3. Update the `supportedLocales` array

### Customizing Themes

MeloAmp uses Tailwind CSS for theming. You can:
1. Modify color themes in `src/lib/stores/theme.ts`
2. Add new color palettes by extending the `colorPalettes` object
3. Create custom CSS variables in `src/app.css`

## Building for Distribution

### Linux (AppImage)
```bash
npm run tauri:build
```

### Windows (MSI/EXE)
```bash
npm run tauri:build
```

### macOS (DMG/APP)
```bash
npm run tauri:build
```

Built applications will be available in `src-tauri/target/release/bundle/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on the GitHub repository or contact the development team.

---

**MeloAmp** - Your Music, Everywhere 🎵
