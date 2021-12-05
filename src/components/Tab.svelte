<script>
    export let tabName = "";
</script>


<a href="#{tabName}" class="flex">
    <div class="tab flex items-center">
        <div class="px-2 mx-auto">
            {tabName}
        </div>
    </div>
</a>


<style>
    a {
        width: 100%;
        height: 100%;

        text-decoration: none;
    }

    .tab {
        background-color: red;
        width: 100px;
        min-height: 100%;
        
    }

    /* your styles go here */
    .tab::after {
        content: "";
        width: inherit;
        border-bottom: solid 4px teal;
        position: absolute;
        bottom: 0;
        z-index: 1;
        opacity: 0%;

        transition: 200ms linear;
    }

    .tab:hover::after {
        opacity: 100%;
    }
</style>