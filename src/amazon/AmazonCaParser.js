/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonCaParser
 */

function AmazonCaParser(){
    this.mainUrl = "//www.amazon." + AmazonCaParser.zone;
    // Amazon.ca uses api from amazon.com
    this.completionUrl = "//completion.amazon." + AmazonComParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=7";
    this.region = AmazonCaParser.region;
    this.free = 'free';
    this.currencySign = "$";
    this.currencySignForExport = "$";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';

    this.estSalesScale = [
        {min: 1, max: 5, estSale: 25200 },
        {min: 6, max: 10, estSale: 22050 },
        {min: 11, max: 20, estSale: 18900 },
        {min: 21, max: 35, estSale: 15750 },
        {min: 36, max: 100, estSale: 11550 },
        {min: 101, max: 200, estSale: 6300 },
        {min: 201, max: 350, estSale: 2520 },
        {min: 351, max: 500, estSale: 1260 },
        {min: 501, max: 750, estSale: 945 },
        {min: 751, max: 1500, estSale: 693 },
        {min: 1501, max: 3000, estSale: 535 },
        {min: 3001, max: 4000, estSale: 441 },
        {min: 4001, max: 5000, estSale: 357 },
        {min: 5001, max: 6000, estSale: 315 },
        {min: 6001, max: 7000, estSale: 262 },
        {min: 7001, max: 8000, estSale: 210 },
        {min: 8001, max: 9000, estSale: 157 },
        {min: 9001, max: 10000, estSale: 126 },
        {min: 10001, max: 12000, estSale: 90 },
        {min: 12001, max: 15000, estSale: 73 },
        {min: 15001, max: 17500, estSale: 65 },
        {min: 17501, max: 20000, estSale: 60 },
        {min: 20001, max: 25000, estSale: 51 },
        {min: 25001, max: 30000, estSale: 42 },
        {min: 30001, max: 35000, estSale: 29 },
        {min: 35001, max: 50000, estSale: 23 },
        {min: 50001, max: 65000, estSale: 10 },
        {min: 65001, max: 80000, estSale: 5 },
        {min: 80001, max: 100000, estSale: 3 },
        {min: 100001, max: 200000, estSale: 1 },
        {min: 200001, max: 500000, estSale: 1 },
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonCaParser.zone = "ca";
AmazonCaParser.region = "CA";

AmazonCaParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonCaParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find(".productDescriptionWrapper").text().trim();
};

// functions are used only on author page which doesn't exist on amazon.ca site.
AmazonCaParser.prototype.getKindleEditionRow = function() {};
AmazonCaParser.prototype.getUrlFromKindleEditionRow = function() {};
AmazonCaParser.prototype.getPriceFromKindleEditionRow = function() {};
AmazonCaParser.prototype.getReviewsCountFromResult = function() {};

AmazonCaParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonCaParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonCaParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonCaParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('customer reviews','').replace('customer review','').trim() : "0";
};

AmazonCaParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonCaParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1);
};

AmazonCaParser.prototype.getPrintLength = function(jqNodes) {
    var text = jqNodes.find('#productDetailsTable .content li:contains(Print Length)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(text.length > 0){
        return parseInt(text[0].nodeValue).toString();
    }

    return null;
};
