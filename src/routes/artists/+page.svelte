<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api/client';
	import { _ } from '$lib/i18n';
	import { Users, Play, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { Artist } from '$lib/types/music';

	let artists: Artist[] = [];
	let isLoading = true;
	let error = '';
	let currentPage = 1;
	let totalPages = 1;
	let total = 0;
	const pageSize = 24;

	onMount(() => {
		loadArtists();
	});

	async function loadArtists() {
		try {
			isLoading = true;
			error = '';

			const response = await apiClient.getPaginated<Artist>('/artists', currentPage, pageSize);
			artists = response.data;
			totalPages = response.pagination.totalPages;
			total = response.pagination.total;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load artists';
			console.error('Artists error:', err);
		} finally {
			isLoading = false;
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			currentPage = page;
			loadArtists();
		}
	}

	function nextPage() {
		goToPage(currentPage + 1);
	}

	function prevPage() {
		goToPage(currentPage - 1);
	}
</script>

<svelte:head>
	<title>Artists - MeloAmp</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-3">
			<Users size={32} class="text-primary-500" />
			<div>
				<h1 class="text-3xl font-bold">{$_('music.artists')}</h1>
				{#if total > 0}
					<p class="text-surface-600-300-token">{total} artists in your library</p>
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
				on:click={loadArtists}
				class="mt-2 text-sm text-error-600 dark:text-error-400 hover:underline"
			>
				{$_('common.retry')}
			</button>
		</div>
	{:else if artists.length === 0}
		<div class="text-center py-12">
			<Users size={64} class="mx-auto text-surface-400-500-token mb-4" />
			<h2 class="text-xl font-semibold mb-2">{$_('music.noArtists')}</h2>
			<p class="text-surface-600-300-token">No artists found in your library</p>
		</div>
	{:else}
		<!-- Artists Grid -->
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
			{#each artists as artist}
				<div class="music-card group text-center">
					<div class="w-full aspect-square mx-auto mb-3 rounded-full overflow-hidden bg-surface-300-600-token relative">
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
							<Play size={24} class="text-white" />
						</button>
					</div>
					<h3 class="font-medium text-sm truncate" title={artist.name}>{artist.name}</h3>
					{#if artist.albumCount}
						<p class="text-xs text-surface-600-300-token">
							{artist.albumCount} {artist.albumCount === 1 ? 'album' : 'albums'}
						</p>
					{/if}
					{#if artist.songCount}
						<p class="text-xs text-surface-500-400-token">
							{artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'}
						</p>
					{/if}
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
				Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} artists
			</div>
		{/if}
	{/if}
</div> 