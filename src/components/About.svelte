<script>

</script>

<section id="About" class="flex flex-col justify-center py-4">
    <div class="section-header flex flex-row items-center py-4">
        <h2 class="font-roboto font-extrabold text-3xl">Who Am I</h2>
    </div>
    <div class="article-container flex flex-col sm:flex-row justify-center items-center">
        <article>
            <p class="font-roboto mb-3">
                Hi! I'm Jeremias Bulanadi, although most people call me Jay.
                I've been playing with computers since 2002. As a lot of my
                interests revolved around technology, I took up coding as a
                hobby ; And then soon thereafter, a possible career.
            </p>
            <p class="font-roboto mb-3">
                I've also taken an inspiration for arts and design eversince
                I was exposed to video games and animated shows. Now anytime
                I make anything, I've always had the urge to flair things up.
            </p> 
            <p class="font-roboto">
                My recent escapades involved the use and learning of:
            </p>
            <ul class="font-readex text-xs mt-5 ml-5">
                <li>
                    Javascript
                </li>
                <li>
                    Typescript
                </li>
                <li>
                    Node.js
                </li>
                <li>
                    Svelte
                </li>
                <li>
                    Vue.js
                </li>
                <li>
                    React
                </li>
                <li>
                    Unity
                </li>
                <li>
                    C#
                </li>
                <li>
                    Godot
                </li>
            </ul>
        </article>
        <div class="image-container flex justify-center items-center m-9 right-5 sm:right-0 sm:pr-0 bg-gray-500 text-white font-lato font-bold">
            <div class="image-holder bg-gray-500 flex justify-center items-center">
                Picture TBA
            </div>
        </div>
    </div>
</section>

<style>
    section {
        margin: 10vw 0;
        min-height: 80vh;
    }
    p {
        max-width: 500px;
    }

    ul {
        line-height: 1.75rem;

        columns: 3;
        -webkit-columns: 3;
        -moz-columns: 3;
    }

    .article-container {
        margin: 1rem 0;
    }
    .section-header {
        width: 100%;
    }

    .section-header > h2 {
        min-width: 5em;
    }

    .section-header::after{
        content: "";
        margin: 0 auto;
        width: 75%;
        height: 1px;
        background-color: #D1D5DB;
    }
    .image-holder {
        width: 100%;
        height: 100%;
        border-radius: 1.5%;
    }
   .image-container {
        position: relative;
        z-index: 2;

        min-width: 250px;
        min-height: 250px;

        border-radius: 1.5%;

        width: 250px;
        height: 250px;
   }

   .image-container::after {
        content: "";
        display: block;
        z-index: -2;
        position: absolute;
        top: 15px;
        left: 15px;
        border: 2px solid #9CA3AF;
        border-radius: 1.5%;
        width: 100%;
        height: 100%;
   }
</style>