<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { themeStore } from '$lib/stores/theme';
	import { initI18n } from '$lib/i18n';
	import '../app.css';

	let i18nReady = false;

	onMount(async () => {
		// Initialize i18n first
		await initI18n();
		i18nReady = true;

		// Initialize stores
		auth.init();
		themeStore.init();

		// Handle authentication routing
		const unsubscribe = auth.subscribe(state => {
			const currentPath = $page.url.pathname;
			
			if (!state.isAuthenticated && currentPath !== '/login') {
				goto('/login');
			} else if (state.isAuthenticated && currentPath === '/login') {
				goto('/');
			}
		});

		return unsubscribe;
	});
</script>

{#if i18nReady}
	<slot />
{:else}
	<div class="flex items-center justify-center h-screen">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
	</div>
{/if}

<style>
	:global(html) {
		height: 100%;
	}
	
	:global(body) {
		height: 100%;
		margin: 0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style> 