# Project Requirements & Progress Tracker

## Overview
MeloAmp is a streaming music application which allows the user to browse Artists, Albums, Songs and Playlists from an instance of Melodee API.  

This document outlines the technical requirements for MeloAmp which will connects to a Melodee API instance, allows users to search, browse, and stream music, and delivers a modern, elegant, and highly customizable user experience. 

Melodee will be built using **React** and **Material-UI (MUI)**, run within **Electron**, and will support multiple color themes including both light and dark modes. Authentication is handled via JWT tokens.

---

## Architecture Overview
- **React** (with Hooks, functional components): Modern, declarative UI framework.
- **Material-UI (MUI):** Component library for building responsive, accessible, and highly themeable interfaces.
- **TypeScript:** Strong typing for maintainability and developer productivity.
- **React Router:** For navigation between views (e.g., browse, search, player, settings).
- **Zustand):** For centralized state management (e.g., auth state, player state, themes).
- **Axio:**: For API client
- **Internationalization:**: react-i18next. Default language is "English (en)".
- **Developer Tools:** ESLint and Prettier

## **Non-Functional Requirements**
* **Target Platforms**: [ ] Windows [ ] macOS [ ] Linux  
* **API Integration**: Melodee music API for data and streaming URLs
* **Branding**: Application name is "MeloAmp", primary logo is "/graphics/logo.png" file
- **Performance:** Snappy and responsive UI; minimize Electron memory footprint.
- **Security:** Secure JWT handling; protect against XSS and other web vulnerabilities.
- **Maintainability:** Modular codebase, strong typing, clear separation of concerns.
- **Cross-Platform:** Single codebase for Windows, macOS, Linux.
- **Auto-Update:** Support for in-app updates (Electron auto-updater).
- **Testing:** Unit and integration tests (Jest, React Testing Library).
- **Offline Support:** This application has no offline support. 

#### User Feedback Patterns

To ensure a consistent and accessible user experience, the following feedback patterns must be implemented across all pages and components:

- **Loading States**
  - Use a centered `<CircularProgress />` spinner from MUI for all full-page data loads.
  - For inline or list loading (e.g., loading more items in infinite scroll), use MUI `<Skeleton />` components.
  - All loading indicators must have appropriate ARIA labels (e.g., `aria-busy="true"`).

- **Empty States**
  - When no data is available (e.g., empty search results, no playlists), display a reusable `<EmptyState />` component.
  - This component must include:
    - An icon or illustration relevant to the context.
    - A short, friendly message (e.g., “No albums found.”).
    - (Optional) A call-to-action button if appropriate (e.g., “Create Playlist”).
  - Empty states must be visually distinct from loading and error states.

- **Error States**
  - All API or network errors must trigger a `<Snackbar />` toast with a clear, user-friendly message (e.g., “Failed to load albums. Please try again.”).
  - For persistent errors (e.g., failed to load a page), display an `<ErrorBanner />` at the top of the content area with a retry button.
  - All error messages must be accessible to screen readers.

- **Success Feedback**
  - After successful actions (e.g., playlist saved, song added), show a `<Snackbar />` toast with a confirmation message.
  - Success messages should auto-dismiss after 3 seconds and be accessible.

- **Reusable Components**
  - All feedback UI (spinners, empty states, error banners, snackbars) must be implemented as reusable components in `/src/components/feedback/`.
  - Usage of these components must be consistent across all pages and features.

- **Accessibility**
  - All feedback components must be accessible via keyboard and screen reader.
  - Loading and error states must be announced to assistive technologies.

## **Volume Normalization:**  
  - Playback engine must support volume normalization to maintain consistent loudness between tracks.
  - If available, use loudness metadata (e.g., ReplayGain, LUFS) from the API to set playback gain.
  - Provide a user setting to enable or disable volume normalization.
  - Ensure normalization does not cause clipping or degrade audio quality.

##  **Project Structure**

```
/src
  /ui                # This is the React application
    /components      # Reusable UI components (buttons, modals, etc.)
    /pages           # Route-based views (Login, Player, Search, Settings)
    /theme           # Theme definitions and context
    /api             # API client (with JWT handling)
    /store           # State management (auth, user, player, theme)
    /assets          # Images, icons, etc.
    App.tsx
    main.tsx
    
/src
  /electron          # This is the Electron application
    main.js          # Electron main process
    preload.js
```

### **Desktop Platform**
- **Electron:** Enables cross-platform desktop deployment (Windows, macOS, Linux), providing native desktop integration.

### **API Integration**
- **JWT Authentication:** Store and manage JWT tokens returned from the API; include JWT in the `Authorization` header of every subsequent API request.
- **API Models:** All API request, response and pagination models are defined the `APIMODELS.md` document.

## Technology and Tools

