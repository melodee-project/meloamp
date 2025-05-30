import type { User } from './user';

export interface Artist {
	id: string;
	name: string;
	bio?: string;
	thumbnailUrl?: string;
	imageUrl?: string;
	albumCount: number;
	songCount: number;
	genres: string[];
	userStarred: boolean;
	userRating: number;
	createdAt: string;
	updatedAt: string;
}

export interface Album {
	id: string;
	name: string;
	artist: string;
	artistId: string;
	releaseYear: number;
	thumbnailUrl?: string;
	imageUrl?: string;
	genre: string;	
	songCount: number;
	duration: number;
	durationFormatted: string;
	description?: string;
	userStarred: boolean;
	userRating: number;
	createdAt: string;
	updatedAt: string;
}

export interface Song {
	id: string;
	title: string;
	artist: Artist;
	album: Album;
	songNumber: number;
	duration: number;
	durationFormatted: string;
	thumbnailUrl?: string;
	imageUrl?: string;
	streamUrl?: string;
	genre?: string;
	bitrate?: number;
	playCount: number;
	userStarred: boolean;
	userRating: number;
	createdAt: string;
	updatedAt: string;
}

export interface Playlist {
	id: string;
	name: string;
	description?: string;
	thumbnailUrl?: string;
	imageUrl?: string;
	duration: number;
	durationFormatted: string;	
	isPublic: boolean;
	songCount: number;
	owner: User;
	createdAt: string;
	updatedAt: string;
}

export interface RecentlyPlayed {
	song: Song;
	playedAt: string;
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