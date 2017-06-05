/**
 * Created by Andrey Klochkov on 04.05.15.
 */

function SingleBookPage(){
    if ( AuthorSearchResultsPage.prototype._singletonInstance )
        return AuthorSearchResultsPage.prototype._singletonInstance;
    AuthorSearchResultsPage.prototype._singletonInstance = this;

    this.name = SingleBookPage.name;
}

SingleBookPage.name = 'single';

SingleBookPage.prototype.loadData = function(pullingToken, siteParser, parentUrl, search, pageNumber, callback){
    callback = Helper.valueOrDefault(callback, function(){});
    return callback();
};