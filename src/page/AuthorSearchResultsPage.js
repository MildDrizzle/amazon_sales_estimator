/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function AuthorSearchResultsPage(){
    if ( AuthorSearchResultsPage.prototype._singletonInstance )
        return AuthorSearchResultsPage.prototype._singletonInstance;
    AuthorSearchResultsPage.prototype._singletonInstance = this;

    this.name = AuthorSearchResultsPage.name;
    this.authorSearchResultsPager = undefined;
}

AuthorSearchResultsPage.name = 'author-search';

AuthorSearchResultsPage.prototype.loadData = function(pullingToken, siteParser, parentUrl, search, pageNumber, callback){
    callback = Helper.valueOrDefault(callback, function(){});
    var _this = this;
    var itemsPerPage = siteParser.authorResultsNumber;
    if (typeof _this.authorSearchResultsPager === 'undefined') {
        _this.authorSearchResultsPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, parentUrl){
            var jqResponseText = Helper.parseHtmlToJquery(responseText);
            var category = jqResponseText.find("#s-result-count > span > span").text().trim().replace(/"/g,'');
            return new SearchPageParser().parsePage(pullingToken, startFromIndex, maxResults, jqResponseText, parentUrl, category, siteParser, "Author");
        }, function(url, page){
            return url + '&page=' + page;
        });
    }
    setTimeout(this.authorSearchResultsPager.loadNextPage.bind(this.authorSearchResultsPager, parentUrl, callback), 1000);
};