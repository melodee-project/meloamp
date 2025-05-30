<script lang="ts">
	import { themeStore } from '$lib/stores/theme';
	import { _, locale } from '$lib/i18n';
	import { supportedLocales, setLocale } from '$lib/i18n';
	import { Settings, Palette, Globe, Volume2, Bell } from 'lucide-svelte';

	let selectedTheme = $themeStore.theme;
	let selectedLanguage = $locale || 'en';
	let autoPlay = $themeStore.preferences.autoPlay;
	let volume = $themeStore.preferences.volume;
	let quality = $themeStore.preferences.quality;
	let notifications = $themeStore.preferences.notifications;

	const themes = [
		{ value: 'light', label: 'settings.light' },
		{ value: 'dark', label: 'settings.dark' },
		{ value: 'system', label: 'settings.system' }
	];

	const qualities = [
		{ value: 'low', label: 'settings.low' },
		{ value: 'medium', label: 'settings.medium' },
		{ value: 'high', label: 'settings.high' }
	];

	function handleThemeChange() {
		themeStore.setTheme(selectedTheme);
	}

	function handleLanguageChange() {
		if (selectedLanguage) {
			setLocale(selectedLanguage);
			themeStore.setLanguage(selectedLanguage);
		}
	}

	function handlePreferenceChange() {
		themeStore.updatePreferences({
			autoPlay,
			volume,
			quality,
			notifications
		});
	}

	// React to changes
	$: if (selectedTheme !== $themeStore.theme) {
		handleThemeChange();
	}

	$: if (selectedLanguage !== $locale) {
		handleLanguageChange();
	}

	$: handlePreferenceChange();
</script>

<svelte:head>
	<title>Settings - MeloAmp</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-center space-x-3">
		<Settings size={32} class="text-primary-500" />
		<h1 class="text-3xl font-bold">{$_('settings.title')}</h1>
	</div>

	<!-- Theme Settings -->
	<section class="bg-surface-100-800-token rounded-xl p-6">
		<div class="flex items-center space-x-3 mb-6">
			<Palette size={24} class="text-primary-500" />
			<h2 class="text-xl font-semibold">{$_('settings.theme')}</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each themes as theme}
				<label class="relative cursor-pointer">
					<input
						type="radio"
						bind:group={selectedTheme}
						value={theme.value}
						class="sr-only"
					/>
					<div 
						class="p-4 border-2 rounded-lg transition-all {selectedTheme === theme.value 
							? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
							: 'border-surface-300-600-token hover:border-surface-400-500-token'}"
					>
						<div class="text-center">
							<div class="w-12 h-12 mx-auto mb-3 rounded-lg {theme.value === 'light' 
								? 'bg-white border border-gray-300' 
								: theme.value === 'dark' 
									? 'bg-gray-900 border border-gray-700' 
									: 'bg-gradient-to-br from-white to-gray-900 border border-gray-400'}">
							</div>
							<span class="font-medium">{$_(theme.label)}</span>
						</div>
					</div>
				</label>
			{/each}
		</div>
	</section>

	<!-- Language Settings -->
	<section class="bg-surface-100-800-token rounded-xl p-6">
		<div class="flex items-center space-x-3 mb-6">
			<Globe size={24} class="text-primary-500" />
			<h2 class="text-xl font-semibold">{$_('settings.language')}</h2>
		</div>

		<div class="max-w-md">
			<select 
				bind:value={selectedLanguage}
				class="w-full px-4 py-3 bg-surface-200-700-token border border-surface-300-600-token rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
			>
				{#each supportedLocales as locale}
					<option value={locale.code}>{locale.name}</option>
				{/each}
			</select>
		</div>
	</section>

	<!-- Audio Preferences -->
	<section class="bg-surface-100-800-token rounded-xl p-6">
		<div class="flex items-center space-x-3 mb-6">
			<Volume2 size={24} class="text-primary-500" />
			<h2 class="text-xl font-semibold">{$_('settings.preferences')}</h2>
		</div>

		<div class="space-y-6">
			<!-- Auto-play -->
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-medium">{$_('settings.autoPlay')}</h3>
					<p class="text-sm text-surface-600-300-token">Automatically play music when starting the app</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						bind:checked={autoPlay}
						class="sr-only peer"
					/>
					<div class="relative w-11 h-6 bg-surface-300-600-token peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
				</label>
			</div>

			<!-- Default Volume -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<h3 class="font-medium">{$_('settings.volume')}</h3>
					<span class="text-sm text-surface-600-300-token">{Math.round(volume * 100)}%</span>
				</div>
				<input 
					type="range" 
					min="0" 
					max="1" 
					step="0.01"
					bind:value={volume}
					class="w-full h-2 bg-surface-300-600-token rounded-lg appearance-none cursor-pointer slider"
				/>
			</div>

			<!-- Audio Quality -->
			<div>
				<h3 class="font-medium mb-3">{$_('settings.quality')}</h3>
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
									: 'border-surface-300-600-token hover:border-surface-400-500-token'}"
							>
								<span class="font-medium">{$_(qualityOption.label)}</span>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<!-- Notifications -->
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-medium flex items-center space-x-2">
						<Bell size={20} />
						<span>{$_('settings.notifications')}</span>
					</h3>
					<p class="text-sm text-surface-600-300-token">Show notifications for new songs and updates</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						bind:checked={notifications}
						class="sr-only peer"
					/>
					<div class="relative w-11 h-6 bg-surface-300-600-token peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
				</label>
			</div>
		</div>
	</section>

	<!-- Save Notice -->
	<div class="bg-success-100 dark:bg-success-900 border border-success-300 dark:border-success-700 rounded-lg p-4">
		<p class="text-success-700 dark:text-success-300 text-sm">
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