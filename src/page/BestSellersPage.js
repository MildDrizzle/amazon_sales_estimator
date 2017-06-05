/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function BestSellersPage(){
    if ( BestSellersPage.prototype._singletonInstance )
        return BestSellersPage.prototype._singletonInstance;
    BestSellersPage.prototype._singletonInstance = this;

    this.name = BestSellersPage.name;
}

BestSellersPage.name = 'best-seller';

BestSellersPage.prototype.loadData = function(pullingToken, siteParser, parentUrl, search, pageNumber, callback){
    callback = Helper.valueOrDefault(callback, function(){});
    var _this = this;
    var pageUrl = parentUrl + "?pg=" + pageNumber;
    if(Helper.isTop100Free())
        pageUrl += '&tf=1';
    $.get(pageUrl, function(responseText){
        // no need jQuery here: // var jqResponseText = parseHtmlToJquery(responseText);
        _this.parsePage(pullingToken, siteParser, responseText, parentUrl);
        return callback();
    });
};

BestSellersPage.prototype.parsePage = function(pullingToken, siteParser, responseText, parentUrl){
    var patternStart = siteParser.bestSellersPatternStart;
    var patternEnd = siteParser.bestSellersPatternEnd;
    var str = responseText;
    var pos = str.indexOf(patternStart);

    var no = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var index = 0;
    var bIsExist = [];
    category = this.getCategoryInfo(str).trim();

    while (pos >= 0)
    {
        str = str.substr(pos + patternStart.length);
        var item = str.substring(0, str.indexOf(patternEnd));

        no[index] = this.getNoInfo(item);
        url[index] = Helper.getUrlWORedirect(this.getPageUrl(item));
        price[index] = this.getPriceInfo(item);
        review[index] = this.getReviewInfo(item);

        pos = str.indexOf(patternStart);
        index++;
    }

    url.forEach(function(item, i) {
        if (typeof url[i] !== 'undefined'){
            kindleSpy.parserAsyncRunner.start(function(callback){
                function wrapper(){
                    kindleSpy.parseDataFromBookPageAndSend(pullingToken, no[i], url[i], price[i], parentUrl, "", review[i], category, "Seller", callback);
                }
                setTimeout(wrapper, i*1000);
            })
        }
    });
};

BestSellersPage.prototype.getCategoryInfo = function(responseText){
    return Helper.parseString(responseText, 'class="category"', '>', '<');
};

BestSellersPage.prototype.getNoInfo = function(responseText){
    return Helper.parseString(responseText, 'class="zg_rankNumber"', ">", ".");
};

BestSellersPage.prototype.getPriceInfo = function(responseText){
    return Helper.parseString(responseText,"class='p13n-sc-price'", ">", "<");
};

BestSellersPage.prototype.getPageUrl = function(responseText){
    var url = Helper.parseString(responseText, 'class="zg_title"', 'href="', '"');
    if (!!url) return url;

    url = Helper.parseString(responseText, 'class="a-link-normal"', 'href="', '"');
    return location.origin + url;
};

BestSellersPage.prototype.getReviewInfo = function(responseText){
    var pattern = "href";
    var str = responseText;
    var pos = str.indexOf(pattern);

    var review = "";

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        review = Helper.parseString(str, "product-reviews", '>', '<');
        if (typeof review !== 'undefined' && review.length > 0) return review;

        pos = str.indexOf(pattern);
    }

    return null;
};