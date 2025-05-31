<script lang="ts">
	import { themeStore } from '$lib/stores/theme';
	import { _, locale } from '$lib/i18n';
	import { supportedLocales, setLocale } from '$lib/i18n';
	import { Settings, Palette, Globe, Volume2, Bell, Search } from 'lucide-svelte';
	import type { SearchType, BaseTheme, ColorTheme } from '$lib/stores/theme';

	let selectedBaseTheme = $themeStore.baseTheme;
	let selectedColorTheme = $themeStore.colorTheme;
	let selectedLanguage = $locale || 'en';
	let autoPlay = $themeStore.preferences.autoPlay;
	let volume = $themeStore.preferences.volume;
	let quality = $themeStore.preferences.quality;
	let notifications = $themeStore.preferences.notifications;
	let defaultSearchTypes = [...$themeStore.preferences.defaultSearchTypes];

	const baseThemes = [
		{ value: 'light', label: 'settings.light' },
		{ value: 'dark', label: 'settings.dark' },
		{ value: 'system', label: 'settings.system' }
	] as { value: BaseTheme; label: string }[];

	const colorThemes = [
		{ value: 'blue', label: 'Blue', color: '59 130 246' },
		{ value: 'purple', label: 'Purple', color: '139 92 246' },
		{ value: 'green', label: 'Green', color: '34 197 94' },
		{ value: 'orange', label: 'Orange', color: '249 115 22' },
		{ value: 'red', label: 'Red', color: '239 68 68' }
	] as { value: ColorTheme; label: string; color: string }[];

	const qualities = [
		{ value: 'low', label: 'settings.low' },
		{ value: 'medium', label: 'settings.medium' },
		{ value: 'high', label: 'settings.high' }
	];

	const searchTypes = [
		{ value: 'artists', label: 'Artists' },
		{ value: 'albums', label: 'Albums' },
		{ value: 'songs', label: 'Songs' },
		{ value: 'playlists', label: 'Playlists' }
	] as { value: SearchType; label: string }[];

	function handleBaseThemeChange() {
		console.log('🎨 Base theme change triggered:', selectedBaseTheme);
		console.log('🎨 Current store base theme:', $themeStore.baseTheme);
		themeStore.setBaseTheme(selectedBaseTheme);
		console.log('🎨 Store base theme after change:', $themeStore.baseTheme);
	}

	function handleColorThemeChange() {
		console.log('🎨 Color theme change triggered:', selectedColorTheme);
		console.log('🎨 Current store color theme:', $themeStore.colorTheme);
		themeStore.setColorTheme(selectedColorTheme);
		console.log('🎨 Store color theme after change:', $themeStore.colorTheme);
	}

	function handleLanguageChange() {
		if (selectedLanguage) {
			setLocale(selectedLanguage);
			themeStore.setLanguage(selectedLanguage);
		}
	}

	function handleSearchTypeToggle(type: SearchType) {
		if (defaultSearchTypes.includes(type)) {
			defaultSearchTypes = defaultSearchTypes.filter(t => t !== type);
		} else {
			defaultSearchTypes = [...defaultSearchTypes, type];
		}
		
		// Ensure at least one type is always selected
		if (defaultSearchTypes.length === 0) {
			defaultSearchTypes = ['artists'];
		}
		
		handlePreferenceChange();
	}

	function handlePreferenceChange() {
		themeStore.updatePreferences({
			autoPlay,
			volume,
			quality,
			notifications,
			defaultSearchTypes
		});
	}

	// React to language changes
	$: if (selectedLanguage !== $locale) {
		handleLanguageChange();
	}

	// React to preference changes
	$: if (autoPlay !== $themeStore.preferences.autoPlay || 
		   volume !== $themeStore.preferences.volume || 
		   quality !== $themeStore.preferences.quality || 
		   notifications !== $themeStore.preferences.notifications) {
		handlePreferenceChange();
	}
</script>

