<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  export let src: string;
  export let alt: string = '';
  export let className: string = '';
  
  let actualSrc = src;
  let loading = true;
  let error = false;

  onMount(async () => {
    // If the image is from an HTTPS URL (likely self-signed), use our proxy
    if (src && src.startsWith('https://')) {
      try {
        actualSrc = await api.getImageBlob(src);
      } catch (err) {
        console.error('Failed to load SSL image:', err);
        error = true;
        actualSrc = '/placeholder-music.png';
      }
    }
    loading = false;
  });

  function handleError() {
    error = true;
    actualSrc = '/placeholder-music.png';
  }
</script>

{#if loading}
  <div class={`bg-gray-300 dark:bg-gray-600 animate-pulse ${className}`}></div>
{:else}
  <img 
    src={actualSrc} 
    {alt} 
    class={className}
    on:error={handleError}
  />
{/if} 