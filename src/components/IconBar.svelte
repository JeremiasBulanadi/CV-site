<script>

</script>

<svelte:head>
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.4/css/all.css" integrity="sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm" crossorigin="anonymous">
</svelte:head>

<div class="icon-bar flex lg:flex-col justify-center gap-x-12">
    <div class="icon">
        <a href="https://github.com/JeremiasBulanadi" target="_blank">
            <i class="fab fa-github fa-2x text-gray-600 hover:text-indigo-600 transform transition"></i>
        </a>
    </div>
    <div class="icon">
        <a href="https://www.linkedin.com/in/jeremias-bulanadi-25b5a915a/" target="_blank">
            <i class="fab fa-linkedin-in fa-2x text-gray-600 hover:text-indigo-600 transform transition"></i>
        </a>
    </div>
    <div class="icon">
        <a href="https://codepen.io/jeremiasbulanadi" target="_blank">
            <i class="fab fa-codepen fa-2x text-gray-600 hover:text-indigo-600 transform transition"></i>
        </a>
    </div>
    <div class="icon">
        <a href="mailto:jdb.prog@gmail.com" target="_blank">
            <i class="fas fa-at fa-2x text-gray-600 hover:text-indigo-600 transform transition"></i>
        </a>
    </div>
</div>

<style>
    .icon {
        margin-bottom: 5px;
    }
    i:hover {
        --tw-translate-y: -0.25rem;
    }

    .icon-bar {
        width: 100%;
    }
    

    @media (min-width: 1024px) {
        .icon-bar::after {
            content: "";
            display: block;
            margin: 0 auto;
            height: 100px;
            width: 1px;
            background-color: #6B7280;
        }

        .icon {
            margin-bottom: 25px;
        }

        .icon:last-of-type {
            margin-bottom: 30px;
        }

    }
</style>