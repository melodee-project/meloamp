<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { _ } from '$lib/i18n';
	import { Play, Users, Disc3, Music, ListMusic, Star } from 'lucide-svelte';
	import SSLImage from '$lib/components/SSLImage.svelte';
	import { getContextualImageUrl, ImageContext } from '$lib/utils/imageUtils';
	import type { Artist, Album, Song, Playlist } from '$lib/types/music';

	let recentArtists: Artist[] = [];
	let recentAlbums: Album[] = [];
	let recentSongs: Song[] = [];
	let recentPlaylists: Playlist[] = [];
	let isLoading = true;
	let error = '';

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			isLoading = true;
			error = '';
			
			const [albumsData, songsData, artistsData, playlistsData] = await Promise.all([
				api.getRecentAlbums(10),
				api.getRecentSongs(10),
				api.getRecentArtists(10),
				api.getPlaylists(1, 8)
			]);

			recentAlbums = albumsData;
			recentSongs = songsData;
			recentArtists = artistsData;
			recentPlaylists = playlistsData.data;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
			console.error('Dashboard error:', err);
		} finally {
			isLoading = false;
		}
	}

	function formatNumber(num?: number): string {
		if (!num) return '0';
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	}
</script>

<svelte:head>
	<title>Dashboard - MeloAmp</title>
</svelte:head>

