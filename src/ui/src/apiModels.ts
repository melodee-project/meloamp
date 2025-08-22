// apiModels.ts - Generated from APIMODELS.md

export interface User {
  id: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isEditor: boolean;
  roles?: string[];
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
  thumbnailUrl?: string;
  imageUrl?: string;
  name: string;
  userStarred: boolean;
  userRating: number;
  albumCount: number;
  songCount: number;
  createdAt: string;
  updatedAt: string;
  biography?: string;
  genres?: string[];
}

export interface Album {
  id: string;
  artist: Artist;
  thumbnailUrl?: string;
  imageUrl?: string;
  name: string;
  releaseYear: number;
  userStarred: boolean;
  userRating: number;
  songCount: number;
  durationMs: number;
  durationFormatted: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  genre: string;
}

export interface Song {
  id: string;
  artist: Artist;
  album: Album;
  streamUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
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
  genre?: string;
}

export interface Playlist {
  id: string;
  thumbnailUrl?: string;
  imageUrl?: string;
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
  data: {
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
}

export interface SearchRequest {
  query: string;
  type?: 'artists' | 'albums' | 'songs' | 'playlists';
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  timestamp: number;
  playbackDuration: number;
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
