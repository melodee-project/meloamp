/**
 * Image utility functions for selecting appropriate image URLs
 */

export interface ImageUrls {
	thumbnailUrl?: string;
	imageUrl?: string;
}

export interface UserImageUrls {
	avatarThumbnailUrl?: string;
	avatarUrl?: string;
}

/**
 * Gets the appropriate image URL for music entities (artists, albums, songs, playlists)
 * @param urls - Object containing thumbnailUrl and imageUrl
 * @param preferLarge - Whether to prefer the larger image for better clarity
 * @returns The best available image URL or fallback
 */
export function getMusicImageUrl(urls: ImageUrls, preferLarge: boolean = false): string {
	if (preferLarge) {
		return urls.imageUrl || urls.thumbnailUrl || '/placeholder-music.png';
	}
	return urls.thumbnailUrl || urls.imageUrl || '/placeholder-music.png';
}

/**
 * Gets the appropriate avatar URL for users
 * @param urls - Object containing avatarThumbnailUrl and avatarUrl
 * @param preferLarge - Whether to prefer the larger avatar for better clarity
 * @returns The best available avatar URL or fallback
 */
export function getUserAvatarUrl(urls: UserImageUrls, preferLarge: boolean = false): string {
	if (preferLarge) {
		return urls.avatarUrl || urls.avatarThumbnailUrl || '/placeholder-user.png';
	}
	return urls.avatarThumbnailUrl || urls.avatarUrl || '/placeholder-user.png';
}

/**
 * Context-aware image URL selection for different use cases
 */
export const ImageContext = {
	// Large contexts where clarity is important
	HERO_DISPLAY: 'hero',
	DETAIL_VIEW: 'detail',
	RECENT_ITEMS: 'recent',
	FEATURED: 'featured',
	
	// Small contexts where smaller images are sufficient
	LIST_ITEM: 'list',
	GRID_THUMBNAIL: 'thumbnail',
	NAVIGATION: 'nav',
	COMPACT: 'compact'
} as const;

export type ImageContextType = typeof ImageContext[keyof typeof ImageContext];

/**
 * Gets image URL based on context
 * @param urls - Image URLs object
 * @param context - The context where the image will be displayed
 * @returns Appropriate image URL for the context
 */
export function getContextualImageUrl(
	urls: ImageUrls,
	context: ImageContextType
): string {
	const useLargeImage = ([
		ImageContext.HERO_DISPLAY,
		ImageContext.DETAIL_VIEW,
		ImageContext.RECENT_ITEMS,
		ImageContext.FEATURED
	] as const).includes(context as any);
	
	return getMusicImageUrl(urls, useLargeImage);
}

/**
 * Gets user avatar URL based on context
 * @param urls - Avatar URLs object
 * @param context - The context where the avatar will be displayed
 * @returns Appropriate avatar URL for the context
 */
export function getContextualAvatarUrl(
	urls: UserImageUrls,
	context: ImageContextType
): string {
	const useLargeAvatar = ([
		ImageContext.HERO_DISPLAY,
		ImageContext.DETAIL_VIEW,
		ImageContext.FEATURED
	] as const).includes(context as any);
	
	return getUserAvatarUrl(urls, useLargeAvatar);
} 