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
	<div class="container">
		{#if firstLoaded}
			 <div in:fade={{ delay: 100 , duration: 1500 }}>
				<Navbar offset={20}/>
			</div>
		{/if}
		<div class="container flex flex-col justify-center items-center">
			<Intro/>
		</div>
	</div>
</main>

{#if firstLoaded}
	 <div in:fade={{ delay: 100 , duration: 1500 }} class="side-bar-container">
		 <IconBar/>	
	 </div>
{/if}


<style>
	main {
		min-height: 100vh;
	}

	.container {
		margin: 0 10px 0 10px;
	}

	.side-bar-container {
		position: fixed;
		
		bottom: 0;
		left: 80px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>