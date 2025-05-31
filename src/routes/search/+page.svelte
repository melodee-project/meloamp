<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/api';
	import { _ } from '$lib/i18n';
	import { Search, Music, Users, Disc3, ListMusic, Star } from 'lucide-svelte';
	import SSLImage from '$lib/components/SSLImage.svelte';
	import { getContextualImageUrl, ImageContext } from '$lib/utils/imageUtils';
	import { debounce } from '$lib/utils/debounce';
	import type { Artist as Artists, Album as Albums, Song as Songs, Playlist as Playlists } from '$lib/types/music';
	import type { SearchType } from '$lib/stores/theme';
	import type { SearchResults, SearchResultData, PaginationMeta } from '$lib/api';

	let query = '';
	let selectedTypes: SearchType[] = ['artists', 'albums', 'songs', 'playlists'];
	let currentPage = 1;
	let pageSize = 20;
	let searchResults: SearchResultData = {
		artists: [],
		totalArtists: 0,
		albums: [],
		totalAlbums: 0,
		songs: [],
		totalSongs: 0,
		playlists: [],
		totalPlaylists: 0,
		totalCount: 0
	};
	let paginationMeta: PaginationMeta = {
		totalCount: 0,
		pageSize: 20,
		currentPage: 1,
		totalPages: 1,
		hasPreviousPage: false,
		hasNextPage: false
	};
	let isLoading = false;
	let error = '';
	let hasSearched = false;

	const searchTypes = [
		{ value: 'artists', label: 'Artists', icon: Users },
		{ value: 'albums', label: 'Albums', icon: Disc3 },
		{ value: 'songs', label: 'Songs', icon: Music },
		{ value: 'playlists', label: 'Playlists', icon: ListMusic }
	] as const;

	onMount(() => {
		const urlQuery = $page.url.searchParams.get('q');
		const urlTypes = $page.url.searchParams.get('types');
		const urlPage = $page.url.searchParams.get('page');
		
		if (urlQuery) {
			query = urlQuery;
		}
		
		if (urlTypes) {
			const types = urlTypes.split(',').filter(t => 
				['artists', 'albums', 'songs', 'playlists'].includes(t)
			) as SearchType[];
			if (types.length > 0) {
				selectedTypes = types;
			}
		}

		if (urlPage) {
			const pageNum = parseInt(urlPage, 10);
			if (pageNum > 0) {
				currentPage = pageNum;
			}
		}
		
		if (urlQuery) {
			performSearch(currentPage);
		}
	});

	async function performSearch(page: number = 1) {
		if (!query.trim()) return;

		try {
			isLoading = true;
			error = '';
			hasSearched = true;
			currentPage = page;

			// Make a single API call with all selected types and pagination
			console.log('🔍 Performing search with types:', selectedTypes, 'page:', page);
			const response = await api.search(query.trim(), selectedTypes, page, pageSize);
			searchResults = response.data;
			paginationMeta = response.meta;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Search failed';
			console.error('Search error:', err);
		} finally {
			isLoading = false;
		}
	}

	// Debounced search function - always search from page 1
	const debouncedSearch = debounce(() => performSearch(1), 2000);

	function handleSubmit() {
		performSearch(1);
	}

	function handleSearchInput() {
		if (query.trim()) {
			debouncedSearch();
		}
	}

	function handleTypeToggle(type: SearchType) {
		if (selectedTypes.includes(type)) {
			selectedTypes = selectedTypes.filter(t => t !== type);
		} else {
			selectedTypes = [...selectedTypes, type];
		}
		
		// Ensure at least one type is always selected
		if (selectedTypes.length === 0) {
			selectedTypes = ['artists'];
		}

		if (query.trim()) {
			performSearch(1); // Reset to page 1 when changing filters
		}
	}

	function getTotalResults(): number {
		return Math.max(searchResults.totalCount || 0);
	}

	async function nextPage() {
		if (paginationMeta.hasNextPage) {
			await performSearch(currentPage + 1);
		}
	}

	async function previousPage() {
		if (paginationMeta.hasPreviousPage) {
			await performSearch(currentPage - 1);
		}
	}

	async function goToPage(page: number) {
		if (page >= 1 && page <= paginationMeta.totalPages) {
			await performSearch(page);
		}
	}
</script>

<svelte:head>
	<title>Search - MeloAmp</title>
</svelte:head>

