/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonComParser
 */

function AmazonComParser(){
    this.mainUrl = "//www.amazon." + AmazonComParser.zone;
    this.completionUrl = "//completion.amazon." + AmazonComParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=1";
    this.region = AmazonComParser.region;
    this.areYouAnAuthorPattern = "Are You an Author";
    this.free = 'free';
    this.currencySign = "$";
    this.currencySignForExport = "$";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 12;
    this.publisher = "Publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';

    this.estSalesScale = [
        {min: 1, max: 5, estSale: 60000 },
        {min: 6, max: 10, estSale: 52500 },
        {min: 11, max: 20, estSale: 45000 },
        {min: 21, max: 35, estSale: 37500 },
        {min: 36, max: 100, estSale: 27500 },
        {min: 101, max: 200, estSale: 15000 },
        {min: 201, max: 350, estSale: 6000 },
        {min: 351, max: 500, estSale: 3000 },
        {min: 501, max: 750, estSale: 2250 },
        {min: 751, max: 1500, estSale: 1650 },
        {min: 1501, max: 3000, estSale: 1275 },
        {min: 3001, max: 4000, estSale: 1050 },
        {min: 4001, max: 5000, estSale: 850 },
        {min: 5001, max: 6000, estSale: 750 },
        {min: 6001, max: 7000, estSale: 625 },
        {min: 7001, max: 8000, estSale: 500 },
        {min: 8001, max: 9000, estSale: 375 },
        {min: 9001, max: 10000, estSale: 300 },
        {min: 10001, max: 12000, estSale: 215 },
        {min: 12001, max: 15000, estSale: 175 },
        {min: 15001, max: 17500, estSale: 155 },
        {min: 17501, max: 20000, estSale: 142 },
        {min: 20001, max: 25000, estSale: 122 },
        {min: 25001, max: 30000, estSale: 100 },
        {min: 30001, max: 35000, estSale: 70 },
        {min: 35001, max: 50000, estSale: 55 },
        {min: 50001, max: 65000, estSale: 25 },
        {min: 65001, max: 80000, estSale: 12 },
        {min: 80001, max: 100000, estSale: 7 },
        {min: 100001, max: 200000, estSale: 2 },
        {min: 200001, max: 500000, estSale: 1 },
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonComParser.zone = "com";
AmazonComParser.region = "USA";

AmazonComParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonComParser.prototype.getDescription = function(jqNodes){
    var description = jqNodes.find("#bookDescription_feature_div noscript");
    if (description.length > 0) return $(description.text()).text().trim();

    return jqNodes.find("#outer_postBodyPS").text().trim();
};

AmazonComParser.prototype.getKindleEditionRow = function(jqNode) {
    var _this = this;
    var retval;
    jqNode.find(".tp").find("tr").each(function() {
        if($(this).text().indexOf(_this.searchPattern)>0)
            retval= $(this);
    });

    return retval;
};

AmazonComParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find(".tpType > a:first").attr("href");
};

AmazonComParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    var priceTag = kindleEditionRow.find(".toeOurPrice > a:first");
    if (priceTag.length > 0) return priceTag;
    return kindleEditionRow.find(".toeOurPriceWithRent > a:first");
};

AmazonComParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".reviewsCount > a:first").text();
};

AmazonComParser.prototype.parsePrice = function(price) {
    if(!price) return 0;
    if(price.toLowerCase() == this.free) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonComParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonComParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonComParser.prototype.getImageUrlSrc = function(responseText) {
    return Helper.parseString(responseText.find('#holderMainImage noscript').text(),"src=","\"", "\" ");
};

AmazonComParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length > 0)
        return $(rl_reviews).text().trim();

    rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('customer reviews','').replace('customer review','').trim() : "0";
};

AmazonComParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find(".arp-rating-out-of-text:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonComParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1);
};

AmazonComParser.prototype.getPrintLength = function(jqNodes) {
    var link = jqNodes.find('#aboutEbooksSection span a:first');
    if (link.length > 0)
        return parseInt(link.text()).toString();

    var text = jqNodes.find('#productDetailsTable .content li:contains(Print Length)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(text.length > 0){
        return parseInt(text[0].nodeValue).toString();
    }

    return null;
};

AmazonComParser.prototype.getAuthor = function(jqNodes) {
    var contributorNameId = jqNodes.find('#byline a.contributorNameID');
    if (contributorNameId.length > 0)
        return contributorNameId.text().trim();

    var link = jqNodes.find('#byline span.author a:first');
    if (link.length > 0)
        return link.text().trim();

    return null;
};

AmazonComParser.prototype.getPrice = function(jqNodes) {
    var node = jqNodes.find('#tmmSwatches .a-button-text span:contains("Kindle")').next().next();
    var priceNodes = $(node.find('.a-color-price')).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes !== 'undefined' && priceNodes.length !== 0) return priceNodes[0].nodeValue.trim();

    priceNodes = $(node.find('span')).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes === 'undefined' || priceNodes.length === 0) return null;

    return priceNodes[0].nodeValue.trim();
};
