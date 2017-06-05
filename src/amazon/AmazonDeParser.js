/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonComParser
 */

function AmazonDeParser(){
    this.mainUrl = "//www.amazon." + AmazonDeParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=4";
    this.region = AmazonDeParser.region;
    this.areYouAnAuthorPattern = "Sind Sie ein Autor";
    this.free = 'gratis';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Verlag";
    this.searchKeys = ["kaufen","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';

    this.estSalesScale = [
        {min: 1, max: 5, estSale: 10200 },
        {min: 6, max: 10, estSale: 8925 },
        {min: 11, max: 20, estSale: 7650 },
        {min: 21, max: 35, estSale: 6375 },
        {min: 36, max: 100, estSale: 4675 },
        {min: 101, max: 200, estSale: 2550 },
        {min: 201, max: 350, estSale: 1020 },
        {min: 351, max: 500, estSale: 510 },
        {min: 501, max: 750, estSale: 382 },
        {min: 751, max: 1500, estSale: 280 },
        {min: 1501, max: 3000, estSale: 216 },
        {min: 3001, max: 4000, estSale: 178 },
        {min: 4001, max: 5000, estSale: 144 },
        {min: 5001, max: 6000, estSale: 127 },
        {min: 6001, max: 7000, estSale: 106 },
        {min: 7001, max: 8000, estSale: 85 },
        {min: 8001, max: 9000, estSale: 63 },
        {min: 9001, max: 10000, estSale: 51 },
        {min: 10001, max: 12000, estSale: 36 },
        {min: 12001, max: 15000, estSale: 29 },
        {min: 15001, max: 17500, estSale: 26 },
        {min: 17501, max: 20000, estSale: 24 },
        {min: 20001, max: 25000, estSale: 21 },
        {min: 25001, max: 30000, estSale: 17 },
        {min: 30001, max: 35000, estSale: 12 },
        {min: 35001, max: 50000, estSale: 9 },
        {min: 50001, max: 65000, estSale: 4 },
        {min: 65001, max: 80000, estSale: 2 },
        {min: 80001, max: 100000, estSale: 1 },
        {min: 100001, max: 200000, estSale: 1 },
        {min: 200001, max: 500000, estSale: 1 },
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonDeParser.zone = "de";
AmazonDeParser.region = "DE";

AmazonDeParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonDeParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};
AmazonDeParser.prototype.getKindleEditionRow = function(jqNode) {
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0 && $(this).text().indexOf("andere Formate")<0)
            retval= $(this);
        else if($(this).text().indexOf("Kindle-Kauf")>0)
            retval= $(this);
    });

    return retval;
};

AmazonDeParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonDeParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonDeParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonDeParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonDeParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonDeParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonDeParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#summaryStars a").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof rl_reviews === 'undefined' || rl_reviews.length == 0) return '0';
    return rl_reviews[1].nodeValue.replace('Rezensionen','').replace('Rezension','').trim();
};

AmazonDeParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span:contains('von')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("von")[0].trim();
};

AmazonDeParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("von") != -1 ? totalSearchResult.indexOf("von") + 4 : 0;
    var positionEnd = totalSearchResult.indexOf("Ergebnissen") != -1 ? totalSearchResult.indexOf("Ergebnissen") - 1 : totalSearchResult.indexOf("Ergebnisse") - 1;
    return totalSearchResult.substring(positionStart, positionEnd);
};

AmazonDeParser.prototype.getPrintLength = function(responseText){
    var printLengthNodes = responseText.find("#productDetailsTable li:contains('Print-Ausgabe:')").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof printLengthNodes === 'undefined' || printLengthNodes.length == 0) return '';
    return printLengthNodes[0].nodeValue.replace('Seiten','').trim();
};

AmazonDeParser.prototype.getPrice = function(responseText){
    var price = responseText.find(".swatchElement:contains('Kindle Edition') .a-button-inner .a-color-price");
    if(typeof price === 'undefined' || price.length == 0) return '';
    return price.text().trim();
};

AmazonDeParser.prototype.getAuthor = function(responseText){
    var author = responseText.find(".author .contributorNameID");
    if(author.length === 0) author = responseText.find(".author .a-link-normal");
    if(typeof author === 'undefined' || author.length == 0) return '';
    return author.text().trim();
};
