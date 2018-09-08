// dependancies
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');

// scraping tools
const request = require('request');
const cheerio = require('cheerio');

// models
const db = require('./models');

// port
const PORT = process.env.PORT || 3000;

// initialize Express
const app = express();

// set up Handlebars
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views/layouts/partials')
}));
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

// TODO: update routes
// GET route to scrape articles
app.get('/scrape', (req, res) => {
    // get the HTML body with request
    axios.get('https://arstechnica.com').then((response) => {
        // load the HTML into cheerio and set to the $ selector
        const $ = cheerio.load(response.data);

        $('article.tease').each((i, element) => {
            const link = $(element).find('header').find('h2').find('a')
                .attr('href');
            const title = $(element).find('header').find('h2').find('a')
                .text();
            const excerpt = $(element).find('header').find('.excerpt')
                .text();

            db.ars.insert({
                title,
                link,
                excerpt,
            });
        });

        // Now, we grab every h2 within an article tag, and do the following:
        $('article h2').each((i, element) => {
            // Save an empty result object
            const result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this)
                .children('a')
                .text();
            result.link = $(this)
                .children('a')
                .attr('href');

            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then((dbArticle) => {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch((error) => {
                    return res.json(error);
                });
        });

        // If we were able to successfully scrape and save an Article, send a message to the client
        res.send('Scrape Complete');
    });
});

// Route for getting all Articles from the db
app.get('/articles', (req, res) => {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then((dbArticle) => {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch((error) => {
            res.json(error);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get('/articles/:id', (req, res) => {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({
        _id: req.params.id,
    })
        // ..and populate all of the notes associated with it
        .populate('note')
        .then((dbArticle) => {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch((error) => {
            res.json(error);
        });
});

// Route for saving/updating an Article's associated Note
app.post('/articles/:id', (req, res) => {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then((dbNote) => {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({
                _id: req.params.id,
            }, {
                note: dbNote._id,
            }, {
                new: true,
            });
        })
        .then((dbArticle) => {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch((error) => {
            res.json(error);
        });
});
// the above routes are still in a TODO state

// start the server
app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
