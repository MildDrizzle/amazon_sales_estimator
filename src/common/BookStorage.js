/**
 * Created by Andrey Klochkov on 11.10.2014.
 */

function BookStorage() {
    if ( BookStorage.prototype._singletonInstance )
        return BookStorage.prototype._singletonInstance;
    BookStorage.prototype._singletonInstance = this;

    this._storage = Api.storage;
}

BookStorage.debug = false;
BookStorage.lockStorage = false;

var bookDataExample = {
    url: 'http://book.url',
    trackingEnabled: true,
    title: 'test title',
    description: 'test description',
    author: 'A. Lastname',
    image: 'http://url.to/image.png', // not yet available
    currentSalesRank: 2233,
    price: '$7.95',
    pages: 131, // Print length
    estSales: 2233,
    estSalesRev: '$7,000.00',
    numberOfReviews: 31,
    salesRankData: [
        {date: Date.UTC(2014, 11, 9), salesRank: '100'},
        {date: Date.UTC(2014, 11, 10), salesRank: '110'}
    ]
};

/**
 * Empty storage
 */
BookStorage.prototype.clear = function () {
    this._storage.clear();
};

/**
 * Enable tracking for the book
 * @param bookUrl
 * @param {function=} callback function() {...}
 */
BookStorage.prototype.enableTracking = function(bookUrl, callback) {
    callback = Helper.valueOrDefault(callback, function() {});
    var _this = this;
    // search url in storage
    this.getBook(bookUrl, function(bookData) {
        var changeStatus = function(bookData){
            // change status to tracking
            bookData.trackingEnabled = true;
            // update data
            _this.updateBookInStorage(bookUrl, bookData, callback);
        };

        if (typeof bookData !== 'undefined') {
            changeStatus(bookData);
            return;
        }

        // if not found, add new item to storage
        _this.initBookFromUrl(bookUrl, changeStatus);
    });
};

/**
 * Disable tracking for the book
 * @param bookUrl
 * @param {function=} callback function(bytesInUse) {...}
 */
BookStorage.prototype.disableTracking = function(bookUrl, callback) {
    callback = Helper.valueOrDefault(callback, function() {});
    var _this = this;
    // search url in storage
    this.getBook(bookUrl, function(bookData) {
        if (typeof bookData === 'undefined') return;
        // change status to not-tracking
        bookData.trackingEnabled = false;
        _this.updateBookInStorage(bookUrl, bookData, callback);
    });
};

/**
 * Takes a book from the storage and returns it
 * If not found, grabs data from the page
 * @param bookUrl
 * @param callback function(object bookData) {...};
 */
BookStorage.prototype.getBook = function(bookUrl, callback) {
    var _this = this;
    this._storage.get('trackingData', function(items) {
        if (typeof items !== 'undefined' && typeof items.trackingData !== 'undefined') {
            var index = _this.findUrlIndex(items.trackingData, bookUrl);
            return callback(items.trackingData[index]);
        }

        return callback(undefined);
    });
};

BookStorage.prototype.initBookFromUrl = function(bookUrl, callback) {
    var bookParser = new BookPageParser(bookUrl);
    bookParser.getBookData(bookUrl, null, null, function(book){
        var bookData = {
            url: bookUrl,
            trackingEnabled: false,
            title: book.title,
            description: book.description,
            author: book.author,
            image: book.imageUrl,
            currentSalesRank: book.salesRank,
            price: book.price,
            formattedPrice: book.formattedPrice,
            pages: book.printLength,
            estSales: book.estSale,
            estSalesRev: book.salesRecv,
            numberOfReviews: book.reviews,
            salesRankData: [
                {date: new Date().setHours(0,0,0,0), salesRank: book.salesRank}
            ]
        };
        callback(bookData);
    });
};

/**
 * Returns all books from the storage
 * @param {function} callback function(object bookData) {...};
 */
BookStorage.prototype.getAllBooks = function(callback) {
    this._storage.get('trackingData', function(items) {
        if (typeof items !== 'undefined' && typeof items.trackingData !== 'undefined') {
            return callback(items.trackingData);
        }

        return callback([]);
    });
};