### Phase 1: Setup
- [x] Setup: Create new React solution in the `/src/ui` directory
- [x] Setup: Create new Electron solution in the `/src/electron` directory
- [x] Setup: Create a script in the root `run-it.sh` that runs the Electron application locally
- [x] Mock API: Implement mock API for development
    * [x] Mock API must generate enough fake data to be able to test pagination and infinite scrolling
    * [x] Mock API should have random images that allow for testing of various color contrasts

### Phase 2: Application Interface
- [x] Ensure accessibility and responsive design
- [x] Ensure application has modern look and feel with a standard modern user experience akin to a web page
- [x] Create a top navigation that includes these elements
    - **Horizontal Bar:** Stretches across the top of the app.
    - **Left Section:**
      - **Logo:** Display the app logo; clicking it navigates to the home/dashboard.
      - **Primary Menu Items:** Key navigation links (e.g., Home, Browse, Library) displayed left-aligned, directly to the right of the logo.
    - **Center Section (optional):**
      - May be omitted for simplicity or to maximize space.
    - **Right Section:**
      - **Search Bar:** Prominently placed, left-aligned within the right section or center-justified if space allows.
      - **Theme Toggle Icon:** Button to switch between light/dark mode; shows current mode (e.g., sun/moon icon). Accessible via keyboard and screen reader.
      - **User Control Dropdown:** 
        - Shows user avatar and username.
        - Avatar and username should be fetched from user data/API.        
        - Clicking opens a dropdown
	    * Dropown menu includes
		* Icon and link to edit users settings                
		* Icon and link to edit users profile
		* Icon to log out
		* Current version of MeloAmp
		* Version from API (returned in auth response)
- [ ] All browsing pages will have infinite scrolling using pagination parameters sent to the API
    * Include a display of position like "Viewing 1 to 20 of 500"

### Phase 3: Theming & UX
- [x] Implement light and dark mode
- [x] Add user theme selection on users setting view
    * [x] Offer a set of predefined color themes (e.g., Classic, Ocean, Sunset, Forest, etc.).
    * [x] Themes are to be stored in the applications data directory in a "themes" directory in a human readable JSON file: one theme per file, file name is the theme name
    * [x] Support font scaling and high-contrast modes if possible.
- [x] Save user settings in a human readable JSON file in the application data directory
- [x] Leverage MUI’s theme provider for dynamic theme switching.
- [x] User setting page to contain
    * [x] Language
    * [x] Theme
    * [x] Keybindings
    * [x] Caching options    
- [x] A Queue view that allows the user to manage songs in the playback Queue
    * [ ] Reorder using drag-n-drop
    * [ ] Remove songs from queue
    * [ ] Shuffle queue
    * [ ] Save queue as playlist by posting to API endpoint


## Phase 4. **Core Features**

- [x] Authentication: Login/logout flow with JWT, error handling for auth failures.
- [x] Music Search: Query API for artists, albums, tracks.
- [x] Browsing: Browse by genre, artist, album, playlist.
- [x] Streaming Playback: Gapless playback, audio visualization (future enhancement).
- [x] Playlists: Create, edit, and manage playlists.
- [x] Responsive UI: Works on all common desktop resolutions.
- [x] Settings: Theme selection, light/dark mode toggle, logout, etc.

### Phase 5: Authentication
- [ ] Display login form
- [ ] Display login form will have Server URL
    - [ ] This is the root URL of the API
    - [ ] This value  will be saved and loaded on application restarts
    - [ ] This value may end with "/api/v1" and may not, when saving ensure that ends with "/api/v1"
- [ ] Authenticate user against API with user provided email and password
    * Endpoint for auth is "/user/authenticate"
- [ ] Securely store token
- [ ] When the API returns a 401 delete the token and force the user to login again
- [ ] Handle network errors gracefully
    * Display a toast like message that says "An error has occurred" and log the response

### Phase 6: Music Library Integration
- [ ] Fetch music library from REST API
- [ ] Display albums and tracks in UI
- [ ] Handle API errors and loading states
- [ ] Caching of artist, album, song and playlist images

### Phase 7: Audio Playback
- [ ] Stream audio from URL
- [ ] Integrate playback controls (play, pause, stop, seek)
- [ ] Playback control will be a persist control that always appears at the bottom of the application when there are song in the playback queue
- [ ] Show playback status and progress bar
- [ ] Implement crossfade between tracks
- [ ] Support gapless playback for albums
- [ ] Implement equalizer functionality
- [ ] Scrobbling to send API when song is played for 10 seconds of "nowPlaying" status and when 70% played of "played" status
- [ ] User can add songs to the playback queue from a search result, from a browse page (like artist, album or song) or from a playlist

### Phase 8: Packaging & Distribution
- [ ] Build for Windows
- [ ] Build for macOS
- [ ] Build for Linux
- [ ] Create installers/packages for each platform