<svelte:head>
	<title>Settings - MeloAmp</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-center space-x-3">
		<Settings size={32} class="text-primary-500" />
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">{$_('settings.title')}</h1>
	</div>

	<!-- Theme Settings -->
	<section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
		<div class="flex items-center space-x-3 mb-6">
			<Palette size={24} class="text-primary-500" />
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">{$_('settings.theme')}</h2>
		</div>

		<!-- Base Theme (Light/Dark/System) -->
		<div class="mb-8">
			<h3 class="font-medium mb-4 text-gray-900 dark:text-white">Mode</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each baseThemes as theme}
					<label class="relative cursor-pointer">
						<input
							type="radio"
							bind:group={selectedBaseTheme}
							value={theme.value}
							on:change={handleBaseThemeChange}
							class="sr-only"
						/>
						<div 
							class="p-4 border-2 rounded-lg transition-all {selectedBaseTheme === theme.value 
								? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
								: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}"
						>
							<div class="text-center">
								<div class="w-12 h-12 mx-auto mb-3 rounded-lg {theme.value === 'light' 
									? 'bg-white border border-gray-300' 
									: theme.value === 'dark' 
										? 'bg-gray-900 border border-gray-700' 
										: 'bg-gradient-to-br from-white to-gray-900 border border-gray-400'}">
								</div>
								<span class="font-medium text-gray-900 dark:text-white">{$_(theme.label)}</span>
							</div>
						</div>
					</label>
				{/each}
			</div>
		</div>

		<!-- Color Theme -->
		<div>
			<h3 class="font-medium mb-4 text-gray-900 dark:text-white">Color Palette</h3>
			<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
				{#each colorThemes as theme}
					<label class="relative cursor-pointer">
						<input
							type="radio"
							bind:group={selectedColorTheme}
							value={theme.value}
							on:change={handleColorThemeChange}
							class="sr-only"
						/>
						<div 
							class="p-4 border-2 rounded-lg transition-all {selectedColorTheme === theme.value 
								? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
								: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}"
						>
							<div class="text-center">
								<div 
									class="w-12 h-12 mx-auto mb-3 rounded-lg border border-gray-300 dark:border-gray-600"
									style="background-color: rgb({theme.color})"
								></div>
								<span class="font-medium text-gray-900 dark:text-white">{theme.label}</span>
							</div>
						</div>
					</label>
				{/each}
			</div>
		</div>
	</section>

	<!-- Language Settings -->
	<section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
		<div class="flex items-center space-x-3 mb-6">
			<Globe size={24} class="text-primary-500" />
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">{$_('settings.language')}</h2>
		</div>

		<div class="max-w-md">
			<select 
				bind:value={selectedLanguage}
				class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
			>
				{#each supportedLocales as locale}
					<option value={locale.code}>{locale.name}</option>
				{/each}
			</select>
		</div>
	</section>

	<!-- Audio Preferences -->
	<section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
		<div class="flex items-center space-x-3 mb-6">
			<Volume2 size={24} class="text-primary-500" />
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">{$_('settings.preferences')}</h2>
		</div>

		<div class="space-y-6">
			<!-- Auto-play -->
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-medium text-gray-900 dark:text-white">{$_('settings.autoPlay')}</h3>
					<p class="text-sm text-gray-600 dark:text-gray-300">Automatically play music when starting the app</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						bind:checked={autoPlay}
						class="sr-only peer"
					/>
					<div class="relative w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
				</label>
			</div>

			<!-- Default Volume -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<h3 class="font-medium text-gray-900 dark:text-white">{$_('settings.volume')}</h3>
					<span class="text-sm text-gray-600 dark:text-gray-300">{Math.round(volume * 100)}%</span>
				</div>
				<input 
					type="range" 
					min="0" 
					max="1" 
					step="0.01"
					bind:value={volume}
					class="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
				/>
			</div>

			<!-- Audio Quality -->
			<div>
				<h3 class="font-medium mb-3 text-gray-900 dark:text-white">{$_('settings.quality')}</h3>
				<div class="grid grid-cols-3 gap-3">
					{#each qualities as qualityOption}
						<label class="relative cursor-pointer">
							<input
								type="radio"
								bind:group={quality}
								value={qualityOption.value}
								class="sr-only"
							/>
							<div 
								class="p-3 text-center border-2 rounded-lg transition-all {quality === qualityOption.value 
									? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
									: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}"
							>
								<span class="font-medium text-gray-900 dark:text-white">{$_(qualityOption.label)}</span>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<!-- Notifications -->
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-medium flex items-center space-x-2 text-gray-900 dark:text-white">
						<Bell size={20} />
						<span>{$_('settings.notifications')}</span>
					</h3>
					<p class="text-sm text-gray-600 dark:text-gray-300">Show notifications for new songs and updates</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						bind:checked={notifications}
						class="sr-only peer"
					/>
					<div class="relative w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
				</label>
			</div>
		</div>
	</section>

	<!-- Search Preferences -->
	<section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
		<div class="flex items-center space-x-3 mb-6">
			<Search size={24} class="text-primary-500" />
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Search Preferences</h2>
		</div>

		<div>
			<h3 class="font-medium mb-3 text-gray-900 dark:text-white">Default Search Types</h3>
			<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">Choose what to search by default when using the header search</p>
			<div class="space-y-2">
				{#each searchTypes as searchType}
					<label class="flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={defaultSearchTypes.includes(searchType.value)}
							on:change={() => handleSearchTypeToggle(searchType.value)}
							class="sr-only peer"
						/>
						<div class="relative w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
						<span class="ml-3 font-medium text-gray-900 dark:text-white">{searchType.label}</span>
					</label>
				{/each}
			</div>
		</div>
	</section>

	<!-- Save Notice -->
	<div class="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4">
		<p class="text-green-700 dark:text-green-300 text-sm">
			✓ Settings are automatically saved as you make changes
		</p>
	</div>
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: rgb(var(--color-primary-500));
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: rgb(var(--color-primary-500));
		cursor: pointer;
		border: none;
	}
</style> 