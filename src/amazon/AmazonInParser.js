/**
 * Created by Andrey Klochkov on 22.10.2015.
 * class AmazonInParser
 */

function AmazonInParser(){
    this.mainUrl = "//www.amazon." + AmazonInParser.zone;
    // Amazon.in uses api from amazon.co.uk
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=44571";
    this.region = AmazonInParser.region;
    this.free = 'free';
    this.currencySign = "\u20A8";
    this.currencySignForExport = "\u20A8";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';

    this.estSalesScale = [
        {min: 1, max: 5, estSale: 15000 },
        {min: 6, max: 10, estSale: 13125 },
        {min: 11, max: 20, estSale: 11250 },
        {min: 21, max: 35, estSale: 9375 },
        {min: 36, max: 100, estSale: 6875 },
        {min: 101, max: 200, estSale: 3750 },
        {min: 201, max: 350, estSale: 1500 },
        {min: 351, max: 500, estSale: 750 },
        {min: 501, max: 750, estSale: 562 },
        {min: 751, max: 1500, estSale: 412 },
        {min: 1501, max: 3000, estSale: 319 },
        {min: 3001, max: 4000, estSale: 262 },
        {min: 4001, max: 5000, estSale: 212 },
        {min: 5001, max: 6000, estSale: 187 },
        {min: 6001, max: 7000, estSale: 156 },
        {min: 7001, max: 8000, estSale: 125 },
        {min: 8001, max: 9000, estSale: 94 },
        {min: 9001, max: 10000, estSale: 75 },
        {min: 10001, max: 12000, estSale: 54 },
        {min: 12001, max: 15000, estSale: 44 },
        {min: 15001, max: 17500, estSale: 39 },
        {min: 17501, max: 20000, estSale: 35 },
        {min: 20001, max: 25000, estSale: 30 },
        {min: 25001, max: 30000, estSale: 25 },
        {min: 30001, max: 35000, estSale: 17 },
        {min: 35001, max: 50000, estSale: 14 },
        {min: 50001, max: 65000, estSale: 6 },
        {min: 65001, max: 80000, estSale: 3 },
        {min: 80001, max: 100000, estSale: 2 },
        {min: 100001, max: 200000, estSale: 1 },
        {min: 200001, max: 500000, estSale: 1 },
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonInParser.zone = "in";
AmazonInParser.region = "IN";

AmazonInParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonInParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};

AmazonInParser.prototype.getKindleEditionRow = function(jqNode) { //??
    var _this = this;
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf(_this.searchPattern)>0)
            retval= $(this);
    });

    return retval;
};

AmazonInParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonInParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonInParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonInParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonInParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonInParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#imgBlkFront').length !== 0 ?
        responseText.find('#imgBlkFront').attr('data-a-dynamic-image') :
        responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonInParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('customer reviews','').replace('customer review','').trim() : "0";
};

AmazonInParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonInParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1);
};

AmazonInParser.prototype.getPrintLength = function(jqNodes) {
    var text = jqNodes.find('#productDetailsTable .content li:contains(Print Length)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(text.length > 0){
        return parseInt(text[0].nodeValue).toString();
    }
    return null;
};

AmazonInParser.prototype.getPrice = function(jqNodes) {
    var priceNodes = $(jqNodes.find('#buybox .kindle-price td')[1]).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes !== 'undefined' && priceNodes.length > 0) return priceNodes[1].nodeValue.trim();

    priceNodes = jqNodes.find('#priceBlock b.priceLarge span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof priceNodes === 'undefined' || priceNodes.length == 0) return '';
    return priceNodes[0].nodeValue.trim();
};