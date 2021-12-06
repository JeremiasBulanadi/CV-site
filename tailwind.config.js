module.exports = {
  purge: [
    './src/**/*.html',
    './src/**/*.svelte'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        roboto: ['Roboto'],
        lato: ['Lato'],
        readex: ['Readex Pro']
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
