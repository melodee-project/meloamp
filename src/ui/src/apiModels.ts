// apiModels.ts - Generated from APIMODELS.md

export interface User {
  id: string;
  thumbnailUrl: string;
  imageUrl: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isEditor: boolean;
  roles: string[];
  songsPlayed: number;
  artistsLiked: number;
  artistsDisliked: number;
  albumsLiked: number;
  albumsDisliked: number;
  songsLiked: number;
  songsDisliked: number;
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  thumbnailUrl: string;
  imageUrl: string;
  name: string;
  userStarred: boolean;
  userRating: number;
  albumCount: number;
  songCount: number;
  createdAt: string;
  updatedAt: string;
  biography?: string | null;
  genres?: string[] | null;
}

export interface Album {
  id: string;
  artist: Artist;
  thumbnailUrl: string;
  imageUrl: string;
  name: string;
  releaseYear: number;
  userStarred: boolean;
  userRating: number;
  songCount: number;
  durationMs: number;
  durationFormatted: string;
  createdAt: string;
  updatedAt: string;
  description?: string | null;
  genre?: string | null;
}

export interface Song {
  id: string;
  artist: Artist;
  album: Album;
  streamUrl: string;
  thumbnailUrl: string;
  imageUrl: string;
  title: string;
  durationMs: number;
  durationFormatted: string;
  userStarred: boolean;
  userRating: number;
  songNumber: number;
  bitrate: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
  genre?: string | null;
}

