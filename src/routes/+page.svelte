<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { apiClient } from '$lib/api/client';
	import { _ } from '$lib/i18n';
	import { Play, Music, Users, Disc3, ListMusic } from 'lucide-svelte';
	import type { Album, Song, Artist, Playlist } from '$lib/types/music';

	let recentAlbums: Album[] = [];
	let recentSongs: Song[] = [];
	let recentArtists: Artist[] = [];
	let playlists: Playlist[] = [];
	let isLoading = true;
	let error = '';

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			isLoading = true;
			error = '';

			const [albumsRes, songsRes, artistsRes, playlistsRes] = await Promise.all([
				apiClient.get<Album[]>('/albums/recent?limit=10'),
				apiClient.get<Song[]>('/songs/recent?limit=10'),
				apiClient.get<Artist[]>('/artists/recent?limit=10'),
				apiClient.getPaginated<Playlist>('/playlists', 1, 8)
			]);

			recentAlbums = albumsRes.data;
			recentSongs = songsRes.data;
			recentArtists = artistsRes.data;
			playlists = playlistsRes.data;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
			console.error('Dashboard error:', err);
		} finally {
			isLoading = false;
		}
	}

	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function getImageUrl(image?: string): string {
		return image || '/placeholder-music.png';
	}
</script>

<svelte:head>
	<title>Dashboard - MeloAmp</title>
</svelte:head>

<div class="space-y-8">
	<!-- Welcome Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">{$_('dashboard.welcome')}, {$auth.user?.username}!</h1>
			<p class="text-surface-600-300-token mt-1">Discover and enjoy your music library</p>
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
				<p class="text-surface-600-300-token">{$_('dashboard.loading')}</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-error-100 dark:bg-error-900 border border-error-300 dark:border-error-700 rounded-lg p-4">
			<p class="text-error-700 dark:text-error-300">{error}</p>
			<button 
				on:click={loadDashboardData}
				class="mt-2 text-sm text-error-600 dark:text-error-400 hover:underline"
			>
				Try again
			</button>
		</div>
	{:else}
		<!-- Recent Albums -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold flex items-center space-x-2">
					<Disc3 size={24} class="text-primary-500" />
					<span>{$_('dashboard.recentAlbums')}</span>
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
								<img 
									src={getImageUrl(album.image)} 
									alt={album.title}
									class="w-full h-full object-cover"
								/>
								<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Play size={24} class="text-white" />
								</button>
							</div>
							<h3 class="font-medium text-sm truncate" title={album.title}>{album.title}</h3>
							<p class="text-xs text-surface-600-300-token truncate" title={album.artist}>{album.artist}</p>
							{#if album.year}
								<p class="text-xs text-surface-500-400-token">{album.year}</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-surface-600-300-token text-center py-8">{$_('dashboard.noData')}</p>
			{/if}
		</section>

		<!-- Recent Songs -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold flex items-center space-x-2">
					<Music size={24} class="text-primary-500" />
					<span>{$_('dashboard.recentSongs')}</span>
				</h2>
				<a href="/songs" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
					{$_('dashboard.viewAll')}
				</a>
			</div>
			
			{#if recentSongs.length > 0}
				<div class="space-y-2">
					{#each recentSongs as song, index}
						<div class="flex items-center space-x-4 p-3 rounded-lg hover:bg-surface-200-700-token transition-colors group">
							<div class="w-12 h-12 bg-surface-300-600-token rounded-lg flex items-center justify-center relative overflow-hidden">
								{#if song.image}
									<img src={song.image} alt={song.title} class="w-full h-full object-cover" />
								{:else}
									<Music size={20} class="text-surface-500" />
								{/if}
								<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Play size={16} class="text-white" />
								</button>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-medium truncate">{song.title}</h3>
								<p class="text-sm text-surface-600-300-token truncate">{song.artist} • {song.album}</p>
							</div>
							<div class="text-sm text-surface-500-400-token">
								{formatDuration(song.duration)}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-surface-600-300-token text-center py-8">{$_('dashboard.noData')}</p>
			{/if}
		</section>

		<!-- Recent Artists -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold flex items-center space-x-2">
					<Users size={24} class="text-primary-500" />
					<span>{$_('dashboard.recentArtists')}</span>
				</h2>
				<a href="/artists" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
					{$_('dashboard.viewAll')}
				</a>
			</div>
			
			{#if recentArtists.length > 0}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{#each recentArtists as artist}
						<div class="music-card group text-center">
							<div class="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-surface-300-600-token relative">
								{#if artist.image}
									<img 
										src={artist.image} 
										alt={artist.name}
										class="w-full h-full object-cover"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<Users size={32} class="text-surface-500" />
									</div>
								{/if}
								<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Play size={20} class="text-white" />
								</button>
							</div>
							<h3 class="font-medium text-sm truncate" title={artist.name}>{artist.name}</h3>
							{#if artist.albumCount}
								<p class="text-xs text-surface-600-300-token">{artist.albumCount} albums</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-surface-600-300-token text-center py-8">{$_('dashboard.noData')}</p>
			{/if}
		</section>

		<!-- Your Playlists -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold flex items-center space-x-2">
					<ListMusic size={24} class="text-primary-500" />
					<span>{$_('dashboard.yourPlaylists')}</span>
				</h2>
				<a href="/playlists" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
					{$_('dashboard.viewAll')}
				</a>
			</div>
			
			{#if playlists.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{#each playlists as playlist}
						<div class="music-card group">
							<div class="music-card-image relative mb-3">
								{#if playlist.image}
									<img 
										src={playlist.image} 
										alt={playlist.name}
										class="w-full h-full object-cover"
									/>
								{:else}
									<div class="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
										<ListMusic size={32} class="text-white" />
									</div>
								{/if}
								<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Play size={24} class="text-white" />
								</button>
							</div>
							<h3 class="font-medium text-sm truncate" title={playlist.name}>{playlist.name}</h3>
							<p class="text-xs text-surface-600-300-token">{playlist.songCount} songs</p>
							{#if playlist.description}
								<p class="text-xs text-surface-500-400-token truncate" title={playlist.description}>
									{playlist.description}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-surface-600-300-token text-center py-8">{$_('dashboard.noData')}</p>
			{/if}
		</section>
	{/if}
</div>
