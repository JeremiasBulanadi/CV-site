<script>
	import Intro from './components/Intro.svelte';

	export let name;
</script>

<main class="bg-gray-800">
	<Intro>
	</Intro>
</main>

<style global lang="postcss">
	@tailwind base;
  	@tailwind components;
  	@tailwind utilities;
	  
	main {
		width: 100vw;
		height: 100vh;
		padding: 8px;
	}
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>