export interface Playlist {
  id: string;
  thumbnailUrl: string;
  imageUrl: string;
  name: string;
  description: string;
  durationMs: number;
  durationFormatted: string;
  songCount: number;
  isPublic: boolean;
  owner: User;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResultData {
  meta: Meta;
  totalCount: number;
  artists: Artist[];
  totalArtists: number;
  albums: Album[];
  totalAlbums: number;
  songs: Song[];
  totalSongs: number;
  playlists: Playlist[];
  totalPlaylists: number;
}

export interface SearchRequest {
  query: string;
  type?: 'artists' | 'albums' | 'songs' | 'playlists';
  albumPage?: number;
  artistPage?: number;
  songPage?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterByArtistId?: string;
};

export interface LoginResponse {
  user: User;
  serverVersion: number;
  token: string;
}

export enum StatisticType {
  INFORMATION = 'information',
  WARNING = 'warning',
  ERROR = 'error',
  COUNT = 'count',
}

export interface Statistic {
  type: StatisticType;
  title: string;
  data: string;
  description?: string;
  sortOrder?: number;
}

export interface ServerInfo {
  name: string;
  description: string;
  version: string;
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
}

export interface LoginRequest {
  userName?: string;
  email: string;
  password: string;
}

export enum ScrobbleType {
  NOW_PLAYING = 'nowPlaying',
  PLAYED = 'played',
}

export interface ScrobbleRequest {
  songId: string;
  playerName: 'MeloAmp';
  scrobbleType: ScrobbleType;
  timestamp?: number;
  playedDuration?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

export interface Meta {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Genre {
  id: string;
  name: string;
  songCount: number;
  albumCount: number;
}

export interface GenreListResponse {
  data: Genre[];
  meta: Meta;
}

export interface GenreSongsResponse {
  data: Song[];
  meta: Meta;
}

export interface AudioFeatures {
  id: string;
  tempo: number;
  key: string | null;
  mode: string | null;
  timeSignature: number;
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  valence: number;
}

export interface LyricsLine {
  text: string;
  startMs: number | null;
}

export interface Lyrics {
  songId: string;
  language: string;
  isSynced: boolean;
  plainText: string | null;
  lines: LyricsLine[] | null;
  displayArtist: string | null;
  displayTitle: string | null;
  offset: number | null;
}

export interface RecommendationItem {
  id: string;
  name: string;
  type: string;
  artist: string | null;
  reason: string | null;
  imageUrl: string | null;
}

export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  category: string | null;
}

export interface AnalyticsItem {
  id: string;
  name: string;
  playCount: number;
  playTime: number;
}

export interface AnalyticsGenre {
  name: string;
  playCount: number;
  playTime: number;
}

export interface ListeningByHour {
  hour: number;
  playTime: number;
}

export interface ListeningByDay {
  day: string;
  playTime: number;
}

export interface ListeningStatistics {
  period: string;
  totalPlayTime: number;
  totalTracksPlayed: number;
  topArtists: AnalyticsItem[];
  topAlbums: AnalyticsItem[];
  topGenres: AnalyticsGenre[];
  listeningByTimeOfDay: ListeningByHour[];
  listeningByDayOfWeek: ListeningByDay[];
}

export interface TopContentItem {
  id: string;
  name: string;
  type: string;
  playCount: number;
  imageUrl: string | null;
}

export interface TopContentResponse {
  items: TopContentItem[];
  period: string;
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  bands: EqualizerBand[];
  isDefault: boolean;
}

export interface CreateEqualizerPresetRequest {
  name: string;
  bands: EqualizerBand[];
}

export interface ThemePackInfo {
  id: string;
  name: string;
  author?: string | null;
  version?: string | null;
  description?: string | null;
  isBuiltIn: boolean;
  previewImage?: string | null;
  hasWarnings: boolean;
  warningDetails?: string[] | null;
}

export interface SetUserThemeRequest {
  themeId: string;
}

export interface Share {
  id: string;
  shareUrl: string;
  shareType: string;
  resourceId: string;
  resourceName: string;
  resourceThumbnailUrl: string;
  resourceImageUrl: string;
  description: string | null;
  isDownloadable: boolean;
  visitCount: number;
  owner: User;
  createdAt: string;
  expiresAt: string | null;
  lastVisitedAt: string | null;
}

export interface CreateShareRequest {
  resourceId: string;
  shareType: ShareType;
  description?: string;
  isDownloadable?: boolean;
  expiresAt?: string;
}

export interface UpdateShareRequest {
  description?: string;
  isDownloadable?: boolean;
  expiresAt?: string;
}

export enum ShareType {
  Album = 'Album',
  Artist = 'Artist',
  Playlist = 'Playlist',
  Song = 'Song',
}

export interface SmartPlaylistModel {
  apiKey: string;
  name: string;
  mqlQuery: string;
  entityType: string;
  lastResultCount: number;
  lastEvaluatedAt: string;
  isPublic: boolean;
  normalizedQuery: string | null;
  createdAt: string;
  owner: User;
}

export interface CreateSmartPlaylistRequest {
  name: string;
  mqlQuery: string;
  entityType: string;
  isPublic?: boolean;
}

export interface UpdateSmartPlaylistRequest {
  name?: string;
  mqlQuery?: string;
  isPublic?: boolean;
}

export interface SmartPlaylistEvaluateResponse {
  results: Song[];
  resultCount: number;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  songIds?: string[];
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface ReorderPlaylistSongsRequest {
  songId: string;
  fromIndex: number;
  toIndex: number;
}

export interface PlaylistImportResult {
  imported: number;
  skipped: number;
  playlist: Playlist;
}

export interface SimilarItem {
  id: string;
  name: string;
  type: string;
  artist?: string;
  similarity: number;
  imageUrl?: string;
}

export interface SimilarResponse {
  items: SimilarItem[];
}

export interface SearchSuggestion {
  text: string;
  type: string;
}

export interface SearchSuggestResponse {
  suggestions: SearchSuggestion[];
}

export interface AdvancedSearchFilters {
  query?: string;
  artistId?: string;
  albumId?: string;
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  durationFrom?: number;
  durationTo?: number;
  bitrateFrom?: number;
  bitrateTo?: number;
  userStarred?: boolean;
  userRatingMin?: number;
  userRatingMax?: number;
}

export interface AdvancedSearchRequest {
  filters: AdvancedSearchFilters;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface AdvancedSearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}

export interface AdvancedSearchResponse {
  results: AdvancedSearchResults;
  meta: Meta;
}

export interface UserStatsResponse {
  totalPlayTime: number;
  totalTracksPlayed: number;
  uniqueArtistsPlayed: number;
  uniqueAlbumsPlayed: number;
  averageDailyPlayTime: number;
}

export interface HistoryItem {
  id: string;
  song: Song;
  playedAt: string;
  duration: number;
}

export interface HistoryResponse {
  data: HistoryItem[];
  meta: Meta;
}

export interface ChartListModel {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  imageUrl?: string;
}

export interface ChartDetailModel {
  id: string;
  name: string;
  description?: string;
  tracks: ChartTrackModel[];
}

export interface ChartTrackModel {
  position: number;
  song: Song;
  previousPosition?: number;
}

export interface ChartPagedResponse {
  data: ChartListModel[];
  meta: Meta;
}

export interface RequestSummary {
  apiKey: string;
  title: string;
  category: RequestCategory;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RequestDetail {
  apiKey: string;
  title: string;
  description?: string;
  category: RequestCategory;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  comments: RequestCommentDto[];
}

export interface RequestCommentDto {
  id: string;
  content: string;
  createdAt: string;
  author: User;
}

export interface CreateRequestRequest {
  title: string;
  description?: string;
  category: RequestCategory;
}

export interface UpdateRequestRequest {
  title?: string;
  description?: string;
  category?: RequestCategory;
  status?: RequestStatus;
}

export enum RequestCategory {
  Feature = 'Feature',
  Bug = 'Bug',
  Content = 'Content',
  Other = 'Other',
}

export enum RequestStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Closed = 'Closed',
}

export interface PublicShareResponse {
  share: Share;
  resource: PublicAlbumInfo | PublicArtistInfo | PublicPlaylistInfo | PublicSongInfo;
}

export interface PublicAlbumInfo {
  type: 'Album';
  id: string;
  name: string;
  artist: PublicArtistInfo;
  songs: Song[];
  imageUrl: string;
}

export interface PublicArtistInfo {
  type: 'Artist';
  id: string;
  name: string;
  imageUrl: string;
}

export interface PublicPlaylistInfo {
  type: 'Playlist';
  id: string;
  name: string;
  description: string;
  songs: Song[];
  imageUrl: string;
}

export interface PublicSongInfo {
  type: 'Song';
  id: string;
  title: string;
  artist: PublicArtistInfo;
  album: PublicAlbumInfo;
  streamUrl: string;
  imageUrl: string;
}

export interface ArtistLookupRequest {
  name: string;
  limit?: number;
}

export interface ArtistLookupCandidate {
  name: string;
  disambiguation?: string;
  imageUrl?: string;
  externalId: string;
  source: string;
}

export interface ArtistLookupResponse {
  candidates: ArtistLookupCandidate[];
}
