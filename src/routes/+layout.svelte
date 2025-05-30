<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { initI18n, _ } from '$lib/i18n';
	import { Sun, Moon, LogOut } from 'lucide-svelte';
	import SSLImage from '$lib/components/SSLImage.svelte';
	import '../app.css';

	let i18nReady = false;

	onMount(async () => {
		// Initialize i18n first
		await initI18n();
		i18nReady = true;

		// Initialize auth
		auth.init();

		// Redirect to login if not authenticated and not already on login page
		auth.subscribe(($auth) => {
			if (!$auth.isAuthenticated && $page.route.id !== '/login') {
				goto('/login');
			}
		});
	});
</script>

<svelte:head>
	<title>MeloAmp</title>
	<meta name="description" content="Your personal music streaming application" />
</svelte:head>

{#if i18nReady}
	{#if $auth.isAuthenticated}
		<!-- Main App Layout -->
		<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
			<!-- Navigation -->
			<nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div class="flex justify-between h-16">
						<div class="flex items-center space-x-8">
							<!-- Logo -->
							<a href="/" class="flex items-center space-x-2">
								<SSLImage src="/logo.png" alt="MeloAmp" className="h-8 w-8" />
								<span class="text-xl font-bold text-gray-900 dark:text-white">MeloAmp</span>
							</a>

							<!-- Navigation Links -->
							<div class="hidden md:flex space-x-6">
								<a 
									href="/" 
									class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
									class:text-blue-600={$page.route.id === '/'}
									class:dark:text-blue-400={$page.route.id === '/'}
								>
									{$_('nav.dashboard')}
								</a>
								<a 
									href="/search" 
									class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
									class:text-blue-600={$page.route.id === '/search'}
									class:dark:text-blue-400={$page.route.id === '/search'}
								>
									{$_('nav.search')}
								</a>
								<a 
									href="/artists" 
									class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
									class:text-blue-600={$page.route.id === '/artists'}
									class:dark:text-blue-400={$page.route.id === '/artists'}
								>
									{$_('nav.artists')}
								</a>
								<a 
									href="/albums" 
									class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
									class:text-blue-600={$page.route.id === '/albums'}
									class:dark:text-blue-400={$page.route.id === '/albums'}
								>
									{$_('nav.albums')}
								</a>
							</div>
						</div>

						<!-- User Menu -->
						<div class="flex items-center space-x-4">
							<span class="text-sm text-gray-600 dark:text-gray-300">
								{$_('nav.welcome')}, {$auth.user?.username}
							</span>
							<button
								on:click={auth.logout}
								class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
							>
								{$_('nav.logout')}
							</button>
						</div>
					</div>
				</div>
			</nav>

			<!-- Main Content -->
			<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				<slot />
			</main>
		</div>
	{:else}
		<!-- Login Page -->
		<slot />
	{/if}
{:else}
	<!-- Loading Screen -->
	<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p class="text-gray-600 dark:text-gray-300">Loading...</p>
		</div>
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