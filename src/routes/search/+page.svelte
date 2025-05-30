<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { apiClient } from '$lib/api/client';
	import { _ } from '$lib/i18n';
	import { Search, Users, Disc3, Music, ListMusic, Play } from 'lucide-svelte';
	import type { SearchResults } from '$lib/types/music';

	let searchQuery = '';
	let searchResults: SearchResults | null = null;
	let isLoading = false;
	let error = '';

	onMount(() => {
		// Get search query from URL
		const urlQuery = $page.url.searchParams.get('q');
		if (urlQuery) {
			searchQuery = urlQuery;
			performSearch();
		}
	});

	async function performSearch() {
		if (!searchQuery.trim()) {
			searchResults = null;
			return;
		}

		isLoading = true;
		error = '';

		try {
			const response = await apiClient.get<SearchResults>(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
			searchResults = response.data;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Search failed';
			console.error('Search error:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleSearchSubmit() {
		performSearch();
		// Update URL without navigation
		const url = new URL(window.location.href);
		url.searchParams.set('q', searchQuery);
		window.history.replaceState({}, '', url);
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
	<title>Search - MeloAmp</title>
</svelte:head>

<div class="space-y-6">
	<!-- Search Header -->
	<div class="flex items-center space-x-3">
		<Search size={32} class="text-primary-500" />
		<h1 class="text-3xl font-bold">{$_('search.results')}</h1>
	</div>

	<!-- Search Input -->
	<div class="max-w-2xl">
		<form on:submit|preventDefault={handleSearchSubmit} class="relative">
			<Search class="absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-500" size={20} />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder={$_('search.placeholder')}
				class="w-full pl-12 pr-4 py-4 text-lg bg-surface-100-800-token border border-surface-300-600-token rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
			/>
		</form>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
				<p class="text-surface-600-300-token">Searching...</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-error-100 dark:bg-error-900 border border-error-300 dark:border-error-700 rounded-lg p-4">
			<p class="text-error-700 dark:text-error-300">{error}</p>
			<button 
				on:click={performSearch}
				class="mt-2 text-sm text-error-600 dark:text-error-400 hover:underline"
			>
				Try again
			</button>
		</div>
	{:else if searchResults}
		{#if searchResults.total === 0}
			<div class="text-center py-12">
				<Search size={64} class="mx-auto text-surface-400-500-token mb-4" />
				<h2 class="text-xl font-semibold mb-2">{$_('search.noResults')}</h2>
				<p class="text-surface-600-300-token">Try searching with different keywords</p>
			</div>
		{:else}
			<div class="space-y-8">
				<!-- Artists -->
				{#if searchResults.artists.length > 0}
					<section>
						<div class="flex items-center space-x-3 mb-4">
							<Users size={24} class="text-primary-500" />
							<h2 class="text-xl font-semibold">{$_('search.artists')} ({searchResults.artists.length})</h2>
						</div>
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
							{#each searchResults.artists as artist}
								<div class="music-card group text-center">
									<div class="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-surface-300-600-token relative">
										{#if artist.image}
											<img 
												src={artist.image} 
												alt={artist.name}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<Users size={24} class="text-surface-500" />
											</div>
										{/if}
										<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<Play size={16} class="text-white" />
										</button>
									</div>
									<h3 class="font-medium text-sm truncate" title={artist.name}>{artist.name}</h3>
									{#if artist.albumCount}
										<p class="text-xs text-surface-600-300-token">{artist.albumCount} albums</p>
									{/if}
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Albums -->
				{#if searchResults.albums.length > 0}
					<section>
						<div class="flex items-center space-x-3 mb-4">
							<Disc3 size={24} class="text-primary-500" />
							<h2 class="text-xl font-semibold">{$_('search.albums')} ({searchResults.albums.length})</h2>
						</div>
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
							{#each searchResults.albums as album}
								<div class="music-card group">
									<div class="music-card-image relative mb-3">
										<img 
											src={getImageUrl(album.image)} 
											alt={album.title}
											class="w-full h-full object-cover"
										/>
										<button class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<Play size={20} class="text-white" />
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
					</section>
				{/if}

				<!-- Songs -->
				{#if searchResults.songs.length > 0}
					<section>
						<div class="flex items-center space-x-3 mb-4">
							<Music size={24} class="text-primary-500" />
							<h2 class="text-xl font-semibold">{$_('search.songs')} ({searchResults.songs.length})</h2>
						</div>
						<div class="space-y-2">
							{#each searchResults.songs as song}
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
					</section>
				{/if}

				<!-- Playlists -->
				{#if searchResults.playlists.length > 0}
					<section>
						<div class="flex items-center space-x-3 mb-4">
							<ListMusic size={24} class="text-primary-500" />
							<h2 class="text-xl font-semibold">{$_('search.playlists')} ({searchResults.playlists.length})</h2>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{#each searchResults.playlists as playlist}
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
											<Play size={20} class="text-white" />
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
					</section>
				{/if}
			</div>
		{/if}
	{:else if searchQuery}
		<div class="text-center py-12">
			<Search size={64} class="mx-auto text-surface-400-500-token mb-4" />
			<h2 class="text-xl font-semibold mb-2">Start searching</h2>
			<p class="text-surface-600-300-token">Enter your search query and press Enter</p>
		</div>
	{:else}
		<div class="text-center py-12">
			<Search size={64} class="mx-auto text-surface-400-500-token mb-4" />
			<h2 class="text-xl font-semibold mb-2">Search your music</h2>
			<p class="text-surface-600-300-token">Find artists, albums, songs, and playlists</p>
		</div>
	{/if}
</div> 