<div class="space-y-6">
	<!-- Search Header -->
	<div class="flex items-center space-x-4">
		<Search size={32} class="text-primary-500" />
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">{$_('search.title')}</h1>
	</div>


	<!-- Search Type Tabs -->
	<div class="flex flex-wrap gap-2">
		{#each searchTypes as type}
			<button
				on:click={() => handleTypeToggle(type.value)}
				class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm {selectedTypes.includes(type.value) 
					? 'bg-primary-600 text-white' 
					: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
			>
				<svelte:component this={type.icon} size={16} />
				<span>{type.label}</span>
			</button>
		{/each}
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
				on:input={handleSearchInput}
				placeholder={$_('search.placeholder')}
				class="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
			/>
		</div>
		<button
			type="submit"
			disabled={isLoading || !query.trim()}
			class="mt-3 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed"
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
		{#if getTotalResults() > 0 || searchResults.songs.length > 0 || searchResults.artists.length > 0 || searchResults.albums.length > 0 || searchResults.playlists.length > 0}
			<div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
				Found {getTotalResults()} total results for "{query}" 
				{#if paginationMeta.totalPages > 1}
					(showing page {paginationMeta.currentPage} of {paginationMeta.totalPages})
				{/if}
			</div>

			<!-- Artists Results -->
			{#if searchResults.artists.length > 0}
				<section>
					<h2 class="text-xl font-semibold flex items-center space-x-2 mb-4">
						<Users size={24} class="text-primary-500" />
						<span class="text-gray-900 dark:text-white">Artists ({searchResults.totalArtists})</span>
					</h2>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{#each searchResults.artists as artist}
							<div class="music-card group text-center">
								<div class="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 relative">
									{#if artist.thumbnailUrl || artist.imageUrl}
										<SSLImage
											src={getContextualImageUrl(artist, ImageContext.GRID_THUMBNAIL)} 
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
						<Disc3 size={24} class="text-primary-500" />
						<span class="text-gray-900 dark:text-white">Albums ({searchResults.totalAlbums})</span>
					</h2>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{#each searchResults.albums as album}
							<div class="music-card group">
								<div class="music-card-image relative mb-3">
									<SSLImage
										src={getContextualImageUrl(album, ImageContext.GRID_THUMBNAIL)} 
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
						<Music size={24} class="text-primary-500" />
						<span class="text-gray-900 dark:text-white">Songs ({searchResults.totalSongs})</span>
					</h2>
					<div class="space-y-2">
						{#each searchResults.songs as song}
							<div class="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
								<div class="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden">
									{#if song.thumbnailUrl || song.imageUrl}
										<SSLImage src={getContextualImageUrl(song, ImageContext.LIST_ITEM)} alt={song.title} className="w-full h-full object-cover" />
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
						<ListMusic size={24} class="text-primary-500" />
						<span class="text-gray-900 dark:text-white">Playlists ({searchResults.totalPlaylists})</span>
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{#each searchResults.playlists as playlist}
							<div class="music-card group">
								<div class="music-card-image relative mb-3">
									{#if playlist.thumbnailUrl || playlist.imageUrl}
										<SSLImage
											src={getContextualImageUrl(playlist, ImageContext.GRID_THUMBNAIL)} 
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

			<!-- Pagination Controls -->
			{#if paginationMeta.totalPages > 1}
				<div class="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
					<button
						on:click={previousPage}
						disabled={!paginationMeta.hasPreviousPage || isLoading}
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Previous
					</button>
					
					<!-- Page Numbers -->
					<div class="flex space-x-1">
						{#each Array.from({ length: Math.min(5, paginationMeta.totalPages) }, (_, i) => {
							const startPage = Math.max(1, paginationMeta.currentPage - 2);
							const endPage = Math.min(paginationMeta.totalPages, startPage + 4);
							const adjustedStartPage = Math.max(1, endPage - 4);
							return adjustedStartPage + i;
						}).filter(page => page <= paginationMeta.totalPages) as page}
							<button
								on:click={() => goToPage(page)}
								disabled={isLoading}
								class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {page === paginationMeta.currentPage 
									? 'bg-primary-600 text-white' 
									: 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{page}
							</button>
						{/each}
					</div>
					
					<button
						on:click={nextPage}
						disabled={!paginationMeta.hasNextPage || isLoading}
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Next
					</button>
				</div>

				<!-- Results Info -->
				<div class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
					Showing {Math.min(paginationMeta.pageSize, paginationMeta.totalCount - (paginationMeta.currentPage - 1) * paginationMeta.pageSize)} 
					of {paginationMeta.totalCount} results
				</div>
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