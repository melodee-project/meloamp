# MeloAmp Roadmap (Features & Enhancements)

_Last updated: 2025-12-19_

This roadmap is written for a single primary persona:

- **Listener / Curator**: browses artists/albums/songs, searches, plays music, and manages playlists.

It is intentionally implementation-oriented: each feature includes acceptance criteria, suggested code locations, and test cases. **No features are implemented by this document**—it is a plan for future work.

## Checklist Map

### Milestone 0 — Quality & Release Readiness
- [x] **R0.1 Fix/replace placeholder UI test suite** (current `App.test.tsx` is a default CRA test and does not reflect the app)
- [x] **R0.2 Add API mocking strategy for tests** (MSW or axios-mock-adapter) and standardize test utilities
- [x] **R0.3 Add smoke tests for core navigation** (Dashboard/Browse/Search/Queue/Player)
- [x] **R0.4 CI build matrix** for Linux/Windows/macOS and artifact upload
- [x] **R0.5 Auto-update support** (electron-builder updater + update UI feedback)

### Milestone 1 — Playback Experience
- [x] **P1.1 Repeat modes** (Off / Repeat All / Repeat One)
- [x] **P1.2 Shuffle mode** (true shuffle + “keep current song” behavior)
- [x] **P1.3 Gapless-ish transitions** (preload next track + minimize silence)
- [x] **P1.4 Volume normalization** (ReplayGain/LUFS when available; safe fallback)
- [x] **P1.5 Playback error recovery** (retry/backoff, user-visible error, skip to next)

### Milestone 2 — Queue & Playlist Workflows
- [x] **Q2.1 Queue “Play Next” and “Add to Queue” consistency** across all cards/views
- [x] **Q2.2 Queue history & undo** (undo remove/clear, back to previous track)
- [x] **Q2.3 Save queue to existing playlist** (append/replace) in addition to “new playlist”
- [x] **L2.1 Create playlist** (name/description/public) from Playlist page
- [x] **L2.2 Edit playlist metadata** (name/description/public + cover image)
- [x] **L2.3 Add/remove songs to playlists** from SongCard / Album / Artist / Search results
- [x] **L2.4 Playlist import/export** (M3U) 

### Milestone 3 — Search & Browse
- [ ] **S3.1 Unified search query propagation** (top-bar search should set `/search?q=` reliably)
- [ ] **S3.2 Search filters** (Artists/Albums/Songs/Playlists toggles + sort)
- [ ] **S3.3 Recent searches** (local history, clear button)
- [ ] **B3.1 Browse by genre** (list genres + drilldown to artists/albums/songs)
- [ ] **B3.2 Favorites & ratings library pages** (Liked/Disliked/Top rated)

### Milestone 4 — Desktop Integration (Cross-Platform)
- [x] **D4.1 “Now Playing” desktop notifications** (track change toasts)
- [ ] **D4.2 Global media keys** (Play/Pause/Next/Previous) and configurable shortcuts
- [ ] **D4.3 System tray controls** (mini controls + quick access to Queue)
- [ ] **D4.4 Windows SMTC + macOS media integration** (parity with Linux MPRIS)

### Milestone 5 — UX Consistency & Accessibility
- [ ] **U5.1 Standard loading/empty/error components** used everywhere
- [ ] **U5.2 Keyboard shortcuts & command palette-lite** (focus search, play/pause, queue)
- [ ] **U5.3 Better localization coverage** (fill missing keys, consistent phrasing)

---

## Conventions / Definition of Done

For a roadmap item to be checked off:
- UI meets acceptance criteria
- Tests exist for primary success path + at least one failure path
- Strings go through i18n (`react-i18next`) where user-visible
- No new hard-coded colors/themes (use existing MUI theme tokens)

---

## Coding-Agent Prompt Template (Implement One Milestone)

Copy/paste this template into your coding agent. Replace bracketed fields.

### Prompt

You are a coding agent working in this repo: **MeloAmp** (React + MUI UI in `src/ui`, Electron main process in `src/electron`).

**Goal:** Implement **Milestone 0 — Quality & Release Readiness** from this roadmap.

**Scope (must implement):**
- All roadmap items under given milestone.

**Out of scope (must NOT do):**
- Do not add new pages/modals beyond what the milestone requires.
- Do not introduce new theme colors, custom shadows, or a new design system.
- Do not change the API contract unless explicitly listed as part of the milestone.

