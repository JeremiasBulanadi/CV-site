var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/JeremiasBulanadi/jdb.dev.git', // Update to point to your repository  
        user: {
            name: 'Jeremias Bulanadi', // update to use your name
            email: 'jdb.prog@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)