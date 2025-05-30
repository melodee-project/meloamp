export interface User {
	id: string;
	avatarThumbnailUrl?: string;
	avatarUrl?: string;
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