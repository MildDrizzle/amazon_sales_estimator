/**
 * Created by Andrey Klochkov on 09.03.2015.
 * class AmazonFrParser
 */

function AmazonFrParser(){
    this.mainUrl = "//www.amazon." + AmazonFrParser.zone;
    // Amazon.fr uses api from amazon.co.uk
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=5&l=fr_FR";
    this.region = AmazonFrParser.region;
    this.areYouAnAuthorPattern = "Etes-vous un auteur";
    this.free = 'gratuit';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Editeur";
    this.searchKeys = [decodeURI(encodeURI("achat")),"louer"]; //à l'achat
    this.numberSign = decodeURI("n%C2%B0");
    this.searchPattern = "Format Kindle";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';

    this.estSalesScale = [
        {min: 1, max: 5, estSale: 7380 },
        {min: 6, max: 10, estSale: 6457 },
        {min: 11, max: 20, estSale: 5535 },
        {min: 21, max: 35, estSale: 4612 },
        {min: 36, max: 100, estSale: 3382 },
        {min: 101, max: 200, estSale: 1845 },
        {min: 201, max: 350, estSale: 738 },
        {min: 351, max: 500, estSale: 369 },
        {min: 501, max: 750, estSale: 276 },
        {min: 751, max: 1500, estSale: 203 },
        {min: 1501, max: 3000, estSale: 157 },
        {min: 3001, max: 4000, estSale: 129 },
        {min: 4001, max: 5000, estSale: 104 },
        {min: 5001, max: 6000, estSale: 92 },
        {min: 6001, max: 7000, estSale: 77 },
        {min: 7001, max: 8000, estSale: 61 },
        {min: 8001, max: 9000, estSale: 46 },
        {min: 9001, max: 10000, estSale: 37 },
        {min: 10001, max: 12000, estSale: 26 },
        {min: 12001, max: 15000, estSale: 21 },
        {min: 15001, max: 17500, estSale: 19 },
        {min: 17501, max: 20000, estSale: 17 },
        {min: 20001, max: 25000, estSale: 15 },
        {min: 25001, max: 30000, estSale: 12 },
        {min: 30001, max: 35000, estSale: 8 },
        {min: 35001, max: 50000, estSale: 6 },
        {min: 50001, max: 65000, estSale: 5 },
        {min: 65001, max: 80000, estSale: 3 },
        {min: 80001, max: 100000, estSale: 1 },
        {min: 100001, max: 200000, estSale: 1 },
        {min: 200001, max: 500000, estSale: 1 },
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonFrParser.zone = "fr";
AmazonFrParser.region = "FR";

AmazonFrParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonFrParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};

AmazonFrParser.prototype.getKindleEditionRow = function(jqNode) {
    var _this = this;
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf(_this.searchPattern)>0)
            retval= $(this);
    });

    return retval;
};

AmazonFrParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonFrParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonFrParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonFrParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonFrParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonFrParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#imgBlkFront').length !== 0 ?
        responseText.find('#imgBlkFront').attr('data-a-dynamic-image') :
        responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonFrParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('commentaires','').replace('commentaire','').replace('client', '').trim() : "0";
};

AmazonFrParser.prototype.getRating = function(responseText){
    var pattern = decodeURI(encodeURI("étoiles sur"));
    var ratingString = responseText.find("#revSum span:contains('" + pattern + "')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split(pattern)[0].trim();
};

AmazonFrParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("sur") != -1 ? totalSearchResult.indexOf("sur") + 4 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf(decodeURI(encodeURI("résultats"))) - 1);
};

AmazonFrParser.prototype.getPrintLength = function(jqNodes) {
    var printLengthNodes = jqNodes.find('#productDetailsTable .content li:contains(Nombre de pages)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof printLengthNodes !== 'undefined' && printLengthNodes.length > 0) return parseInt(printLengthNodes[0].nodeValue).toString();

    printLengthNodes = jqNodes.find('#aboutEbooksSection span a:first').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof printLengthNodes !== 'undefined' && printLengthNodes.length > 0) return parseInt(printLengthNodes[0].nodeValue).toString();

    return null;
};
