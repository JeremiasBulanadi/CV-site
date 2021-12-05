<script>
import Navbar from './components/Navbar.svelte';
</script>

<main class="wrapper bg-gray-900">
	<div class="flex flex-col">
		<Navbar/>
	</div>

	<div class="test-bar bg-red-500"></div>
</main>

<style>
	main {
		text-align: center;
		margin: 0 auto;
	}

	.test-bar {
		width: 100px;
		height: 4000px;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.wrapper {
		position: relative;

		width: 100vw;
		height: 100vh;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>