var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var app = express();
var bodyParser = require('body-parser');
var mongoUrl = 'mongodb://localhost:27017';

var redisClient = require('redis').createClient;
var redis = redisClient(6379, "localhost");

var access = require('./access.js');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

MongoClient.connect(mongoUrl, function(err, db) {

    if(err)
        throw 'Error in the database connection - ' + err;

    app.post('/book', function(req, res) {

        if(!req.body.title || !req.body.author)
            res.status(400).send("Error: each book must contain both an author and a title.");

        else if(!req.body.text)
            res.status(400).send("Error: each book must contain some text.");

        else{

            access.saveBook(db, req.body.title, req.body.author, req.body.text, function(err) {

                if(err)
                    res.status(500).send("Server error.");

                else 
                    res.status(201).send("The book was successfully saved.");
            });
        }
    });

    app.get('/book/:title', function(req, res) {

        if(!req.params.title)
            res.status(400).send("A title must be included in the URL. Try again.");

        else {

            access.findBookByTitleCached(db, redis, req.params.title, function(book) {

                if(!book)
                    res.status(500).send("Server error");

                else
                    res.status(200).send(book);
            });
        }
    });

    app.put('/book/:title', function(req, res){


        if(!req.params.title)
            res.status(400).send("Error: a book title must be specified.");

        else if(!req.params.text)
            res.status(400).send("Error: the updated text of the book must be specified.");

        else{

            access.updateBookByTitle(db, redis, req.params.title, req.params.text, function(err) {

                if(err == "Book not found")
                    res.status(404).send("Book not found");

                else if(err)
                    res.status(500).send("Server error");

                else
                    res.status(200).send("The book was successfully updated.");
            });
        }
    });

    app.listen(8080, function() {
        console.log('Listening on port 8080');
    });
});