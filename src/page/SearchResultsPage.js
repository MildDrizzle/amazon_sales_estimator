/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function SearchResultsPage(){
    if ( SearchResultsPage.prototype._singletonInstance )
        return SearchResultsPage.prototype._singletonInstance;
    SearchResultsPage.prototype._singletonInstance = this;

    this.name = SearchResultsPage.name;
    this.searchResultsPager = undefined;
    this.searchKeyword = undefined;
}

SearchResultsPage.name = 'search';

SearchResultsPage.prototype.loadData = function(pullingToken, siteParser, parentUrl, search, pageNumber, callback){
    callback = Helper.valueOrDefault(callback, function(){});
    var _this = this;
    var itemsPerPage = siteParser.searchResultsNumber;
    this.searchKeyword = search;

    if (typeof this.searchResultsPager === 'undefined') {
        this.searchResultsPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, parentUrl){
            var jqResponseText = Helper.parseHtmlToJquery(responseText);
            return new SearchPageParser().parsePage(pullingToken, startFromIndex, maxResults, jqResponseText, parentUrl, search, siteParser, "Search");
        }, function(url, page){
            return url + '&page=' + page;
        });
    }

    this.searchResultsPager.loadNextPage(parentUrl, callback);
};