**Acceptance Criteria:**
- Implement the acceptance criteria listed under each included roadmap item.
- Keep the UX consistent with existing pages (MUI components, existing patterns).

**Repo constraints / conventions:**
- Use existing state patterns (Zustand store in `src/ui/src/queueStore.ts` where applicable).
- Keep user-facing text behind `react-i18next` (no new hard-coded strings).
- Prefer minimal, surgical changes; do not refactor unrelated code.

**Test requirements (required to complete):**
- Add/replace tests under `src/ui/src` using Jest + React Testing Library.
- Provide tests for:
  - The primary success path
  - At least one failure/error path (API error or validation)
- Mock API calls deterministically (use the project’s chosen approach once added; otherwise mock axios instance in `src/ui/src/api.ts`).

**Verification steps (run and report results):**
- `cd src/ui && yarn test` (or the project’s standard UI test command)
- If you change Electron behavior: provide manual run steps for `src/electron` and Linux AppImage packaging.

**Implementation notes:**
- Expected primary files (edit as needed):
  - UI: `src/ui/src/pages/[...]`, `src/ui/src/components/[...]`, `src/ui/src/api.ts`, `src/ui/src/queueStore.ts`
  - Electron: `src/electron/main.js`, `src/electron/preload.js`

**Deliverables:**
- Code changes implementing the milestone items in scope.
- Updated/added tests.
- A short recap listing:
  - What changed
  - Where (file list)
  - How to verify

**Guardrails:**
- If a requirement is ambiguous, choose the simplest interpretation and note assumptions.
- If the server/API lacks an endpoint needed by the milestone, do not invent fake behavior; instead:
  - implement the UI and stub calls cleanly, and
  - document the required server endpoint shape.

---

## R0.1 Fix/replace placeholder UI test suite

**Problem**
- Current test in [src/ui/src/App.test.tsx](src/ui/src/App.test.tsx) asserts “learn react”, which is not part of MeloAmp.

**Goal**
- Establish a minimal but meaningful test baseline covering navigation and authenticated/unauthenticated routing.

**Implementation Notes**
- Add a small test helper that wraps components with Router + ThemeProvider + i18n.
- Prefer testing routing outcomes rather than pixel-perfect UI.
- Likely files:
  - [src/ui/src/App.test.tsx](src/ui/src/App.test.tsx) (replace)
  - [src/ui/src/setupTests.ts](src/ui/src/setupTests.ts) (extend)

**Implementation Tasks**
- [ ] Replace default CRA test with a smoke test that renders `App` and asserts nav buttons exist.
- [ ] Add a test that when no JWT is present, Login screen is shown.
- [ ] Add a test that when JWT is present and `/users/me` succeeds, dashboard loads.

**Test Cases**
- [ ] Render without JWT → shows login form (or equivalent).
- [ ] Render with JWT + mocked `/users/me` → shows navbar + dashboard.
- [ ] 401 from `/users/me` → clears JWT and returns to login.

---

## R0.2 Add API mocking strategy for tests

**Goal**
- Make UI tests deterministic and fast.

**Options**
- **MSW (recommended)**: intercepts network at fetch/XHR level; good for integration-style tests.
- **axios-mock-adapter**: direct axios instance mocking; simpler but less realistic.

**Implementation Notes**
- Your axios instance lives in [src/ui/src/api.ts](src/ui/src/api.ts). If using axios-mock-adapter, ensure it attaches to that instance.

**Implementation Tasks**
- [ ] Pick approach (MSW or axios-mock-adapter) and add dependencies.
- [ ] Add a default handler for `/users/me` used by App bootstrap.
- [ ] Add helpers for paginated endpoints (`/artists`, `/albums`, `/songs`, `/users/playlists`).

**Test Cases**
- [ ] Mock success response returns deterministic UI.
- [ ] Mock error response triggers error state (Snackbar/banner).

---

## R0.3 Add smoke tests for core navigation

**Goal**
- Ensure the main routes render without crashing:
  - Dashboard, Artists, Albums, Songs, Playlists, Search, Queue.

**Implementation Notes**
- Routes are declared in [src/ui/src/App.tsx](src/ui/src/App.tsx).

**Implementation Tasks**
- [ ] Add one test per route rendering (with mocked API data).
- [ ] Verify the page heading exists (translated key fallback allowed).

