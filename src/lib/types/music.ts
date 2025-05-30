export interface Artist {
	id: string;
	name: string;
	bio?: string;
	image?: string;
	albumCount: number;
	songCount: number;
	genres: string[];
	createdAt: string;
	updatedAt: string;
}

export interface Album {
	id: string;
	title: string;
	artist: string;
	artistId: string;
	releaseDate: string;
	image?: string;
	coverArt?: string;
	year?: number;
	genre: string;
	trackCount: number;
	songCount?: number;
	duration: number;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Song {
	id: string;
	title: string;
	artist: string;
	album: string;
	artistId: string;
	albumId: string;
	trackNumber: number;
	duration: number;
	image?: string;
	fileUrl: string;
	genre: string;
	bitrate?: number;
	sampleRate?: number;
	playCount: number;
	liked: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Playlist {
	id: string;
	name: string;
	description?: string;
	image?: string;
	coverArt?: string;
	isPublic: boolean;
	songCount: number;
	duration: number;
	owner: {
		id: string;
		username: string;
		avatar?: string;
	};
	songs?: Song[];
	createdAt: string;
	updatedAt: string;
}

export interface RecentlyPlayed {
	song: Song;
	playedAt: string;
}

export interface SearchResults {
	artists: Artist[];
	albums: Album[];
	songs: Song[];
	playlists: Playlist[];
	total: number;
}

export interface PlayerState {
	currentSong: Song | null;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	queue: Song[];
	currentIndex: number;
	shuffle: boolean;
	repeat: 'none' | 'one' | 'all';
} 