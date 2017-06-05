/**
 * Created by Andrey Klochkov on 09.08.14.
 */

function Helper(){
}

Helper.parseFloat = function(string, decimalSeparator){
    if (typeof(string) !== 'string') return string;
    decimalSeparator = Helper.valueOrDefault(decimalSeparator, '.');
    // leave only numbers and decimal separator
    var numbersWithLocalDecimalSeparator = string.trim().replace(new RegExp('[^0-9' + decimalSeparator + ']','g'), '');
    return parseFloat(numbersWithLocalDecimalSeparator.replace(decimalSeparator, '.'));
};

Helper.parseInt = function(string, decimalSeparator){
    if (typeof(string) !== 'string') return string;
    decimalSeparator = Helper.valueOrDefault(decimalSeparator, '.');
    // leave only numbers and decimal separator
    return parseInt(string.trim().replace(new RegExp('[^0-9' + decimalSeparator + ']','g'), ''));
};

/**
 * Parses URL and returns a get parameter requested
 * @param url url to parse
 * @param name parameter name
 * @returns {string} parameter value
  */
Helper.getParameterByName = function(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

/**
 * Returns default value if parameter is not passed to function, otherwise returns it's value.
 * @param param parameter
 * @param defaultValue default param value
 * @returns default value if parameter is not set
 */
Helper.valueOrDefault = function(param, defaultValue){
    return typeof param === 'undefined' ? defaultValue : param;
};

/**
 * Returns substring between startChar and endChar after pattern in the text
 * @param text
 * @param pattern
 * @param startChar
 * @param endChar
 * @returns {string}
 */
Helper.parseString = function(text, pattern, startChar, endChar)
{
    var pos = text.indexOf(pattern);
    if (pos < 0) return "";

    var str = text.substr(pos + pattern.length);
    pos = str.indexOf(startChar);
    if (pos < 0) return "";

    str = str.substr(pos + startChar.length);
    pos = str.indexOf(endChar);
    if (pos < 0) return "";

    return str.substr(0, pos).trim();
};

/**
 * Creates a concrete site parser object depending on URL
 * @param url
 * @returns {object} SiteParser
 */
Helper.getSiteParser = function(url){
    var fullUrl = new URL(url);
    var hostname = fullUrl.hostname;
    if(hostname.indexOf('www.amazon.') == -1) return undefined;
    if(hostname.indexOf(AmazonAuParser.zone) != -1) //check earlier than AmazonComParser because AmazonComParser==com, but AmazonAuParser=com.au
        return new AmazonAuParser();
    if(hostname.indexOf(AmazonComParser.zone) != -1)
        return new AmazonComParser();
    if(hostname.indexOf(AmazonCoUkParser.zone) != -1)
        return new AmazonCoUkParser();
    if(hostname.indexOf(AmazonDeParser.zone) != -1)
        return new AmazonDeParser();
    if(hostname.indexOf(AmazonFrParser.zone) != -1)
        return new AmazonFrParser();
    if(hostname.indexOf(AmazonCaParser.zone) != -1)
        return new AmazonCaParser();
    if(hostname.indexOf(AmazonItParser.zone) != -1)
        return new AmazonItParser();
    if(hostname.indexOf(AmazonEsParser.zone) != -1)
        return new AmazonEsParser();
    if(hostname.indexOf(AmazonInParser.zone) != -1)
        return new AmazonInParser();
    if(hostname.indexOf(AmazonJpParser.zone) != -1)
        return new AmazonJpParser();
};

/**
 * Add decimal and thousand delimiters: commas and points
 * @param str
 * @returns {string}
 */
Helper.addCommas = function(str)
{
    str += '';
    x = str.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
};

/**
 * Gets a category from the bookData array
 * @param bookData
 * @returns {string}
 */
Helper.getCategoryFromBookData = function(bookData){
    bookData = Helper.valueOrDefault(bookData, []);
    if(bookData.length > 0)
        return bookData[0].Category;

    return '';
};

/**
 * Return bool value page is best sellers.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isBestSellersPage = function(url, siteParser){
    return (url.indexOf(siteParser.mainUrl +"/Best-Sellers-Kindle-Store") >= 0 && url.indexOf("digital-text") > 0)
        || (url.indexOf(siteParser.mainUrl +"/gp/bestsellers") >= 0 && url.indexOf("digital-text") > 0);
};

/**Return bool value is BestSellers page by categoryKind.
 * @param categoryKind
 * @returns {boolean}
 */
Helper.isBestSellersPageFromCategoryKind = function(categoryKind){
    return categoryKind.indexOf("Seller") != -1;
};

/**
 * Return bool value page is search page.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isSearchPage = function(url, siteParser){
    return url.indexOf(siteParser.mainUrl +"/s/")!=-1 && url.indexOf("digital-text") > 0;
};

/**
 * Return bool value is search page by categoryKind.
 * @param categoryKind
 * @returns {boolean}
 */
Helper.isSearchPageFromCategoryKind = function(categoryKind){
    return categoryKind.indexOf("Search") != -1;
};

/**
 * Return bool value page is author page.
 * @param html
 * @param siteParser
 * @returns {boolean}
 */
Helper.isAuthorPage = function(html, siteParser){
    return html.indexOf(siteParser.areYouAnAuthorPattern) >= 0 && html.indexOf("ap-author-name") >= 0;
};

/**
 * Return bool value page is author page.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isAuthorSearchResultPage = function(url, siteParser){
    return url.indexOf(siteParser.mainUrl +"/s") !=-1 && url.indexOf("field-author") > 0 && url.indexOf("digital-text") > 0;
};

/**
 * Return bool value page is single page.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isSingleBookPage = function(url, siteParser){
    var fullUrl = url.split("/");
    var mainUrl = fullUrl[0] +"//"+ fullUrl[2];
    return (mainUrl.indexOf(siteParser.mainUrl) >= 0
        && fullUrl.length > 4
        && fullUrl[4].indexOf("dp") >= 0);
};

/**
 * Parses html with replace of src tags to data-src
 * @param html
 * @returns {jQuery}
 */
Helper.parseHtmlToJquery = function(html){
    html = $.trim(html);
    html = html.replace(/src=/gi, "data-src=");
    return $(html);
};

/**
 * Setup header
 * @param category
 * @param categoryKind
 */
Helper.setupHeader = function(category, categoryKind){
    $('#KeywordAnalysisMenu').hide();
    if (Helper.isBestSellersPageFromCategoryKind(categoryKind)){
        $("#CategoryKind").html("Best Sellers in");
        $("#title").html(category + ':');
        $('#BestSellerLink').html('Best Seller Rankings');
        return;
    }
    if(Helper.isSearchPageFromCategoryKind(categoryKind)){
        $("#CategoryKind").html("Keyword:");
        $("#title").html(category);
        $('#KeywordAnalysisMenu').show();
        $('#BestSellerLink').html('Keyword Results');
        return;
    }
    $("#CategoryKind").html("Author:");
    $("#title").html(category);
    $('#BestSellerLink').html('Author Titles');
};

/**
 * Setup footer
 * @param categoryKind
 */
Helper.setupFooter = function(categoryKind){
    $('#Conclusion').hide();
    $('#AdPanel').hide();
    if (Helper.isBestSellersPageFromCategoryKind(categoryKind)){
        $('#Conclusion').show();
        return;
    }
    if(Helper.isSearchPageFromCategoryKind(categoryKind)){
        $('#Conclusion').show();
        return;
    }
    $('#AdPanel').show();
};

/**
 * Build html for header
 * @param rankTrackingNum
 * @returns {string}
 */
Helper.buildHeaderHtml = function(rankTrackingNum, cloudNum){
    var headerHtml = '<div style="float:left;font-size:14px;padding-left:11px;" id="CategoryKind"></div>' +
        '<div style="float:left;font-size:14px;padding-left:6px;font-weight:bold" id="title"></div>' +
        '<div style="float:right">' +
        '<a id="BestSellerLink" href="#"></a>&nbsp;&nbsp;|&nbsp;&nbsp;' +
        '<span style="display: none;" id="KeywordAnalysisMenu"><a id="KeywordAnalysis" href="#">Keyword Analysis</a>&nbsp;&nbsp;|&nbsp;&nbsp;</span>' +
        '<a id="TitleWordCloud" href="#">Word Cloud (' + cloudNum + ')</a>&nbsp;&nbsp;|&nbsp;&nbsp;' +
        '<a id="RankTrackingResultList" href="#">Rank Tracking (' + rankTrackingNum + ')</a>' +
        '</div>';
    return headerHtml;
};

/**
 * Return trimmed url
 * @param currentPageUrl
 * @returns {string}
 */
Helper.trimCurrentUrl = function(currentPageUrl){
    var currentUrl = currentPageUrl;
    if(currentPageUrl.indexOf('/s/') >= 0)
    {
        currentUrl = currentPageUrl.replace(/\&page=[0-9]+/, '');
    }
    else if (currentPageUrl.indexOf('/ref=') >= 0)
    {
        var _Pos = currentPageUrl.lastIndexOf('/ref=');
        currentUrl = currentPageUrl.substr(0, _Pos);
    }

    return currentUrl;
};

/**
 * Return bool value page is top100Free
 * @returns {boolean}
 */
Helper.isTop100Free = function(){
    return location.href.indexOf('tf=1') != -1;
};

/**
 * Return url for search page
 * @param keyword
 * @param siteParser
 * @returns {string}
 */
Helper.getSearchUrl = function(keyword, siteParser){
    return siteParser.mainUrl + "/s/url=search-alias%3Ddigital-text&field-keywords=" + encodeURI(keyword);
};
/**
 *
 * @param url of single book in list
 * @return url without /gp/slredirect/picassoRedirect.html
 */

Helper.getUrlWORedirect = function(url){
    if(typeof url === "undefined" || url.indexOf("picassoRedirect.html") === -1) return url;
    return decodeURIComponent(url.split("url=")[1]);
}
