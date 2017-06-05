/**
 * Created by Andrey Klochkov on 01.05.2015.
 * class AmazonEsParser
 */

function AmazonEsParser(){
    this.mainUrl = "//www.amazon." + AmazonEsParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=44551&l=es_ES";
    this.region = AmazonEsParser.region;
    this.free = 'gratis';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Editor";
    this.searchKeys = ["para comprar","to rent"];
    this.numberSign = decodeURI("n.%C2%B0");
    this.searchPattern = decodeURI(encodeURI("Versión Kindle"));
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';

    this.estSalesScale = [
        {min: 1, max: 5, estSale: 12240 },
        {min: 6, max: 10, estSale: 10710 },
        {min: 11, max: 20, estSale: 9180 },
        {min: 21, max: 35, estSale: 7650 },
        {min: 36, max: 100, estSale: 5610 },
        {min: 101, max: 200, estSale: 3060 },
        {min: 201, max: 350, estSale: 1224 },
        {min: 351, max: 500, estSale: 612 },
        {min: 501, max: 750, estSale: 459 },
        {min: 751, max: 1500, estSale: 336 },
        {min: 1501, max: 3000, estSale: 260 },
        {min: 3001, max: 4000, estSale: 214 },
        {min: 4001, max: 5000, estSale: 173 },
        {min: 5001, max: 6000, estSale: 153 },
        {min: 6001, max: 7000, estSale: 127 },
        {min: 7001, max: 8000, estSale: 102 },
        {min: 8001, max: 9000, estSale: 76 },
        {min: 9001, max: 10000, estSale: 61 },
        {min: 10001, max: 12000, estSale: 44 },
        {min: 12001, max: 15000, estSale: 35 },
        {min: 15001, max: 17500, estSale: 31 },
        {min: 17501, max: 20000, estSale: 29 },
        {min: 20001, max: 25000, estSale: 25 },
        {min: 25001, max: 30000, estSale: 20 },
        {min: 30001, max: 35000, estSale: 14 },
        {min: 35001, max: 50000, estSale: 11 },
        {min: 50001, max: 65000, estSale: 5 },
        {min: 65001, max: 80000, estSale: 2 },
        {min: 80001, max: 100000, estSale: 1 },
        {min: 100001, max: 200000, estSale: 1 },
        {min: 200001, max: 500000, estSale: 1 },
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonEsParser.zone = "es";
AmazonEsParser.region = "ES";

AmazonEsParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonEsParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};

// functions are used only on author page which doesn't exist on amazon.it site.
AmazonEsParser.prototype.getKindleEditionRow = function(jqNode) {};
AmazonEsParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {};
AmazonEsParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {};
AmazonEsParser.prototype.getReviewsCountFromResult = function(resultItem) {};

AmazonEsParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonEsParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonEsParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonEsParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find('#summaryStars a').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof rl_reviews === 'undefined' || rl_reviews.length == 0) return '0';
    return rl_reviews[1].nodeValue.replace('opiniones','').replace(decodeURI("opini%C3%B3n"),'').trim();
};

AmazonEsParser.prototype.getRating = function(responseText){
    var pattern = decodeURI(encodeURI("de un máximo de"));
    var ratingString = responseText.find("#avgRating span:contains('" + pattern + "')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split(pattern)[0].trim();
};

AmazonEsParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("de") != -1 ? totalSearchResult.indexOf("de") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("resultados para") - 1);
};

AmazonEsParser.prototype.getPrintLength = function(jqNodes) {
    var printLength = jqNodes.find('#productDetailsTable .content li:contains(Longitud de impresi)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(printLength.length > 0){
        return parseInt(printLength[0].nodeValue).toString();
    }
    return null;
};

AmazonEsParser.prototype.getPrice = function(jqNodes) {
    var priceNodes = $(jqNodes.find('#buybox .kindle-price td')[1]).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes !== 'undefined' && priceNodes.length > 0) return priceNodes[0].nodeValue.trim();

    priceNodes = $(jqNodes.find('#tmmSwatches .a-button-text span:contains("Kindle")').next().next().find('.a-color-price')).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes === 'undefined' || priceNodes.length == 0) return null;
    return priceNodes[0].nodeValue.trim();
};

AmazonEsParser.prototype.getSalesRank = function(jqNodes) {
    var salesRankNodes = jqNodes.find("#SalesRank").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof salesRankNodes === 'undefined' || salesRankNodes.length < 2) return '0';
    var salesRankString = salesRankNodes[1].nodeValue.trim();
    if ((typeof salesRankString === 'undefined') || (salesRankString == "")) return '0';
    return salesRankString.substring(salesRankString.indexOf(this.numberSign) + this.numberSign.length, salesRankString.indexOf('de'));
};

