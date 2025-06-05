# API Models

This file defines TypeScript interfaces for a music application, including user profiles, artists, albums, songs, playlists and scrobbling. Also included are interfaces for paginated responses and login requests/responses.The interfaces are designed to be used with the Melodee RESTful API, allowing for structured data exchange between MeloAmp and Melodee.

In some models there are image URls
* A smaller "thumbnail" Url (80x80) 
* A larger "image" Url (1024x1024).

## Data Models
```typescript
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

// Response model from a search request
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

// Response model after a successful login.
export interface LoginResponse {
	user: User;
    serverVersion: number;
	token: string; // JWT token for all requests after login
}

```

## Request Models
These models are data models posted to the API for specific requests.

```typescript

  export enum StatisticType {
     INFORMATION = 'information',
     WARNING = 'warning',
     ERROR = 'error',
     COUNT = 'count'
   }

// Model for displaying API statistics, such as user counts, song counts, etc. Used in the dashboard or statistics page.
export interface Statistic {
	type: StatisticType;
	title: string;
	data: string;
	description?: string;
	sortOrder?: number;
}
// Request model for authenticating a user.
export interface LoginRequest {
	email: string;
	password: string;
}

export enum ScrobbleType {
    NOW_PLAYING = 'nowPlaying',
    PLAYED = 'played'
}

// Request model posted when creating a scrobble event while playing a song.
export interface ScrobbleResut {
	songId: string;
	playerName: "Meloamp";
	scrobbleType: ScrobbleType;
	timestamp: number; // Unix timestamp in milliseconds
	playbackDuration: number; // Duration of the song played in milliseconds, when "played" this is used, can be 0 or null when "nowPlaying"
}
```

## Pagination Models
These models defined the response when a paginated list (or collection) request is performed. e.g. a list of artists, songs, users, playlists.

```typescript
// Result model when sending a request of a paginated request, used when fetching a paginated list of items.
export interface PaginatedResponse<T> {
	data: T[];
	meta: Meta;
}

// Model for meta pagination information used in paginated and search responses.
export interface Meta {
	totalCount: number;
	pageSize: number;
	currentPage: number;	
	totalPages: number;
	hasNext: boolean;
	hasPrevious: boolean;
}


```



