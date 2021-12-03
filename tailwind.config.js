const { plugins } = require("./postcss.config");
const colors = require('tailwindcss/colors');

const production = !process.env.ROLLUP_WATCH;
module.exports = {
    future: {
        purgeLayersByDefault: true,
        removeDeprecatedGapUtilities: true,
    },
    plugins: [
    ],
    purge: {
        content: [
            './src/App.svelte',
        ],
        enabled: production // disable purge in dev
    },
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            gray: colors.trueGray,
            red: colors.red,
            blue: colors.sky,
            yellow: colors.amber,
        }
    }
};
