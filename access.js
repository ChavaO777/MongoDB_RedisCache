module.exports.saveBook = function (db, title, author, text, callback) {
    db.collection('text').save({
        title: title,
        author: author,
        text: text
    }, callback);
};

module.exports.findBookByTitle = function (db, title, callback) {
    db.collection('text').findOne({
        title: title
    }, function (err, doc) {
        if (err || !doc)
            callback(null);
        else
            callback(doc.text);
    });
};

module.exports.findBookByTitleCached = function (db, redis, title, callback) {

    // First, check whether the book exists in the Redis cache
    redis.get(title, function (err, reply) {
        
        if (err)
            callback(null);
        
        else if (reply) 
            // The book exists in the Redis cache
            callback(JSON.parse(reply));
        
        else {
            
            // The book doesn't exist in the cache
            // A query to the main database is required.
            db.collection('text').findOne({
                title: title
            }, function (err, doc) {
                if (err || !doc)
                    callback(null);
                else {
                    
                    // Book found in database, save to the Redis cache and
                    // return to client
                    redis.set(title, JSON.stringify(doc), function () {
                        callback(doc);
                    });
                }
            });
        }
    });
};

module.exports.updateBookByTitle = function (db, redis, title, newText, callback) {
    db.collection("text").findAndModify({
        title: title
    }, {
        $set: {
            text: text
        }
    }, function (err, doc) { //Update the main database
        if (err)
            callback(err);
        else if (!doc)
            callback('Book not found');
        else {
            //Save new book version to cache
            redis.set(title, JSON.stringify(doc), function (err) {
                if (err)
                    callback(err);
                else
                    callback(null);
            });
        }
    });
};