**Test Cases**
- [ ] Navigate to `/artists` → shows Artists heading.
- [ ] Navigate to `/queue` with populated localStorage queue → shows list.

---

## R0.4 CI build matrix (Linux/Windows/macOS)

**Goal**
- Restore confidence that packaged artifacts run on each platform.

**Implementation Notes**
- Electron app is in `src/electron`.
- Packaging uses electron-builder configuration in [src/electron/package.json](src/electron/package.json).
- Existing scripts: `scripts/build-linux.sh`, `scripts/build-windows.ps1`.

**Implementation Tasks**
- [ ] Add GitHub Actions workflow building UI then electron for 3 OSes.
- [ ] Upload artifacts (`.AppImage`, `.exe`/`.msi`, `.dmg`).
- [ ] Cache yarn dependencies for faster builds.

**Test Cases**
- [ ] CI job runs `yarn build` for UI successfully.
- [ ] CI job creates electron-builder artifacts.

---

## R0.5 Auto-update support

**Goal**
- Users expect a desktop client to update itself or at least notify them.

**Implementation Notes**
- Likely add `electron-updater` and implement update checks in Electron main process.
- UI should show update availability and progress.

**Implementation Tasks**
- [ ] Add update dependency and wire update lifecycle events.
- [ ] Add a minimal UI surface: menu item “Check for updates” + toast/status.
- [ ] Ensure disabled in dev builds.

**Test Cases**
- [ ] Manual: “Check for updates” while offline shows friendly error.
- [ ] Manual: update available shows prompt; download progress updates.

---

## P1.1 Repeat modes (Off / All / One)

**Goal**
- Provide predictable replay behavior during long listening sessions.

**Acceptance Criteria**
- Repeat Off: reaches end of queue → stops.
- Repeat All: reaches end of queue → wraps to first song.
- Repeat One: song ends → same song restarts.
- Setting persists across restarts.

**Implementation Notes**
- Player logic lives in [src/ui/src/pages/Player.tsx](src/ui/src/pages/Player.tsx).
- Queue state is managed by Zustand in [src/ui/src/queueStore.ts](src/ui/src/queueStore.ts).
- Persist the repeat mode either in `userSettings` (preferred) or in `queueState`.

**Implementation Tasks**
- [ ] Add `repeatMode` enum to settings/store.
- [ ] Add UI control in Player (icon/button + tooltip).
- [ ] Update `onEnded` behavior to respect repeat mode.

**Test Cases**
- [ ] Unit: repeat one loops same index.
- [ ] Integration: end-of-queue + repeat all wraps to index 0.
- [ ] Persistence: reload retains repeat mode.

---

## P1.2 Shuffle mode

**Goal**
- Let users shuffle the queue without losing the currently playing song.

**Acceptance Criteria**
- Toggle shuffle in Player.
- When shuffle turns on, the currently playing song remains current.
- When shuffle turns off, return to original order (best-effort) OR clarify behavior (documented in UI).

**Implementation Notes**
- Store original order IDs when shuffling so you can restore.
- Queue already has a “Shuffle queue” button in QueueView; unify behavior.

**Implementation Tasks**
- [ ] Add shuffle state + original order snapshot.
- [ ] Add Player toggle.
- [ ] Reuse shuffle algorithm from QueueView but make it store-driven.

**Test Cases**
- [ ] Shuffle toggled on keeps current song.
- [ ] Shuffle toggled off restores original order.

---

## P1.3 Gapless-ish transitions

**Goal**
- Reduce silence between tracks (especially noticeable on albums).

**Acceptance Criteria**
- Preload next track when current track reaches e.g. 80–90%.
- Transition to next track with minimal delay.

**Implementation Notes**
- HTMLAudio can preload via `audio.preload = 'auto'`, but true gapless is difficult.
- A pragmatic approach: create a hidden second `<audio>` for next track, then swap.

**Implementation Tasks**
- [ ] Add a second audio element (or AudioBuffer strategy) to stage next.
- [ ] Pre-fetch stream URL (if needed) and warm connection.

**Test Cases**
- [ ] Manual: album playback shows reduced pauses.
- [ ] Unit: “staging” occurs once per track near threshold.

---

## P1.4 Volume normalization

**Goal**
- Maintain consistent loudness between tracks.

