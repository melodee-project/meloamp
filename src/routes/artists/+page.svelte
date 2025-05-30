<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { _ } from '$lib/i18n';
	import { Play, Users, Star } from 'lucide-svelte';
	import SSLImage from '$lib/components/SSLImage.svelte';
	import type { Artist } from '$lib/types/music';

	let artists: Artist[] = [];
	let isLoading = true;
	let error = '';
	let currentPage = 1;
	let totalPages = 1;
	let hasNextPage = false;
	let hasPreviousPage = false;

	onMount(async () => {
		await loadArtists();
	});

	async function loadArtists(page: number = 1) {
		try {
			isLoading = true;
			error = '';
			
			const response = await api.getArtists(page, 20);
			artists = response.data;
			currentPage = response.meta.currentPage;
			totalPages = response.meta.totalPages;
			hasNextPage = response.meta.hasNextPage;
			hasPreviousPage = response.meta.hasPreviousPage;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load artists';
			console.error('Artists error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function nextPage() {
		if (hasNextPage) {
			await loadArtists(currentPage + 1);
		}
	}

	async function previousPage() {
		if (hasPreviousPage) {
			await loadArtists(currentPage - 1);
		}
	}

	function getImageUrl(thumbnailUrl?: string, imageUrl?: string): string {
		return thumbnailUrl || imageUrl || '/placeholder-music.png';
	}
</script>

<svelte:head>
	<title>Artists - MeloAmp</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-3">
			<Users size={32} class="text-blue-500" />
			<h1 class="text-3xl font-bold">{$_('artists.title')}</h1>
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p class="text-gray-600 dark:text-gray-300">{$_('common.loading')}</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
			<p class="text-red-700 dark:text-red-300">{error}</p>
			<button 
				on:click={() => loadArtists(currentPage)}
				class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
			>
				Try again
			</button>
		</div>
	{:else}
		<!-- Artists Grid -->
		{#if artists.length > 0}
			<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
				{#each artists as artist}
					<div class="music-card group text-center">
						<div class="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 relative">
							{#if artist.thumbnailUrl || artist.imageUrl}
								<SSLImage 
									src={getImageUrl(artist.thumbnailUrl, artist.imageUrl)} 
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
						<h3 class="font-medium text-sm truncate" title={artist.name}>{artist.name}</h3>
						{#if artist.albumCount > 0}
							<p class="text-xs text-gray-600 dark:text-gray-300">{artist.albumCount} albums</p>
						{/if}
						{#if artist.songCount > 0}
							<p class="text-xs text-gray-500 dark:text-gray-400">{artist.songCount} songs</p>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-center space-x-4 mt-8">
					<button
						on:click={previousPage}
						disabled={!hasPreviousPage}
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					
					<span class="text-sm text-gray-600 dark:text-gray-400">
						Page {currentPage} of {totalPages}
					</span>
					
					<button
						on:click={nextPage}
						disabled={!hasNextPage}
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
					</button>
				</div>
			{/if}
		{:else}
			<div class="text-center py-12">
				<Users size={64} class="text-gray-400 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No artists found</h3>
				<p class="text-gray-600 dark:text-gray-400">There are no artists in your library yet.</p>
			</div>
		{/if}
	{/if}
</div> 