# MeloAmp - Cross-platform Music Streaming Application

MeloAmp is a modern, cross-platform music streaming desktop application built with Tauri and Svelte. It provides a sleek interface for streaming music from [Melodee](https://melodee.org) with support for multiple languages and themes.

## Features

- 🎵 **Music Streaming**: Stream music from any Melodee instance
- 🌍 **Multi-language Support**: Available in 9 languages (English, Spanish, French, German, Portuguese, Italian, Japanese, Korean, Chinese)
- 🎨 **Multiple Themes**: Choose from 10 beautiful Skeleton UI themes
- 🔐 **Secure Authentication**: Bearer token-based authentication
- 📱 **Responsive Design**: Works great on all screen sizes
- ⚡ **High Performance**: Built with Tauri for native performance
- 🎛️ **Music Management**: Browse artists, albums, songs, and playlists
- 🔍 **Search Functionality**: Find your music quickly
- 📊 **Dashboard**: View recent albums, songs, artists, and playlists
- 💾 **Persistent Settings**: Your preferences are saved locally

## Prerequisites

Before running MeloAmp, ensure you have the following installed:

### Linux (Fedora)
```bash
sudo dnf install webkit2gtk4.0-devel openssl-devel curl wget libappindicator-gtk3-devel librsvg2-devel
```

### Windows
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 11)

### macOS
- Xcode Command Line Tools

## Developing

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meloamp/src
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development**
   ```bash
   npm run tauri:dev
   ```

4. **Build for production**
   ```bash
   npm run tauri:build
   ```

## Usage

1. **First Launch**: Enter your music server URL, email, and password
2. **Dashboard**: View your recent music and playlists
3. **Browse**: Navigate through artists, albums, and songs
4. **Search**: Use the search bar to find specific content
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

MeloAmp uses Skeleton UI themes. You can:
1. Choose from existing themes in `tailwind.config.js`
2. Create custom themes following Skeleton UI documentation

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
