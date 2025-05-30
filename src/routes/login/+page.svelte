<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { apiClient } from '$lib/api/client';
	import { _ } from '$lib/i18n';
	import { Eye, EyeOff, AlertCircle } from 'lucide-svelte';

	let serverUrl = '';
	let email = '';
	let password = '';
	let showPassword = false;
	let isLoading = false;
	let error = '';

	async function handleLogin() {
		if (!serverUrl || !email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const response = await apiClient.login(serverUrl, { email, password });
			auth.login(response.user, response.token, serverUrl);
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			isLoading = false;
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<svelte:head>
	<title>Login - MeloAmp</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Logo and Title -->
		<div class="text-center mb-8">
			<img src="/logo.png" alt="MeloAmp" class="w-16 h-16 mx-auto mb-4" />
			<h1 class="text-3xl font-bold text-white mb-2">{$_('auth.welcome')}</h1>
			<p class="text-white/80">{$_('auth.subtitle')}</p>
		</div>

		<!-- Login Form -->
		<div class="bg-surface-100-800-token rounded-xl shadow-2xl p-8">
			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				<!-- Server URL -->
				<div>
					<label for="serverUrl" class="block text-sm font-medium mb-2">
						{$_('auth.serverUrl')}
					</label>
					<input
						id="serverUrl"
						type="url"
						bind:value={serverUrl}
						placeholder={$_('auth.serverUrlPlaceholder')}
						required
						class="w-full px-4 py-3 bg-surface-200-700-token border border-surface-300-600-token rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
					/>
				</div>

				<!-- Email -->
				<div>
					<label for="email" class="block text-sm font-medium mb-2">
						{$_('auth.email')}
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder={$_('auth.emailPlaceholder')}
						required
						class="w-full px-4 py-3 bg-surface-200-700-token border border-surface-300-600-token rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
					/>
				</div>

				<!-- Password -->
				<div>
					<label for="password" class="block text-sm font-medium mb-2">
						{$_('auth.password')}
					</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder={$_('auth.passwordPlaceholder')}
							required
							class="w-full px-4 py-3 pr-12 bg-surface-200-700-token border border-surface-300-600-token rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
						/>
						<button
							type="button"
							on:click={togglePasswordVisibility}
							class="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
						>
							{#if showPassword}
								<EyeOff size={20} />
							{:else}
								<Eye size={20} />
							{/if}
						</button>
					</div>
				</div>

				<!-- Error Message -->
				{#if error}
					<div class="flex items-center space-x-2 p-3 bg-error-100 dark:bg-error-900 border border-error-300 dark:border-error-700 rounded-lg">
						<AlertCircle size={20} class="text-error-600 dark:text-error-400" />
						<span class="text-error-700 dark:text-error-300 text-sm">{error}</span>
					</div>
				{/if}

				<!-- Login Button -->
				<button
					type="submit"
					disabled={isLoading}
					class="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed"
				>
					{#if isLoading}
						<div class="flex items-center justify-center space-x-2">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							<span>Signing in...</span>
						</div>
					{:else}
						{$_('auth.loginButton')}
					{/if}
				</button>
			</form>
		</div>

		<!-- Footer -->
		<div class="text-center mt-8">
			<p class="text-white/60 text-sm">
				{$_('app.name')} - {$_('app.tagline')}
			</p>
		</div>
	</div>
</div> 