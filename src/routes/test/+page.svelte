<script lang="ts">
	import { api } from '$lib/api';

	let serverUrl = 'http://192.168.8.130/api/v1/';
	let testResult = '';
	let isLoading = false;

	async function testConnection() {
		try {
			isLoading = true;
			testResult = 'Testing connection...';
			
			console.log('Testing API connection...');
			api.setBaseUrl(serverUrl);
			
			const fullUrl = api.getFullUrl('/user/authenticate');
			console.log('Full URL would be:', fullUrl);
			
			// Try a simple fetch to test connectivity
			const response = await fetch(fullUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'test'
				})
			});
			
			console.log('Response status:', response.status);
			console.log('Response headers:', response.headers);
			
			const responseText = await response.text();
			console.log('Response text:', responseText);
			
			testResult = `Status: ${response.status}\nResponse: ${responseText}`;
		} catch (error) {
			console.error('Test failed:', error);
			testResult = `Error: ${error.message}`;
		} finally {
			isLoading = false;
		}
	}

	async function testWithTauriHttp() {
		try {
			isLoading = true;
			testResult = 'Testing with Tauri HTTP...';
			
			console.log('Testing with Tauri HTTP plugin...');
			
			// Import the Tauri HTTP fetch
			const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
			
			api.setBaseUrl(serverUrl);
			const fullUrl = api.getFullUrl('/user/authenticate');
			console.log('Full URL would be:', fullUrl);
			
			const response = await tauriFetch(fullUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'test'
				})
			});
			
			console.log('Tauri Response status:', response.status);
			console.log('Tauri Response headers:', response.headers);
			
			const responseText = await response.text();
			console.log('Tauri Response text:', responseText);
			
			testResult = `Tauri Status: ${response.status}\nResponse: ${responseText}`;
		} catch (error) {
			console.error('Tauri test failed:', error);
			testResult = `Tauri Error: ${error.message}`;
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>API Test - MeloAmp</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">API Connection Test</h1>
	
	<div class="space-y-4">
		<div>
			<label for="serverUrl" class="block text-sm font-medium mb-2">Server URL:</label>
			<input
				id="serverUrl"
				type="text"
				bind:value={serverUrl}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
		</div>
		
		<div class="flex space-x-4">
			<button
				on:click={testConnection}
				disabled={isLoading}
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
			>
				Test Regular Fetch
			</button>
			
			<button
				on:click={testWithTauriHttp}
				disabled={isLoading}
				class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
			>
				Test Tauri HTTP
			</button>
		</div>
		
		{#if testResult}
			<div class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
				<h3 class="font-semibold mb-2">Test Result:</h3>
				<pre class="whitespace-pre-wrap text-sm">{testResult}</pre>
			</div>
		{/if}
		
		{#if isLoading}
			<div class="flex items-center space-x-2">
				<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
				<span>Testing...</span>
			</div>
		{/if}
	</div>
	
	<div class="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
		<h3 class="font-semibold mb-2">Debug Information:</h3>
		<p class="text-sm">
			Expected URL: <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">http://192.168.8.130/api/v1/user/authenticate</code>
		</p>
		<p class="text-sm mt-2">
			Check the browser's developer console and network tab for detailed logs.
		</p>
	</div>
</div> 