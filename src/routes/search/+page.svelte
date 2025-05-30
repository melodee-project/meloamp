<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/api';
	import { _ } from '$lib/i18n';
	import { Search, Music, Users, Disc3, ListMusic, Star } from 'lucide-svelte';
	import SSLImage from '$lib/components/SSLImage.svelte';
	import type { Artist, Album, Song, Playlist } from '$lib/types/music';

	let query = '';
	let searchResults: {
		artists: Artist[];
		albums: Album[];
		songs: Song[];
		playlists: Playlist[];
	} = {
		artists: [],
		albums: [],
		songs: [],
		playlists: []
	};
	let isLoading = false;
	let error = '';
	let hasSearched = false;

	onMount(() => {
		const urlQuery = $page.url.searchParams.get('q');
		if (urlQuery) {
			query = urlQuery;
			performSearch();
		}
	});

	async function performSearch() {
		if (!query.trim()) return;

		try {
			isLoading = true;
			error = '';
			hasSearched = true;

			searchResults = await api.search(query.trim());
		} catch (err) {
			error = err instanceof Error ? err.message : 'Search failed';
			console.error('Search error:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleSubmit() {
		performSearch();
	}

	function getImageUrl(thumbnailUrl?: string, imageUrl?: string): string {
		return thumbnailUrl || imageUrl || '/placeholder-music.png';
	}

	function getTotalResults(): number {
		return searchResults.artists.length + 
			   searchResults.albums.length + 
			   searchResults.songs.length + 
			   searchResults.playlists.length;
	}
</script>

<svelte:head>
	<title>Search - MeloAmp</title>
</svelte:head>

<div class="space-y-6">
	<!-- Search Header -->
	<div class="flex items-center space-x-4">
		<Search size={32} class="text-blue-500" />
		<h1 class="text-3xl font-bold">{$_('search.title')}</h1>
	</div>

	<!-- Search Form -->
	<form on:submit|preventDefault={handleSubmit} class="max-w-2xl">
		<div class="relative">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<Search size={20} class="text-gray-400" />
			</div>
			<input
				type="text"
				bind:value={query}
				placeholder={$_('search.placeholder')}
				class="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
		</div>
		<button
			type="submit"
			disabled={isLoading || !query.trim()}
			class="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
		>
			{#if isLoading}
				<div class="flex items-center space-x-2">
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					<span>Searching...</span>
				</div>
			{:else}
				{$_('search.button')}
			{/if}
		</button>
	</form>

	{#if error}
		<div class="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
			<p class="text-red-700 dark:text-red-300">{error}</p>
			<button 
				on:click={performSearch}
				class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
			>
				Try again
			</button>
		</div>
	{:else if hasSearched && !isLoading}
		{#if getTotalResults() > 0}
			<div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
				Found {getTotalResults()} results for "{query}"
			</div>

			<!-- Artists Results -->
			{#if searchResults.artists.length > 0}
				<section>
					<h2 class="text-xl font-semibold flex items-center space-x-2 mb-4">
						<Users size={24} class="text-blue-500" />
						<span>Artists ({searchResults.artists.length})</span>
					</h2>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{#each searchResults.artists as artist}
							<div class="music-card group text-center">
								<div class="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 relative">
									{#if artist.thumbnailUrl || artist.imageUrl}
										<SSLImage
											src={getImageUrl(artist.thumbnailUrl, artist.imageUrl)} 
											alt={artist.name}
											className="w-full h-full object-cover"
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<Users size={24} class="text-gray-500" />
										</div>
									{/if}
									{#if artist.userStarred}
										<div class="absolute top-1 right-1">
											<Star size={12} class="text-yellow-400 fill-current" />
										</div>
									{/if}
								</div>
								<h3 class="font-medium text-sm truncate" title={artist.name}>{artist.name}</h3>
								{#if artist.albumCount > 0}
									<p class="text-xs text-gray-600 dark:text-gray-300">{artist.albumCount} albums</p>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Albums Results -->
			{#if searchResults.albums.length > 0}
				<section>
					<h2 class="text-xl font-semibold flex items-center space-x-2 mb-4">
						<Disc3 size={24} class="text-blue-500" />
						<span>Albums ({searchResults.albums.length})</span>
					</h2>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{#each searchResults.albums as album}
							<div class="music-card group">
								<div class="music-card-image relative mb-3">
									<SSLImage
										src={getImageUrl(album.thumbnailUrl, album.imageUrl)} 
										alt={album.name}
										className="w-full h-full object-cover"
									/>
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
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Songs Results -->
			{#if searchResults.songs.length > 0}
				<section>
					<h2 class="text-xl font-semibold flex items-center space-x-2 mb-4">
						<Music size={24} class="text-blue-500" />
						<span>Songs ({searchResults.songs.length})</span>
					</h2>
					<div class="space-y-2">
						{#each searchResults.songs as song}
							<div class="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
								<div class="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden">
									{#if song.thumbnailUrl || song.imageUrl}
										<SSLImage src={getImageUrl(song.thumbnailUrl, song.imageUrl)} alt={song.title} className="w-full h-full object-cover" />
									{:else}
										<Music size={20} class="text-gray-500" />
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center space-x-2">
										<h3 class="font-medium truncate">{song.title}</h3>
										{#if song.userStarred}
											<Star size={14} class="text-yellow-400 fill-current" />
										{/if}
									</div>
									<p class="text-sm text-gray-600 dark:text-gray-300 truncate">{song.artist.name} • {song.album.name}</p>
								</div>
								<div class="text-sm text-gray-500 dark:text-gray-400">
									{song.durationFormatted}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Playlists Results -->
			{#if searchResults.playlists.length > 0}
				<section>
					<h2 class="text-xl font-semibold flex items-center space-x-2 mb-4">
						<ListMusic size={24} class="text-blue-500" />
						<span>Playlists ({searchResults.playlists.length})</span>
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{#each searchResults.playlists as playlist}
							<div class="music-card group">
								<div class="music-card-image relative mb-3">
									{#if playlist.thumbnailUrl || playlist.imageUrl}
										<SSLImage
											src={getImageUrl(playlist.thumbnailUrl, playlist.imageUrl)} 
											alt={playlist.name}
											className="w-full h-full object-cover"
										/>
									{:else}
										<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
											<ListMusic size={32} class="text-white" />
										</div>
									{/if}
								</div>
								<h3 class="font-medium text-sm truncate" title={playlist.name}>{playlist.name}</h3>
								<p class="text-xs text-gray-600 dark:text-gray-300">{playlist.songCount} songs</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">by {playlist.owner.username}</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{:else}
			<div class="text-center py-12">
				<Search size={64} class="text-gray-400 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
				<p class="text-gray-600 dark:text-gray-400">Try searching with different keywords</p>
			</div>
		{/if}
	{:else if !hasSearched}
		<div class="text-center py-12">
			<Search size={64} class="text-gray-400 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Search your music library</h3>
			<p class="text-gray-600 dark:text-gray-400">Find artists, albums, songs, and playlists</p>
		</div>
	{/if}
</div> 