// dependancies
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');

// scraping tools
// TODO: request or axios
const axios = require('axios');
const cheerio = require('cheerio');

// models
const db = require('./models');

// port
const PORT = process.env.PORT || 3000;

// initialize Express
const app = express();

// set up Handlebars
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// ### CONFIGURE MIDDLEWARE ###

// use morgan logger for logging requests
app.use(logger('dev'));

// use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
    extended: true,
}));

// use express.static to serve the public folder as a static directory
app.use(express.static('public'));

// if deployed, use the heroku database, else use the local database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/mongoHeadlines';

// set mongoose to leverage the built in ES6 promises
// connect to the Mongo database
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// ### ROUTES ###

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

        // If we were able to successfully scrape and save an Article, send a message to the client
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
        _id: req.params.id,
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

// HTML route to return a 404 for unmatched routes
app.get('*', (req, res) => {
    res.render('404');
})

// start the server
app.listen(PORT, () => {
    console.log(`
    App is running on port ${PORT}
    `);
});