BookStorage.prototype.findUrlIndex = function(trackingData, url) {
    for (var i = 0; i < trackingData.length; i++) {
        if (trackingData[i].url.indexOf(Helper.trimCurrentUrl(url)) === 0) {
            return i;
        }
    }

    return undefined;
};

/**
 * Inserts or updates a book in the storage with new bookData object
 * @param bookUrl
 * @param bookData
 * @param callback function(integer bytesInUse) {...};
 */
BookStorage.prototype.updateBookInStorage = function(bookUrl, bookData, callback) {
    callback = Helper.valueOrDefault(callback, function(){});
    var _this = this;
    if (BookStorage.lockStorage)
        return setTimeout(_this.updateBookInStorage.bind(_this, bookUrl, bookData, callback), 100);
    
    BookStorage.lockStorage = true;

    this._storage.get('trackingData', function(items) {
        if (typeof items === 'undefined') items = {};
        if (typeof items.trackingData === 'undefined') items.trackingData = [];
        var index = _this.findUrlIndex(items.trackingData, bookUrl);
        if (typeof index === 'undefined') {
            items.trackingData.push(bookData);
        }else{
            items.trackingData[index] = bookData;
        }

        _this._storage.set(items, function(bytesInUse){
            BookStorage.lockStorage = false;
            callback(bytesInUse);
        });
    });
};

/**
 * Scans all books and fill them with today's data
 */
BookStorage.prototype.trackData = function () {
    var _this = this;
    this._storage.get('lastUpdate', function(result) {
        if (typeof result === 'undefined') result = {};
        if (typeof result.lastUpdate === 'undefined') result.lastUpdate = 0;
        var dateDiffMillis = Date.now() - Number(result.lastUpdate);
        // if previous update was < 1h ago then do nothing
        if (dateDiffMillis / 1000 / 60 / 60 < 1 && !BookStorage.debug) {
            return;
        }
        _this._storage.set({lastUpdate:Date.now()}, function(bytesInUse) {
            _this.getAllBooks(function(/** Array */ books) {
                if (typeof books === 'undefined') return;
                var today = new Date().setHours(0,0,0,0);
                // iterate through all tracked books
                books.forEach(function(book) {
                    // if the last data is not from today
                    for (var i=0;i<book.salesRankData.length;i++) {
                        if (!book.trackingEnabled
                            || (book.salesRankData[i].date === today && !BookStorage.debug)) {
                            return;
                        }
                    }

                    // add the today's day data
                    var bookParser = new BookPageParser(book.url);
                    bookParser.getSalesRankFromUrl(book.url, function(salesRank, price, formattedPrice){
                        book.currentSalesRank = salesRank;
                        book.price = price;
                        book.formattedPrice = formattedPrice;
                        book.salesRankData.push({
                            date: today,
                            salesRank: salesRank
                        });
                        _this.updateBookInStorage(book.url, book);
                    });
                });
            });
        });
    });
};

/**
 * Returns number of books from the storage
 * @param {function} callback function(object bookData) {...};
 */
BookStorage.prototype.getNumberOfBooks = function(callback) {
    this._storage.get('trackingData', function(items) {
        if (typeof items !== 'undefined' && typeof items.trackingData !== 'undefined') {
            return callback(items.trackingData.length);
        }

        return callback(undefined);
    });
};

/**
 * Remove tracked book in the storage by Url
 * @param bookUrl
 * @param callback function(integer bytesInUse) {...};
 */
BookStorage.prototype.removeBookInStorage = function(bookUrl, callback) {
    var _this = this;
    this._storage.get('trackingData', function(items) {
        if (typeof items === 'undefined') return;
        if (typeof items.trackingData === 'undefined') return;
        var index = _this.findUrlIndex(items.trackingData, bookUrl);
        if (typeof index !== 'undefined')
            items.trackingData.splice(index, 1);
        _this._storage.set(items, callback);
    });
};
