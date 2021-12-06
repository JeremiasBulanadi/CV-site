<script>
	import Navbar from './components/Navbar.svelte';
	import Intro from './components/Intro.svelte';
	import IconBar from './components/IconBar.svelte';

	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	let firstLoaded = false;
	onMount(() => {
		firstLoaded = true;
	})
</script>

<main class="bg-gray-200 flex justify-center">
	<div class="container wrapper">
		{#if firstLoaded}
			 <div in:fade={{ delay: 100 , duration: 1500 }}>
				<Navbar offset={20}/>
			</div>
		{/if}
		<div class="container flex flex-col justify-center items-center">
			<Intro/>
		</div>

		{#if firstLoaded}
			<div in:fade={{ delay: 100 , duration: 1500 }} class="side-bar-container">
				<IconBar/>	
			</div>
		{/if}
	</div>
</main>


<style>
	main {
		min-height: 100vh;
	}

	.container {
		margin: 0 10px 0 10px;
	}

	.wrapper {
		padding: 0 1rem;
	}

	.side-bar-container {
		display: none;
		position: fixed;
		
		bottom: 0;
		left: 40px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	@media (min-width: 1024px) {
		.side-bar-container {
			display: block;
		}

		.wrapper {
			padding: 0 6rem;
		}
	}

	@media (min-width: 1280px) {
		.side-bar-container {
			left: 80px;
		}
	}
</style>