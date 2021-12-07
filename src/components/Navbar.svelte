<script>
    import Tab from './Tab.svelte';
    import Logo from './Logo.svelte';

    // Hides the navbar when scrolling down
    // Got this from: https://blog.kowalczyk.info/article/de13a71a392f488b9352b300b3ed722d/hide-header-on-scroll-in-svelte.html
    export let duration = "300ms";
    export let offset = 10;
    export let tolerance = 0;

    let headerClass = "show";
    let y = 0;
    let lastY = 0;

    function deriveClass(y, dy) {
        // show if at the top of page
        if (y < offset) {
            console.log("We docked now, we must **SHOW**");
            return "docked";
        }

        // don't change the state unless scroll delta
	    // is above a threshold 
        if (Math.abs(dy) <= tolerance) {
            return headerClass;
        }

        // if scrolling up, show
        if (dy > 0) {
            return "show";
        }
        // if scrolling down, hide
        return "hide";
        
    }

    function updateClass(y) {
        const dy = lastY - y;
        console.table(lastY,y,dy);
        lastY = y;
        return deriveClass(y, dy);
    }

    function setTransitionDuration(node) {
        node.style.transitionDuration = duration;
    }

    $: headerClass = updateClass(y);
</script>

<svelte:window bind:scrollY={y} />

<header>
    <nav use:setTransitionDuration id="navbar" class="bg-gray-200 bg-opacity-80 fixed top-0 left-0 z-50 {headerClass}">
        <div id="nav-content" class="flex justify-between">
            <div class="nav-side flex">
                <div class="logo-container">
                    <Logo />
                </div>
            </div>
            <div class="nav-side hidden md:flex items-stretch ">
                <div class="tabs-container flex">
                    <Tab tabName={"Intro"} />
                    <Tab tabName={"About"} />
                    <Tab tabName={"Contact"} />
                </div>
                <div class="flex items-center px-6">
                    <a href="./JeremiasBulanadi-Resume.pdf" target="_blank">
                        <button class="bg-transparent hover:bg-indigo-500 text-indigo-700 font-semibold hover:text-white py-2 px-4 border border-indigo-500 hover:border-transparent rounded transition">
                            Resume
                        </button>
                    </a>
                </div>
            </div>
        </div>
	</nav>
</header>

<style>
    header {
        position: fixed;
        width: 100%;

        z-index: 1000;
        padding-top: 80px; /* We need this to make navbar hide */
    }

    #navbar {
        padding-right: 50px;
        width: 100%;
        top: 0;

        backdrop-filter: blur(5px);

        transition: transform 300ms linear;
    }

    #nav-content {
        height: 70px;
    }

    .docked {
        transform: translateY(0%);
        
        box-shadow: none;
        padding-top: 10px;
    }
    .show {
        transform: translateY(0%);
    }
    .hide {
        transform: translateY(-100%);
    }
</style>