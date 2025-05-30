<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api/client';
	import { _ } from '$lib/i18n';
	import { Disc3, Play, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { Album } from '$lib/types/music';

	let albums: Album[] = [];
	let isLoading = true;
	let error = '';
	let currentPage = 1;
	let totalPages = 1;
	let total = 0;
	const pageSize = 24;

	onMount(() => {
		loadAlbums();
	});

	async function loadAlbums() {
		try {
			isLoading = true;
			error = '';

			const response = await apiClient.getPaginated<Album>('/albums', currentPage, pageSize);
			albums = response.data;
			totalPages = response.pagination.totalPages;
			total = response.pagination.total;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load albums';
			console.error('Albums error:', err);
		} finally {
			isLoading = false;
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			currentPage = page;
			loadAlbums();
		}
	}

	function nextPage() {
		goToPage(currentPage + 1);
	}

	function prevPage() {
		goToPage(currentPage - 1);
	}

	function getImageUrl(image?: string): string {
		return image || '/placeholder-music.png';
	}
</script>

<svelte:head>
	<title>Albums - MeloAmp</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-3">
			<Disc3 size={32} class="text-primary-500" />
			<div>
				<h1 class="text-3xl font-bold">{$_('music.albums')}</h1>
				{#if total > 0}
					<p class="text-surface-600-300-token">{total} albums in your library</p>
				{/if}
			</div>
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
				<p class="text-surface-600-300-token">{$_('common.loading')}</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-error-100 dark:bg-error-900 border border-error-300 dark:border-error-700 rounded-lg p-4">
			<p class="text-error-700 dark:text-error-300">{error}</p>
			<button 
				on:click={loadAlbums}
				class="mt-2 text-sm text-error-600 dark:text-error-400 hover:underline"
			>
				{$_('common.retry')}
			</button>
		</div>
	{:else if albums.length === 0}
		<div class="text-center py-12">
			<Disc3 size={64} class="mx-auto text-surface-400-500-token mb-4" />
			<h2 class="text-xl font-semibold mb-2">{$_('music.noAlbums')}</h2>
			<p class="text-surface-600-300-token">No albums found in your library</p>
		</div>
	{:else}
		<!-- Albums Grid -->
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
			{#each albums as album}
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
					<div class="flex items-center justify-between text-xs text-surface-500-400-token mt-1">
						{#if album.year}
							<span>{album.year}</span>
						{/if}
						{#if album.songCount}
							<span>{album.songCount} {album.songCount === 1 ? 'song' : 'songs'}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-center space-x-4 pt-8">
				<button
					on:click={prevPage}
					disabled={currentPage === 1}
					class="flex items-center space-x-2 px-4 py-2 bg-surface-100-800-token border border-surface-300-600-token rounded-lg hover:bg-surface-200-700-token disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronLeft size={16} />
					<span>Previous</span>
				</button>

				<div class="flex items-center space-x-2">
					{#if currentPage > 2}
						<button
							on:click={() => goToPage(1)}
							class="px-3 py-2 rounded-lg hover:bg-surface-200-700-token transition-colors"
						>
							1
						</button>
						{#if currentPage > 3}
							<span class="text-surface-500">...</span>
						{/if}
					{/if}

					{#if currentPage > 1}
						<button
							on:click={() => goToPage(currentPage - 1)}
							class="px-3 py-2 rounded-lg hover:bg-surface-200-700-token transition-colors"
						>
							{currentPage - 1}
						</button>
					{/if}

					<button
						class="px-3 py-2 bg-primary-500 text-white rounded-lg"
					>
						{currentPage}
					</button>

					{#if currentPage < totalPages}
						<button
							on:click={() => goToPage(currentPage + 1)}
							class="px-3 py-2 rounded-lg hover:bg-surface-200-700-token transition-colors"
						>
							{currentPage + 1}
						</button>
					{/if}

					{#if currentPage < totalPages - 1}
						{#if currentPage < totalPages - 2}
							<span class="text-surface-500">...</span>
						{/if}
						<button
							on:click={() => goToPage(totalPages)}
							class="px-3 py-2 rounded-lg hover:bg-surface-200-700-token transition-colors"
						>
							{totalPages}
						</button>
					{/if}
				</div>

				<button
					on:click={nextPage}
					disabled={currentPage === totalPages}
					class="flex items-center space-x-2 px-4 py-2 bg-surface-100-800-token border border-surface-300-600-token rounded-lg hover:bg-surface-200-700-token disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					<span>Next</span>
					<ChevronRight size={16} />
				</button>
			</div>

			<div class="text-center text-sm text-surface-600-300-token">
				Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} albums
			</div>
		{/if}
	{/if}
</div> 