**Acceptance Criteria**
- User setting toggle: On/Off.
- If API exposes loudness metadata, apply gain.
- If not available, do nothing (no guessing).
- Prevent clipping by limiting gain.

**Implementation Notes**
- Requirements mention this, but current code does not implement it.
- Implement gain via WebAudio `GainNode` before EQ chain.

**Implementation Tasks**
- [ ] Extend API model if server exposes loudness fields.
- [ ] Add GainNode in Player audio graph.
- [ ] Add settings UI in [src/ui/src/pages/UserSettings.tsx](src/ui/src/pages/UserSettings.tsx).

**Test Cases**
- [ ] Unit: normalization toggle changes gain node value.
- [ ] Manual: switching tracks with different loudness does not cause big jumps.

---

## P1.5 Playback error recovery

**Goal**
- When a stream fails, users expect a clear message and the app to keep working.

**Acceptance Criteria**
- If a song URL fails to play:
  - Show Snackbar: “Could not play track. Skipping…”
  - Attempt one retry (configurable) then move to next track.
- If multiple consecutive failures: stop and show actionable error.

**Implementation Notes**
- Hook into `<audio>` events: `onError`, `onStalled`, `onWaiting` (with timeout).

**Implementation Tasks**
- [ ] Add error event handlers and retry counters.
- [ ] Add user-visible feedback + debug logs.

**Test Cases**
- [ ] Unit: error triggers retry once.
- [ ] Integration: mocked broken URL results in skip + snackbar.

---

## Q2.1 Queue action consistency (Play Next / Add to Queue)

**Goal**
- Users should be able to queue from anywhere with the same behavior.

**Acceptance Criteria**
- SongCard supports:
  - Play Now
  - Play Next
  - Add to Queue
  - Add to Playlist (see L2.3)
- Actions exist in Album/Artist detail views and Search results.

**Implementation Notes**
- There is a normalization helper [src/ui/src/components/toQueueSong.ts](src/ui/src/components/toQueueSong.ts).

**Implementation Tasks**
- [ ] Ensure SongCard exposes all actions.
- [ ] Add “Play Next” store action that inserts at `current + 1`.

**Test Cases**
- [ ] Unit: Play Next inserts at correct index.
- [ ] Integration: action from Search adds to queue.

---

## Q2.2 Queue history & undo

**Goal**
- Let users undo accidental removes/clears and navigate playback history.

**Acceptance Criteria**
- Undo remove (single item) within 5–10 seconds.
- Undo clear queue (restores prior queue + current index).
- Optional: Back button goes to previous track (history stack).

**Implementation Notes**
- Implement as a small stack in Zustand store (in-memory) plus snackbar actions.

**Implementation Tasks**
- [ ] Add `lastAction` snapshot and `undo()` method to store.
- [ ] Trigger snackbar with “Undo” action.

**Test Cases**
- [ ] Unit: remove then undo restores previous queue.
- [ ] Unit: clear then undo restores.

---

## Q2.3 Save queue to existing playlist (append/replace)

**Goal**
- Users expect to save their current queue into an existing playlist.

**Acceptance Criteria**
- QueueView “Save as Playlist” dialog includes:
  - Create new playlist (existing behavior)
  - Select existing playlist (autocomplete/select)
  - Mode: Append or Replace

**Implementation Notes**
- Queue save currently posts to `/Playlists` in [src/ui/src/pages/QueueView.tsx](src/ui/src/pages/QueueView.tsx).
- You’ll need API endpoints for add/replace songs; if missing, define server work.

**Implementation Tasks**
- [ ] Fetch user playlists for selection.
- [ ] Implement append/replace request.

**Test Cases**
- [ ] Integration: append adds songs while keeping prior.
- [ ] Integration: replace overwrites with queue song IDs.

---

## L2.1 Create playlist (from Playlist page)

**Goal**
- Users expect a dedicated “New Playlist” on the playlists screen.

**Acceptance Criteria**
- Button on PlaylistManager page.
- Dialog: name (required), description, public toggle, optional image.
- After create: navigate to playlist detail.

**Implementation Notes**
- Playlist list page: [src/ui/src/pages/PlaylistManager.tsx](src/ui/src/pages/PlaylistManager.tsx).

**Implementation Tasks**
- [ ] Add create dialog + form validation.
- [ ] POST `/Playlists`.
- [ ] Optional cover upload `/Playlists/{id}/image`.

