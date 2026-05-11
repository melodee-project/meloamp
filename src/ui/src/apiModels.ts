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

export interface UserSummary {
  apiKey: string;
  userName: string;
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

export interface SearchResultResponse {
  meta: Meta;
  data: SearchResultData;
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
  q?: string;
  page?: number;
  limit?: number;
  types?: Array<'artists' | 'albums' | 'songs' | 'playlists'>;
  artistApiKey?: string;
  filterByArtistApiKey?: string;
  filterByAlbumApiKey?: string;
  albumPageValue?: number | string;
  artistPageValue?: number | string;
  songPageValue?: number | string;
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
  playCount: number;
  playTime: number;
  rank: number;
  type?: string;
  imageUrl?: string | null;
}

export interface TopContentResponse {
  items: TopContentItem[];
  period: string;
  type: string;
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
  playlist: SmartPlaylistModel;
  meta: Meta;
  data: Song[];
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
  playlistApiKey: string;
  totalEntries: number | string;
  matchedCount: number | string;
  missingCount: number | string;
  missingReferences: string[];
}

export interface SimilarItem {
  id: string;
  name: string;
  type: string;
  artist?: string;
  similarityScore: number | string;
  imageUrl?: string;
}

export interface SimilarResponse {
  similar: SimilarItem[];
  items?: SimilarItem[];
}

export interface SearchSuggestion {
  id: string;
  name: string;
  type: string;
  thumbnailUrl: string;
}

export interface SearchSuggestResponse {
  artists: SearchSuggestion[];
  albums: SearchSuggestion[];
  songs: SearchSuggestion[];
  playlists: SearchSuggestion[];
}

export type SearchSuggestionResponse = SearchSuggestResponse;

export interface SearchNumericRangeFilter {
  min?: number | string | null;
  max?: number | string | null;
}

export interface AdvancedSearchFilters {
  year?: SearchNumericRangeFilter | null;
  bpm?: SearchNumericRangeFilter | null;
  duration?: SearchNumericRangeFilter | null;
  genre?: string[] | null;
  mood?: string[] | null;
  key?: string | null;
  artist?: string | null;
  album?: string | null;
}

export interface AdvancedSearchRequest {
  query?: string | null;
  filters?: AdvancedSearchFilters | null;
  types?: string[] | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  page?: number | string | null;
  limit?: number | string | null;
}

export interface AdvancedSearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface AdvancedSearchResponse {
  results: AdvancedSearchResults;
  meta: Meta;
}

export interface SongPagedResponse {
  data: Song[];
  meta: Meta;
}

export interface UserStatsResponse {
  periodDays: number | string;
  totalPlays: number;
  favoriteSongs: number;
  favoriteAlbums: number;
  favoriteArtists: number;
  ratedSongs: number;
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
  category: RequestCategory;
  status: RequestStatus;
  description: string;
  artistName: string | null;
  albumTitle: string | null;
  songTitle: string | null;
  releaseYear: number | string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  lastActivityType: string;
  commentCount: number | string;
  createdByUser: UserSummary;
}

export interface RequestDetail {
  apiKey: string;
  description: string;
  category: RequestCategory;
  status: RequestStatus;
  artistName: string | null;
  targetArtistApiKey: string | null;
  albumTitle: string | null;
  targetAlbumApiKey: string | null;
  songTitle: string | null;
  targetSongApiKey: string | null;
  releaseYear: number | string | null;
  externalUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  lastActivityType: string;
  commentCount: number | string;
  createdByUser: UserSummary;
  lastActivityUser: UserSummary | null;
}

export interface RequestCommentDto {
  apiKey: string;
  parentCommentApiKey: string | null;
  body: string;
  isSystem: boolean;
  createdAt: string;
  createdByUser: UserSummary | null;
}

export interface UnreadRequestSummary {
  apiKey: string;
  category: RequestCategory;
  status: RequestStatus;
  description: string;
  lastActivityAt: string;
  lastActivityType: string;
  lastActivityUser: UserSummary | null;
}

export interface RequestPagedResponse {
  meta: Meta;
  data: RequestSummary[];
}

export interface CommentPagedResponse {
  meta: Meta;
  data: RequestCommentDto[];
}

export interface CreateRequestRequest {
  description: string;
  category: RequestCategory;
  artistName?: string | null;
  targetArtistApiKey?: string | null;
  albumTitle?: string | null;
  targetAlbumApiKey?: string | null;
  songTitle?: string | null;
  targetSongApiKey?: string | null;
  releaseYear?: number | string | null;
  externalUrl?: string | null;
  notes?: string | null;
}

export interface UpdateRequestRequest {
  description?: string;
  artistName?: string | null;
  targetArtistApiKey?: string | null;
  albumTitle?: string | null;
  targetAlbumApiKey?: string | null;
  songTitle?: string | null;
  targetSongApiKey?: string | null;
  releaseYear?: number | string | null;
  externalUrl?: string | null;
  notes?: string | null;
}

export interface CreateCommentRequest {
  body: string;
  parentCommentApiKey?: string | null;
}

export interface PagedResponseOfUnreadRequestSummary {
  meta: Meta;
  data: UnreadRequestSummary[];
}

export interface ActivityCheckResponse {
  hasUnread: boolean;
}

export type RequestCategory = string | number;
export type RequestStatus = string | number;

export interface LinkedProviderInfo {
  provider: string;
  email: string | null;
  linkedAt: string | null;
  lastLoginAt: string | null;
}

export interface GoogleLinkRequest {
  idToken: string;
}

export interface PublicShareResponse {
  shareType: string;
  resourceName: string;
  description: string | null;
  thumbnailUrl: string;
  imageUrl: string;
  isDownloadable: boolean;
  createdAt: string;
  expiresAt: string | null;
  artist: PublicArtistInfo | null;
  album: PublicAlbumInfo | null;
  song: PublicSongInfo | null;
  playlist: PublicPlaylistInfo | null;
}

export interface PublicAlbumInfo {
  id: string;
  name: string;
  artistName: string;
  releaseYear: number | string;
  songs: PublicSongInfo[];
}

export interface PublicArtistInfo {
  id: string;
  name: string;
}

export interface PublicPlaylistInfo {
  id: string;
  name: string;
  description: string | null;
  songs: PublicSongInfo[];
}

export interface PublicSongInfo {
  id: string;
  title: string;
  trackNumber: number | string;
  durationMs: number;
  streamUrl: string;
}

export interface ArtistLookupRequest {
  artistName: string;
  limit?: number;
  providerIds?: string[] | null;
}

export interface ArtistLookupCandidate {
  providerDisplayName: string;
  providerId?: string | null;
  name: string;
  sortName?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  musicBrainzId?: string | null;
  spotifyId?: string | null;
  discogsId?: string | null;
  amgId?: string | null;
  wikiDataId?: string | null;
  itunesId?: string | null;
  lastFmId?: string | null;
}

export interface ProviderInfo {
  id: string;
  displayName: string;
  isEnabled?: boolean;
}

export interface ArtistLookupResponse {
  candidates: ArtistLookupCandidate[];
  hasPartialFailures: boolean;
  providers: ProviderInfo[];
}

export interface BpmTrackItem {
  song: Song;
  bpm: number;
}

export interface BpmTracksResponse {
  tracks: BpmTrackItem[];
  meta: Meta;
}

export interface UserStatsHistoryEntry {
  date: string;
  plays: number;
}

export interface UserStatsHistoryResponse {
  periodDays?: number;
  items: UserStatsHistoryEntry[];
}

export interface TopItemResponse {
  name: string;
  playCount: number;
  songId: string | null;
}

export interface UserStatsPlaysPerDay {
  day: string;
  playCount: number;
}

export interface UserStatsPlaysPerDayResponse {
  days: UserStatsPlaysPerDay[];
}

export interface UserTopGenreItem {
  name: string;
  playCount: number;
  songId?: string | null;
}

export interface UserStatsTopGenresResponse {
  items: TopItemResponse[];
}

export interface UserTopSongItem {
  name: string;
  playCount: number;
  songId: string | null;
}

export interface UserStatsTopSongsResponse {
  items: TopItemResponse[];
}

export interface TimeSeriesDataPoint {
  date: string;
  plays: number;
}

export interface TimeSeriesResponse {
  periodDays: number | string;
  data: TimeSeriesDataPoint[];
}

export interface PlaybackSettings {
  crossfadeDuration: number | string;
  gaplessPlayback: boolean;
  volumeNormalization: boolean;
  replayGain: string;
  audioQuality: string;
  equalizerPreset: string | null;
  lastUsedDevice: string | null;
}

export interface UpdatePlaybackSettingsRequest {
  crossfadeDuration?: number | string | null;
  gaplessPlayback?: boolean | null;
  volumeNormalization?: boolean | null;
  replayGain?: string | null;
  audioQuality?: string | null;
  equalizerPreset?: string | null;
}

export interface BackendCapabilities {
  canPlay?: boolean;
  canPause?: boolean;
  canStop?: boolean;
  canSeek?: boolean;
  canSkip?: boolean;
  canSetVolume?: boolean;
  canReportPosition?: boolean;
  isAvailable?: boolean;
  backendInfo?: string | null;
}

export interface BackendStatus {
  isPlaying: boolean;
  positionSeconds: number | string;
  volume: number | string | null;
  currentItemApiKey: string | null;
  isConnected: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
}

export interface Endpoint {
  apiKey: string;
  name: string;
  type: string;
  isShared: boolean;
  room: string | null;
  lastSeenAt: string | null;
  capabilitiesJson: string | null;
  isOwner: boolean;
}

export interface EndpointDto {
  apiKey: string;
  name: string;
  type: string;
  isShared: boolean;
  room: string | null;
  lastSeenAt: string | null;
  capabilitiesJson: string | null;
  isOwner: boolean;
}

export interface AttachEndpointRequest {
  sessionApiKey: string;
}

export interface AdminUserInfo {
  id: string;
  username: string;
  email: string | null;
  isAdmin: boolean;
  isEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export type AdminUser = AdminUserInfo;
