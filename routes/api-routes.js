const db = require('../models');

module.exports = (app) => {
    // GET route to scrape articles
    app.get('/scrape', (req, res) => {
        // get the HTML body with request
        axios.get('https://arstechnica.com').then((response) => {
            // load the HTML into cheerio and set to the $ selector
            const $ = cheerio.load(response.data);

            $('article.tease').each((i, element) => {
                // declare an empty result object to be filled with an article
                let result = {};

                result.link = $(element)
                    .find('header')
                    .find('h2')
                    .find('a')
                    .attr('href');
                result.title = $(element)
                    .find('header')
                    .find('h2')
                    .find('a')
                    .text();
                result.excerpt = $(element)
                    .find('header')
                    .find('.excerpt')
                    .text();

                db.Article.create(result)
                    .then((dbArticle) => {
                        console.log(dbArticle);
                    })
                    .catch(error => res.json(error));
            });

            // if scrape was successful, send a message to the client
            res.send('Scrape complete');
        });
    });

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

    // GET route for retrieving a specific Article by ID, populate it with its note
    app.get('/api/articles/:id', (req, res) => {
        // use :id param to query database for a matching article
        db.Article.findOne({
            id: req.params.id,
        })
            // ..and populate all of the notes associated with it
            .populate('note')
            .then((dbArticle) => {
                // if an article with matching _id is found, send it back to the client
                res.json(dbArticle);
            })
            .catch((error) => {
                res.json(error);
            });
    });

    // POST route for saving or updating the note associated to an article
    app.post('/api/articles/:id', (req, res) => {
        // Create a new note and pass the req.body to the entry
        db.Note.create(req.body)
            .then((dbNote) => {
                // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
                return db.Article.findOneAndUpdate({
                    _id: req.params.id,
                }, {
                    note: dbNote._id,
                }, {
                    // return the modified document, not the original
                    new: true,
                });
            })
            // Mongoose query returns a promise, so `.then` receives result
            .then((dbArticle) => {
                // If we were able to successfully update an Article, send it back to the client
                res.json(dbArticle);
            })
            .catch((error) => {
                res.json(error);
            });
    });
};
