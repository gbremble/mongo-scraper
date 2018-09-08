const db = require('../models');

module.exports = (app) => {
    // GET route for retrieving all Articles from the database
    app.get('/', (req, res) => {
        // get every document in the Articles collection
        db.Article.find({})
            .then((dbArticle) => {
                // if successful, send Articles back to the client
                res.render('index', {
                    articles: dbArticle,
                });
            })
            .catch(error => res.json(error));
    });

    // HTML route to return a 404 for unmatched routes
    app.get('*', (req, res) => {
        res.render('404');
    });
};
