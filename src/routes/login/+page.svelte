<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { _ } from '$lib/i18n';
	import { Eye, EyeOff, Server, Mail, Lock } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let serverUrl = '';
	let email = '';
	let password = '';
	let showPassword = false;
	let isLoading = false;
	let error = '';

	onMount(() => {
		// Load the last used server URL from a separate localStorage key that persists through logout
		const lastServerUrl = localStorage.getItem('lastServerUrl');
		if (lastServerUrl) {
			serverUrl = lastServerUrl;
		}
	});

	async function handleLogin() {
		console.log('🔥 handleLogin function called!');
		console.log('Form values:', { serverUrl, email, password: password ? '***' : 'empty' });
		
		if (!serverUrl || !email || !password) {
			console.log('❌ Validation failed - missing fields');
			error = 'Please fill in all fields';
			return;
		}

		try {
			isLoading = true;
			error = '';
			
			console.log('🚀 Starting login process...');
			console.log('📡 Server URL:', serverUrl);
			console.log('📧 Email:', email);
			console.log('🔐 Password length:', password.length);
			
			console.log('📞 Calling auth.login...');
			const result = await auth.login(serverUrl, email, password);
			
			// Save the server URL for future logins (separate from auth data so it persists through logout)
			localStorage.setItem('lastServerUrl', serverUrl);
			
			console.log('✅ Login successful:', result);
			console.log('🔄 Redirecting to dashboard...');
			goto('/');
		} catch (err) {
			console.error('❌ Login failed:', err);
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			isLoading = false;
			console.log('🏁 Login process finished');
		}
	}

	function handleButtonClick(event) {
		console.log('🖱️ Submit button clicked!', event);
		console.log('Button event type:', event.type);
		console.log('Current form values before click:', { serverUrl, email, password: password ? '***' : 'empty' });
		// Don't prevent default here - let the form submission happen naturally
	}

	function handleFormSubmit(event) {
		console.log('📝 Form submit event triggered!', event);
		console.log('Event type:', event.type);
		console.log('Event target:', event.target);
		console.log('Current form values on submit:', { serverUrl, email, password: password ? '***' : 'empty' });
		event.preventDefault();
		handleLogin();
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<svelte:head>
	<title>Login - MeloAmp</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<img src="/logo.png" alt="MeloAmp" class="mx-auto h-16 w-auto" />
			<h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
				{$_('login.title')}
			</h2>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				{$_('login.subtitle')}
			</p>
		</div>

		<form class="mt-8 space-y-6" on:submit={handleFormSubmit}>
			{#if error}
				<div class="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
					<p class="text-red-700 dark:text-red-300 text-sm">{error}</p>
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="serverUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						{$_('login.serverUrl')}
					</label>
					<div class="mt-1 relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Server size={20} class="text-gray-400" />
						</div>
						<input
							id="serverUrl"
							name="serverUrl"
							type="url"
							bind:value={serverUrl}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
							placeholder="http://192.168.8.130/api/v1/"
						/>
					</div>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						{$_('login.email')}
					</label>
					<div class="mt-1 relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Mail size={20} class="text-gray-400" />
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							bind:value={email}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
							placeholder={$_('login.emailPlaceholder')}
						/>
					</div>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						{$_('login.password')}
					</label>
					<div class="mt-1 relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock size={20} class="text-gray-400" />
						</div>
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							bind:value={password}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
							placeholder={$_('login.passwordPlaceholder')}
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
							on:click={togglePasswordVisibility}
						>
							{#if showPassword}
								<EyeOff size={20} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
							{:else}
								<Eye size={20} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
							{/if}
						</button>
					</div>
				</div>
			</div>

			<div>
				<button
					type="submit"
					disabled={isLoading}
					on:click={handleButtonClick}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{#if isLoading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
					{/if}
					{$_('login.signIn')}
				</button>
			</div>
		</form>
	</div>
</div> 