<div class="space-y-8">
	<!-- Stats Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<div>
				<p class="text-gray-600 dark:text-gray-300">Put some statistics here</p>
			</div>
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
				<p class="text-gray-600 dark:text-gray-300">{$_('dashboard.loading')}</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
			<p class="text-red-700 dark:text-red-300">{error}</p>
			<button 
				on:click={loadDashboardData}
				class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
			>
				Try again
			</button>
		</div>
	{:else}
		<!-- Recent Artists -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold flex items-center space-x-2">
					<Users size={24} class="text-primary-500" />
					<span class="text-gray-900 dark:text-white">{$_('dashboard.recentArtists')}</span>
				</h2>
				<a href="/artists" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
					{$_('dashboard.viewAll')}
				</a>
			</div>
			
			{#if recentArtists.length > 0}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{#each recentArtists as artist}
						<div class="music-card group text-center">
							<div class="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 relative">
								{#if artist.thumbnailUrl || artist.imageUrl}
									<SSLImage 
										src={getContextualImageUrl(artist, ImageContext.RECENT_ITEMS)} 
										alt={artist.name}
										className="w-full h-full object-cover"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<Users size={32} class="text-gray-500" />
									</div>
								{/if}
								<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Play size={20} class="text-white" />
								</button>
								{#if artist.userStarred}
									<div class="absolute top-2 right-2">
										<Star size={16} class="text-yellow-400 fill-current" />
									</div>
								{/if}
							</div>
							<div class="flex items-center justify-center space-x-1 mb-1">
								<h3 class="font-medium text-sm truncate" title={artist.name}>{artist.name}</h3>
							</div>
							{#if artist.albumCount > 0}
								<p class="text-xs text-gray-600 dark:text-gray-300">{artist.albumCount} albums</p>
							{/if}
							{#if artist.songCount > 0}
								<p class="text-xs text-gray-500 dark:text-gray-400">{artist.songCount} songs</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-600 dark:text-gray-300 text-center py-8">{$_('dashboard.noData')}</p>
			{/if}
		</section>
			
		<!-- Recent Albums -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold flex items-center space-x-2">
					<Disc3 size={24} class="text-primary-500" />
					<span class="text-gray-900 dark:text-white">{$_('dashboard.recentAlbums')}</span>
				</h2>
				<a href="/albums" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
					{$_('dashboard.viewAll')}
				</a>
			</div>
			
			{#if recentAlbums.length > 0}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{#each recentAlbums as album}
						<div class="music-card group">
							<div class="music-card-image relative mb-3">
								<SSLImage 
									src={getContextualImageUrl(album, ImageContext.RECENT_ITEMS)} 
									alt={album.name}
									className="w-full h-full object-cover"
								/>
								<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Play size={24} class="text-white" />
								</button>
								{#if album.userStarred}
									<div class="absolute top-2 right-2">
										<Star size={16} class="text-yellow-400 fill-current" />
									</div>
								{/if}
							</div>
							<h3 class="font-medium text-sm truncate" title={album.name}>{album.name}</h3>
							<p class="text-xs text-gray-600 dark:text-gray-300 truncate" title={album.artist}>{album.artist}</p>
							{#if album.releaseYear}
								<p class="text-xs text-gray-500 dark:text-gray-400">{album.releaseYear}</p>
							{/if}
							<p class="text-xs text-gray-500 dark:text-gray-400">{album.songCount} songs</p>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-600 dark:text-gray-300 text-center py-8">{$_('dashboard.noData')}</p>
			{/if}
		</section>

		<!-- Recent Songs -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold flex items-center space-x-2">
					<Music size={24} class="text-primary-500" />
					<span class="text-gray-900 dark:text-white">{$_('dashboard.recentSongs')}</span>
				</h2>
				<a href="/songs" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
					{$_('dashboard.viewAll')}
				</a>
			</div>
			
			{#if recentSongs.length > 0}
				<div class="space-y-2">
					{#each recentSongs as song, index}
						<div class="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
							<div class="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden">
								{#if song.thumbnailUrl || song.imageUrl}
									<SSLImage src={getContextualImageUrl(song, ImageContext.LIST_ITEM)} alt={song.title} className="w-full h-full object-cover" />
								{:else}
									<Music size={20} class="text-gray-500" />
								{/if}
								<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Play size={16} class="text-white" />
								</button>
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center space-x-2">
									<h3 class="font-medium truncate">{song.title}</h3>
									{#if song.userStarred}
										<Star size={14} class="text-yellow-400 fill-current" />
									{/if}
								</div>
								<p class="text-sm text-gray-600 dark:text-gray-300 truncate">{song.artist.name} • {song.album.name}</p>
								{#if song.playCount > 0}
									<p class="text-xs text-gray-500 dark:text-gray-400">{formatNumber(song.playCount)} plays</p>
								{/if}
							</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								{song.durationFormatted}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-600 dark:text-gray-300 text-center py-8">{$_('dashboard.noData')}</p>
			{/if}
		</section>

		<!-- Your Playlists -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold flex items-center space-x-2">
					<ListMusic size={24} class="text-primary-500" />
					<span class="text-gray-900 dark:text-white">{$_('dashboard.yourPlaylists')}</span>
				</h2>
				<a href="/playlists" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
					{$_('dashboard.viewAll')}
				</a>
			</div>
			
			{#if recentPlaylists.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{#each recentPlaylists as playlist}
						<div class="music-card group">
							<div class="music-card-image relative mb-3">
								{#if playlist.thumbnailUrl || playlist.imageUrl}
									<SSLImage 
										src={getContextualImageUrl(playlist, ImageContext.GRID_THUMBNAIL)} 
										alt={playlist.name}
										className="w-full h-full object-cover"
									/>
								{:else}
									<div class="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
										<ListMusic size={32} class="text-white" />
									</div>
								{/if}
								<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Play size={24} class="text-white" />
								</button>
							</div>
							<h3 class="font-medium text-sm truncate" title={playlist.name}>{playlist.name}</h3>
							<p class="text-xs text-gray-600 dark:text-gray-300">{playlist.songCount} songs</p>
							{#if playlist.description}
								<p class="text-xs text-gray-500 dark:text-gray-400 truncate" title={playlist.description}>
									{playlist.description}
								</p>
							{/if}
							<p class="text-xs text-gray-500 dark:text-gray-400">{playlist.durationFormatted}</p>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-600 dark:text-gray-300 text-center py-8">{$_('dashboard.noData')}</p>
			{/if}
		</section>
	{/if}
</div>