**Test Cases**
- [ ] Unit: validation blocks empty name.
- [ ] Integration: create success navigates to detail.
- [ ] Integration: create failure shows snackbar.

---

## L2.2 Edit playlist metadata

**Goal**
- Users expect to rename playlists and update description/visibility.

**Acceptance Criteria**
- PlaylistDetailView shows edit controls for owners.
- Can change name/description/public and cover image.

**Implementation Notes**
- Ownership logic already exists in [src/ui/src/detailViews/PlaylistDetailView.tsx](src/ui/src/detailViews/PlaylistDetailView.tsx).

**Implementation Tasks**
- [ ] Add edit form + save.
- [ ] PUT `/Playlists/{id}` (or server equivalent).
- [ ] Image upload flow.

**Test Cases**
- [ ] Unit: non-owner cannot see edit controls.
- [ ] Integration: update success updates header.

---

## L2.3 Add/remove songs to playlists from anywhere

**Goal**
- A core expectation: “Add this song to a playlist” from browse/search.

**Acceptance Criteria**
- SongCard has “Add to Playlist…” action.
- Opens dialog:
  - choose playlist
  - optional: create new playlist inline
- Supports bulk add from Album/Artist detail view.

**Implementation Notes**
- You likely need endpoints:
  - POST `/Playlists/{id}/songs` with `{ songIds: [] }` (or similar)

**Implementation Tasks**
- [ ] Create reusable `PlaylistPickerDialog` component.
- [ ] Wire SongCard to open dialog.
- [ ] Add bulk add controls to album/artist pages.

**Test Cases**
- [ ] Integration: add one song to playlist.
- [ ] Integration: bulk add album songs.
- [ ] Failure: 403/401 shows message and does not corrupt UI.

---

## L2.4 Playlist import/export (M3U)

**Goal**
- Power users often want to move playlists between apps.

**Acceptance Criteria**
- Export playlist as M3U (download file).
- Import M3U:
  - match songs by ID if present, otherwise by artist/title/album heuristic.
  - show import summary (matched/unmatched counts).

**Implementation Notes**
- If server supports export/import, use it. If not, do client-side export using song stream URLs or IDs.

**Implementation Tasks**
- [ ] Add “Export” action in PlaylistDetailView.
- [ ] Add “Import” action in PlaylistManager.

**Test Cases**
- [ ] Unit: export produces valid M3U header + entries.
- [ ] Manual: import file with mixed matches shows summary.

---

## S3.1 Unified search query propagation

**Goal**
- Top-bar search should reliably drive Search page and keep the query in the URL.

**Acceptance Criteria**
- Typing in top bar and pressing Enter navigates to `/search?q=...`.
- SearchPage initializes from URL and keeps URL updated.

**Implementation Notes**
- Top bar currently navigates to `/search` but does not pass the query.
- SearchPage already reads `?q=`.

**Implementation Tasks**
- [ ] Update top-bar navigation to include query string.
- [ ] Ensure clearing search removes `q` param.

**Test Cases**
- [ ] Integration: type in top bar → URL includes `q` and results render.

---

## S3.2 Search filters (type toggles + sort)

**Goal**
- Let users focus on the content they care about.

**Acceptance Criteria**
- Filters: Artists / Albums / Songs / Playlists toggles.
- Sort options per type (name/recent/rating where available).

**Implementation Notes**
- Server search currently accepts pages for artists/albums/songs; playlists appear in response.
- If server lacks filtering, implement client-side hide/show first.

**Implementation Tasks**
- [ ] Add filter UI.
- [ ] Update request payload if server supports filtering.

**Test Cases**
- [ ] Unit: toggling hides/shows sections.
- [ ] Integration: filter state persists in URL (optional but recommended).

---

## S3.3 Recent searches

**Goal**
- Make it easy to repeat searches.

**Acceptance Criteria**
- Shows last N queries under search box.
- Click to re-run.
- Clear history.

**Implementation Notes**
- Store in localStorage (per device).

**Implementation Tasks**
- [ ] Add `recentSearches` helper.

**Test Cases**
- [ ] Unit: adding searches caps at N.
- [ ] Integration: clicking history item runs search.

---

## B3.1 Browse by genre

**Goal**
- Users expect discovery and quick filtering.

**Acceptance Criteria**
- New route `/genres` listing genres.
- Genre detail page shows artists/albums/songs for genre.

