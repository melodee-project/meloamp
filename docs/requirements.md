# Project Requirements & Progress Tracker

## Overview
MeloAmp is a streaming music application which allows the user to browse Artists, Albums, Songs and Playlists from an instance of Melodee API. 

---

## Architecture Overview
* MVVM pattern using Avalonia + ReactiveUI
* All music data loaded via REST calls—no local DB/files
* Audio streaming handled in a background task/service
* UI decoupled from player logic for responsiveness
* Scrobbling of playback activity

* **Target Platforms**: [ ] Windows [ ] macOS [ ] Linux  
* **API Integration**: Melodee music API for data and streaming URLs
* **Branding**: Application name is "MeloAmp", primary logo is "/graphics/logo.png" file

## Technology and Tools
- [ ] .NET 8
- [ ] C# 12
- [ ] Avalonia UI
- [ ] HttpClient/Refit
- [ ] System.IdentityModel.Tokens.Jst for Auth/JWT
- [ ] LibVLCSharp for song stream playback
- [ ] ReactiveUI for state management
- [ ] .NET DI
- [ ] Avalonia Themeing using ResourceDictionary-based for user themes
- [ ] Use Resource Files (resx) for Localization

### Phase 1: Setup
- [ ] Setup: Create Avalonia solution structure in `/src`
    * /Api: REST API client & DTOs
    * /Audio: Audio player service (LibVLCSharp abstraction)
    * /ViewModels: MVVM view models
    * /Views: Avalonia UI views
    * /Themes: Resource dictionaries for themeing
    * /Services: Auth, telemetry, DI, localization, etc.
- [ ] Logging: Configure Serilog with console and file output
- [ ] Mock API: Implement mock service for development
    * Mock API must generate enough fake data to be able to test pagination and infinite scrolling
    * Mock API should have random images that allow for testing of various color contrasts

### Phase 2: Application Interface
- [ ] Ensure accessibility and responsive design
- [ ] Ensure application has modern look and feel with a standard user experience akin to a web page
- [ ] Create a top navigation that includes these elements
    * Logo image
    * Artists: loads Artist browse page
    * Albums: loads Albums browse page
    * Playlists: loads Playlists browse page
    * Songs: loads Songs browse page
    * Search input box: loads search page and performs an API search
    * User information control which includes
        * Users Avatar
        * Users username
        * Dropown menu includes
            * Icon and link to edit users settings                
            * Icon and link to edit users profile
            * Icon to log out
            * Current version of MeloAmp
            * Version from API (returned in auth response)
- [ ] All browsing pages will have infinite scrolling using pagination parameters sent to the API
    * Include a display of position like "Viewing 1 to 20 of 500"

### Phase 3: Theming & UX
- [ ] Implement light and dark themes
- [ ] Avalonia’s built-in theming engine
- [ ] Community themes (Fluent, Material, etc.)
- [ ] Add user theme selection on users setting view
    * Generate some themes using various primary color palettes
    * Themes are to be stored in the applications data directory in a "themes" directory in a human readable JSON file: one theme per file
- [ ] Save user settings in a human readable JSON file in the application data directory
- [ ] User setting page to contain
    * Language
    * Theme
    * Keybindings
    * Caching options    
- [ ] A Queue view that allows the user to manage songs in the playback Queue
    * Reorder using drag-n-drop
    * Remove songs from queue
    * Shuffle queue
    * Save queue as playlist by posting to API endpoint

### Phase 4: Authentication
- [ ] Display login form
- [ ] Display login form to have Server URL
    - [ ] This is the root URL of the API
    - [ ] This value  will be persisted and loaded on application restarts
    - [ ] This value may end with "/api/v1" and may not, when saving ensure that ends with "/api/v1"
- [ ] Authenticate user against API with user provided email and password
    * Endpoint for auth is "/user/authenticate"
- [ ] Securely store token
- [ ] When the API returns a 401 delete the token and force the user to login again
- [ ] Handle network errors gracefully
    * Display a toast like message that says "An error has occurred" and log the response

### Phase 5: Music Library Integration
- [ ] Fetch music library from REST API
- [ ] Display albums and tracks in UI
- [ ] Handle API errors and loading states
- [ ] Caching of artist, album, song and playlist images

### Phase 6: Audio Playback
- [ ] Stream audio from URL
- [ ] Integrate playback controls (play, pause, stop, seek)
- [ ] Playback control will be a persist control that always appears at the bottom of the application when there are song in the playback queue
- [ ] Show playback status and progress bar
- [ ] Implement crossfade between tracks
- [ ] Support gapless playback for albums
- [ ] Implement equalizer functionality
- [ ] Scrobbling to send API when song is played for 10 seconds of "nowPlaying" status and when 70% played of "played" status
- [ ] User can add songs to the playback queue from a search result, from a browse page (like artist, album or song) or from a playlist

### Phase 7: Packaging & Distribution
- [ ] Build for Windows
- [ ] Build for macOS
- [ ] Build for Linux
- [ ] Create installers/packages for each platform
