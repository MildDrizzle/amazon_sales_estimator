/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonCoUkParser
 */

function AmazonCoUkParser(){
    this.mainUrl = "//www.amazon." + AmazonCoUkParser.zone;
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=3";
    this.region = AmazonCoUkParser.region;
    this.areYouAnAuthorPattern = "Are You an Author";
    this.free = 'free';
    this.currencySign = "&pound;";
    this.currencySignForExport = "\u00A3";
    this.thousandSeparator = ",";
    this.decimalSeparator = ".";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';

    this.estSalesScale = [
        {min: 1, max: 5, estSale: 27000 },
        {min: 6, max: 10, estSale: 23625 },
        {min: 11, max: 20, estSale: 20250 },
        {min: 21, max: 35, estSale: 16875 },
        {min: 36, max: 100, estSale: 12375 },
        {min: 101, max: 200, estSale: 6750 },
        {min: 201, max: 350, estSale: 2700 },
        {min: 351, max: 500, estSale: 1350 },
        {min: 501, max: 750, estSale: 1012 },
        {min: 751, max: 1500, estSale: 742 },
        {min: 1501, max: 3000, estSale: 573 },
        {min: 3001, max: 4000, estSale: 472 },
        {min: 4001, max: 5000, estSale: 382 },
        {min: 5001, max: 6000, estSale: 337 },
        {min: 6001, max: 7000, estSale: 281 },
        {min: 7001, max: 8000, estSale: 225 },
        {min: 8001, max: 9000, estSale: 168 },
        {min: 9001, max: 10000, estSale: 135 },
        {min: 10001, max: 12000, estSale: 96 },
        {min: 12001, max: 15000, estSale: 78 },
        {min: 15001, max: 17500, estSale: 69 },
        {min: 17501, max: 20000, estSale: 64 },
        {min: 20001, max: 25000, estSale: 55 },
        {min: 25001, max: 30000, estSale: 45 },
        {min: 30001, max: 35000, estSale: 31 },
        {min: 35001, max: 50000, estSale: 24 },
        {min: 50001, max: 65000, estSale: 11 },
        {min: 65001, max: 80000, estSale: 6 },
        {min: 80001, max: 100000, estSale: 3 },
        {min: 100001, max: 200000, estSale: 1 },
        {min: 200001, max: 500000, estSale: 1 },
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonCoUkParser.zone = "co.uk";
AmazonCoUkParser.region = "UK";

AmazonCoUkParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonCoUkParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#outer_postBodyPS").text().trim();
};

AmazonCoUkParser.prototype.getKindleEditionRow = function(jqNode) {
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0)
            retval= $(this);
        else if($(this).text().indexOf("Kindle Purchase")>0)
            retval= $(this);
    });

    return retval;
};

AmazonCoUkParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonCoUkParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonCoUkParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonCoUkParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonCoUkParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonCoUkParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonCoUkParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#summaryStars a").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof rl_reviews === 'undefined' || rl_reviews.length == 0) return '0';
    return rl_reviews[1].nodeValue.replace('reviews','').replace('review','').replace('customer','').trim();
};

AmazonCoUkParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonCoUkParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1).replace(/[^0-9]/g, '');
};

AmazonCoUkParser.prototype.getPrintLength = function(responseText){
    var printLengthNodes = responseText.find("#productDetailsTable li:contains('Print Length:')").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof printLengthNodes === 'undefined' || printLengthNodes.length == 0) return '';
    return printLengthNodes[0].nodeValue.replace('pages','').trim();
};

AmazonCoUkParser.prototype.getPrice = function(responseText){
    var price = responseText.find(".swatchElement:contains('Kindle Edition') .a-button-inner .a-color-price");
    if(typeof price === 'undefined' || price.length == 0) return '';
    return price.text().trim();
};

AmazonCoUkParser.prototype.getAuthor = function(responseText){
    var author = responseText.find(".author .contributorNameID");
    if(typeof author === 'undefined' || author.length == 0) return '';
    return author.text().trim();
};