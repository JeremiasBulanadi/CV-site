<script>
	import Navbar from './components/Navbar.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	let firstLoaded = false;
	onMount(() => {
		firstLoaded = true;
	})
</script>

<main class="bg-gray-900 flex justify-center">
	<div class="container">
		{#if firstLoaded}
			 <div in:fade={{ delay: 100 , duration: 1500 }}>
				<Navbar offset={20}/>
			</div>
		{/if}
		<div class="container flex flex-col justify-center">
			<div class="test-bar bg-red-500"></div>
		</div>
	</div>
</main>

<style>
	.test-bar {
		width: 100px;
		height: 4000px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>