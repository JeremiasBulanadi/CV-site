<script>
	import Navbar from './components/Navbar.svelte';
	import Intro from './components/Intro.svelte';
	import About from './components/About.svelte';
	import Contact from './components/Contact.svelte';
	import IconBar from './components/IconBar.svelte';

	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	let firstLoaded = false;
	onMount(() => {
		firstLoaded = true;
	})
</script>

<main class="bg-gray-200 flex justify-center">
	<div class="container wrapper sm:px-1">
		{#if firstLoaded}
			 <div in:fade={{ delay: 100 , duration: 1500 }}>
				<Navbar offset={20}/>
			</div>
		{/if}
		<div class="container flex flex-col justify-center items-center">
			<Intro/>
			<About/>
			<Contact/>
		</div>

		{#if firstLoaded}
			<div in:fade={{ delay: 100 , duration: 1500 }} class="side-bar-container">
				<IconBar/>	
			</div>
		{/if}
		
		<footer class="flex flex-col justify-center items-center pt-4 pb-8 font-lato font-semibold text-gray-400 text-sm text-center">
			<p >Site made by Jeremias Bulanadi</p>
			<a id="GithubLink" href="https://github.com/JeremiasBulanadi/jdb.dev" class="text-gray-300 text-xs">
				github : jdb.dev
			</a>
		</footer>
	</div>
</main>


<style>
	main {
		min-height: 100vh;
	}

	#GithubLink {
		color: #9CA3AF;
	}

	.container {
		margin: 0 10px 0 10px;
	}

	.wrapper {
		padding: 0 1rem;
	}

	.side-bar-container {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	@media (min-width: 1024px) {
		.side-bar-container {
			display: block;
			position: fixed;
			
			width: auto;
			bottom: 0;
			left: 40px;
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