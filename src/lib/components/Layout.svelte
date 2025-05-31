<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { themeStore } from '$lib/stores/theme';
	import { _ } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { 
		Home, 
		Users, 
		Disc3, 
		Music, 
		ListMusic, 
		Search, 
		Settings, 
		LogOut,
		Sun,
		Moon,
		Monitor,
		User
	} from 'lucide-svelte';
	import { getContextualAvatarUrl, ImageContext } from '$lib/utils/imageUtils';

	export let showSidebar = true;

	let searchQuery = '';
	let showUserMenu = false;

	$: currentPath = $page.url.pathname;

	const navItems = [
		{ href: '/', icon: Home, label: 'nav.dashboard' },
		{ href: '/artists', icon: Users, label: 'nav.artists' },
		{ href: '/albums', icon: Disc3, label: 'nav.albums' },
		{ href: '/songs', icon: Music, label: 'nav.songs' },
		{ href: '/playlists', icon: ListMusic, label: 'nav.playlists' }
	];

	function handleSearch() {
		if (searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	function handleLogout() {
		auth.logout();
		goto('/login');
	}

	function toggleTheme() {
		const currentTheme = $themeStore.theme;
		const nextTheme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';
		themeStore.setTheme(nextTheme);
	}

	function getThemeIcon(theme: string) {
		switch (theme) {
			case 'light': return Sun;
			case 'dark': return Moon;
			default: return Monitor;
		}
	}
</script>

<div class="h-screen flex bg-surface-50-900-token">
	<!-- Sidebar -->
	{#if showSidebar}
		<aside class="w-64 bg-surface-100-800-token border-r border-surface-300-600-token flex flex-col">
			<!-- Logo -->
			<div class="p-6 border-b border-surface-300-600-token">
				<div class="flex items-center space-x-3">
					<img src="/logo.png" alt="MeloAmp" class="w-8 h-8" />
					<div>
						<h1 class="text-xl font-bold text-primary-500">{$_('app.name')}</h1>
						<p class="text-xs text-surface-600-300-token">{$_('app.tagline')}</p>
					</div>
				</div>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 p-4 space-y-2">
				{#each navItems as item}
					<a
						href={item.href}
						class="sidebar-nav-item {$page.url.pathname === item.href ? 'active' : ''}"
					>
						<svelte:component this={item.icon} size={20} />
						<span>{$_(item.label)}</span>
					</a>
				{/each}
			</nav>

			<!-- Settings -->
			<div class="p-4 border-t border-surface-300-600-token">
				<a href="/settings" class="sidebar-nav-item {$page.url.pathname === '/settings' ? 'active' : ''}">
					<Settings size={20} />
					<span>{$_('nav.settings')}</span>
				</a>
			</div>
		</aside>
	{/if}

	<!-- Main Content -->
	<div class="flex-1 flex flex-col">
		<!-- Header -->
		<header class="bg-surface-100-800-token border-b border-surface-300-600-token p-4">
			<div class="flex items-center justify-between">
				<!-- Search -->
				<div class="flex-1 max-w-md">
					<form on:submit|preventDefault={handleSearch} class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-500" size={20} />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder={$_('search.placeholder')}
							class="w-full pl-10 pr-4 py-2 bg-surface-200-700-token border border-surface-300-600-token rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
					</form>
				</div>

				<!-- User Menu -->
				<div class="flex items-center space-x-4">
					<!-- Theme Toggle -->
					<button
						on:click={toggleTheme}
						class="p-2 rounded-lg hover:bg-surface-200-700-token transition-colors"
						title="Toggle theme"
					>
						<svelte:component this={getThemeIcon($themeStore.theme)} size={20} />
					</button>

					<!-- User Avatar & Menu -->
					<div class="relative">
						<button
							on:click={() => showUserMenu = !showUserMenu}
							class="flex items-center space-x-3 p-2 rounded-lg hover:bg-surface-200-700-token transition-colors"
						>
							{#if $auth.user?.avatarUrl || $auth.user?.avatarThumbnailUrl}
								<img src={getContextualAvatarUrl($auth.user, ImageContext.NAVIGATION)} alt="Avatar" class="w-8 h-8 rounded-full" />
							{:else}
								<div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
									<User size={16} class="text-white" />
								</div>
							{/if}
							<span class="font-medium">{$auth.user?.username || $auth.user?.email}</span>
						</button>

						{#if showUserMenu}
							<div class="absolute right-0 mt-2 w-48 bg-surface-100-800-token border border-surface-300-600-token rounded-lg shadow-lg z-50">
								<div class="p-3 border-b border-surface-300-600-token">
									<p class="font-medium">{$auth.user?.username}</p>
									<p class="text-sm text-surface-600-300-token">{$auth.user?.email}</p>
								</div>
								<button
									on:click={handleLogout}
									class="w-full flex items-center space-x-2 p-3 text-left hover:bg-surface-200-700-token transition-colors"
								>
									<LogOut size={16} />
									<span>{$_('auth.logout')}</span>
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</header>

		<!-- Page Content -->
		<main class="flex-1 overflow-auto p-6">
			<slot />
		</main>
	</div>
</div>

<!-- Click outside to close user menu -->
{#if showUserMenu}
	<div 
		class="fixed inset-0 z-40" 
		role="button" 
		tabindex="-1"
		on:click={() => showUserMenu = false}
		on:keydown={(e) => e.key === 'Escape' && (showUserMenu = false)}
	></div>
{/if} 