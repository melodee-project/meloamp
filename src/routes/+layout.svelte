<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { themeStore } from '$lib/stores/theme';
	import { initI18n, _ } from '$lib/i18n';
	import { Sun, Moon, LogOut, Search, Settings, User, ChevronDown } from 'lucide-svelte';
	import SSLImage from '$lib/components/SSLImage.svelte';
	import { debounce } from '$lib/utils/debounce';
	import '../app.css';

	let i18nReady = false;
	let authInitialized = false;
	let searchQuery = '';
	let showUserMenu = false;

	onMount(async () => {
		try {
			// Initialize i18n first
			console.log('🌍 Initializing i18n...');
			await initI18n();
			i18nReady = true;
			console.log('✅ i18n initialized');

			// Initialize theme store
			console.log('🎨 Initializing theme store...');
			themeStore.init();
			console.log('✅ Theme store initialized');

			// Initialize auth (now async)
			console.log('🔐 Initializing auth...');
			await auth.init();
			authInitialized = true;
			console.log('✅ Auth initialized');

		} catch (error) {
			console.error('❌ Error during initialization:', error);
			// Ensure we show something even if initialization fails
			i18nReady = true;
			authInitialized = true;
		}
	});

	// React to auth state changes
	$: if (authInitialized && i18nReady) {
		console.log('🔄 Auth state changed:', $auth.isAuthenticated);
		if (!$auth.isAuthenticated && $page.route.id !== '/login') {
			console.log('🔄 Redirecting to login...');
			goto('/login');
		}
	}

	function performHeaderSearch() {
		if (searchQuery.trim()) {
			const searchTypes = $themeStore.preferences.defaultSearchTypes;
			const params = new URLSearchParams({ q: searchQuery.trim() });
			
			// If not all types are selected, add the specific types to URL
			const allTypes = ['artists', 'albums', 'songs', 'playlists'];
			if (searchTypes.length < allTypes.length && searchTypes.length > 0) {
				params.append('types', searchTypes.join(','));
			}
			
			goto(`/search?${params.toString()}`);
			searchQuery = '';
		}
	}

	// Debounced search function
	const debouncedHeaderSearch = debounce(performHeaderSearch, 2000);

	function handleSearch(event: Event) {
		event.preventDefault();
		performHeaderSearch();
	}

	// Handle input change for debounced search
	function handleSearchInput() {
		if (searchQuery.trim()) {
			debouncedHeaderSearch();
		}
	}

	function handleLogout() {
		auth.logout();
		showUserMenu = false;
		goto('/login');
	}

	function navigateToSettings() {
		showUserMenu = false;
		goto('/settings');
	}

	// Close menu when clicking outside
	function handleClickOutside() {
		showUserMenu = false;
	}
</script>

<svelte:head>
	<title>MeloAmp</title>
	<meta name="description" content="Your personal music streaming application" />
</svelte:head>

{#if i18nReady && authInitialized}
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

						<!-- Center Search Bar -->
						<div class="flex-1 max-w-lg mx-8 flex items-center">
							<form on:submit={handleSearch} class="relative w-full">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Search size={16} class="text-gray-400" />
								</div>
								<input
									type="text"
									bind:value={searchQuery}
									on:input={handleSearchInput}
									placeholder="Search music..."
									class="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm h-10"
								/>
							</form>
						</div>

						<!-- User Menu -->
						<div class="flex items-center">
							<div class="relative">
								<button
									on:click={() => showUserMenu = !showUserMenu}
									class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<!-- User Avatar -->
									<div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
										<User size={16} class="text-white" />
									</div>
									<!-- User Name and Welcome Text -->
									<div class="hidden sm:block text-left">
										<div class="text-sm font-medium text-gray-900 dark:text-white">
											{$auth.user?.username || $auth.user?.email || 'User'}
										</div>
										<div class="text-xs text-gray-500 dark:text-gray-400">
											{$_('nav.welcome')}
										</div>
									</div>
									<!-- Chevron -->
									<ChevronDown size={16} class="text-gray-400 {showUserMenu ? 'rotate-180' : ''} transition-transform" />
								</button>

								<!-- Dropdown Menu -->
								{#if showUserMenu}
									<div class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
										<!-- User Info Section -->
										<div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
											<div class="flex items-center space-x-3">
												<div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
													<User size={20} class="text-white" />
												</div>
												<div class="flex-1 min-w-0">
													<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
														{$auth.user?.username || 'User'}
													</p>
													<p class="text-xs text-gray-500 dark:text-gray-400 truncate">
														{$auth.user?.email || ''}
													</p>
												</div>
											</div>
										</div>

										<!-- Menu Items -->
										<div class="py-1">
											<button
												on:click={navigateToSettings}
												class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
											>
												<Settings size={16} class="mr-3" />
												{$_('navigation.settings')}
											</button>
											
											<div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
											
											<button
												on:click={handleLogout}
												class="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
											>
												<LogOut size={16} class="mr-3" />
												{$_('auth.logout')}
											</button>
										</div>

										<!-- Version Info -->
										<div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
											<div class="text-xs text-gray-500 dark:text-gray-400">
												<div class="font-medium">MeloAmp</div>
												<div>Version 0.1.0</div>
											</div>
										</div>
									</div>
								{/if}
							</div>
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

<!-- Click outside to close user menu -->
{#if showUserMenu}
	<div 
		class="fixed inset-0 z-40" 
		role="button" 
		tabindex="-1"
		on:click={handleClickOutside}
		on:keydown={(e) => e.key === 'Escape' && handleClickOutside()}
	></div>
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