**Implementation Notes**
- Artist and Album models include `genres` / `genre` fields.
- Requires API support (ideal) or client aggregation (expensive) — prefer API.

**Implementation Tasks**
- [ ] Add pages and routes.
- [ ] Add API calls (`/genres`, `/genres/{id}/artists`, etc.) or agree server contract.

**Test Cases**
- [ ] Integration: genre list renders and navigates.

---

## B3.2 Favorites & ratings library pages

**Goal**
- Provide quick access to liked/disliked/top-rated items.

**Acceptance Criteria**
- New pages for:
  - Liked songs
  - Disliked songs
  - Top rated songs
- Optional: liked artists/albums.

**Implementation Notes**
- Song model includes `userStarred` and `userRating`.
- Needs API support for querying by rating/star.

**Implementation Tasks**
- [ ] Add routes/pages.
- [ ] Add server query params or endpoints.

**Test Cases**
- [ ] Integration: liked songs page shows only starred songs.

---

## D4.2 Global media keys

**Goal**
- OS-level media keys should control playback.

**Acceptance Criteria**
- Play/Pause/Next/Previous work when app is in background.
- Shortcuts are configurable in settings.

**Implementation Notes**
- Implement in Electron main with `globalShortcut` and IPC to renderer.
- Renderer listens and calls Player actions.

**Implementation Tasks**
- [ ] Add IPC channel `meloamp-media-key`.
- [ ] Add configurable mapping in settings.

**Test Cases**
- [ ] Manual: media keys control playback while app unfocused.

---

## D4.3 System tray controls

**Goal**
- Quick access without keeping the window visible.

**Acceptance Criteria**
- Tray icon shows menu:
  - Play/Pause
  - Next/Previous
  - Show/Hide window
  - Quit

**Implementation Notes**
- Electron tray APIs in main process.

**Implementation Tasks**
- [ ] Add tray creation on app ready.
- [ ] Wire menu to IPC and window show/hide.

**Test Cases**
- [ ] Manual: tray menu performs actions.

---

## D4.4 Windows SMTC + macOS media integration parity

**Goal**
- Match Linux MPRIS capabilities on Windows/macOS.

**Acceptance Criteria**
- Windows: integrates with system media overlay (SMTC).
- macOS: integrates with media keys/Now Playing.

**Implementation Notes**
- Likely requires platform-specific libraries or Electron APIs.

**Implementation Tasks**
- [ ] Research and implement per-platform adapters.
- [ ] Keep a shared “now playing” state source from renderer.

**Test Cases**
- [ ] Manual: verify OS media overlay shows track and controls.

---

## U5.1 Standard loading/empty/error components

**Goal**
- Consistent feedback patterns across the app.

**Acceptance Criteria**
- All pages use:
  - `LoadingState`
  - `EmptyState`
  - `ErrorBanner` (+ retry)
- Errors also show snackbar.

**Implementation Notes**
- Requirements mention reusable feedback components, but current code often inlines spinners.

**Implementation Tasks**
- [ ] Add components under `src/ui/src/components/feedback/`.
- [ ] Refactor pages to use them.

**Test Cases**
- [ ] Unit: `EmptyState` renders message and optional CTA.
- [ ] Integration: failed API shows `ErrorBanner` and retry refetches.

---

## U5.2 Keyboard shortcuts & command palette-lite

**Goal**
- Power users expect fast navigation.

**Acceptance Criteria**
- Shortcuts:
  - Focus search (Ctrl/Cmd+K)
  - Play/Pause (Space)
  - Next/Previous (Ctrl+Right/Left)
  - Open Queue (Ctrl+Q)
- “Help” dialog listing shortcuts.

**Implementation Notes**
- Keep shortcuts discoverable and editable in settings.

**Implementation Tasks**
- [ ] Add keydown handler at app shell.
- [ ] Add shortcuts help dialog.

**Test Cases**
- [ ] Integration: Ctrl+K focuses search input.

---

## U5.3 Better localization coverage

**Goal**
- Avoid mixed English strings when using other locales.

**Acceptance Criteria**
- No user-visible hard-coded strings in core flows.
- Missing keys fall back cleanly.

**Implementation Notes**
- Audit strings in pages/components; use `t()`.

**Implementation Tasks**
- [ ] Add/repair i18n keys across locales.

**Test Cases**
- [ ] Snapshot/integration: switching language updates main navigation labels.
