const mongoose = require('mongoose');

// create reference to the Schema constructor
const Schema = mongoose.Schema;

// create a new object using the constructor
const ArticleSchema = new Schema({
    // the headline of the article
    title: {
        type: String,
        required: true,
        unique: true,
    },
    excerpt: {
        type: String,
        required: true,
    },
    // the URL to the full article
    link: {
        type: String,
        required: true,
    },
    // user-created text stored on an article
    note: {
        type: Schema.Types.ObjectId,
        ref: 'Note',
    },
});

// create a model using the schema defined above
const Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;
