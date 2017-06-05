/**
 * Created by Andrey Klochkov on 02.04.15.
 */

function SearchPageParser(kindleSpy){
}

SearchPageParser.prototype.parsePage = function(pullingToken, startIndex, maxResults, jqNodes, parentUrl, category, siteParser, type)
{
    var _this = this;
    var no = [];
    var url = [];
    var price = [];
    var review = [];

    var index = 0;
    var counter = 0;
    var result;

    var listItems = jqNodes.find("#atfResults li").has('.a-fixed-left-grid-inner');
    listItems = $.merge(listItems, jqNodes.find("#btfResults li").has('.s-item-container'));

    listItems.each(function() {
        if($(this).attr('id') !== 'result_'+(startIndex+index)
            && $(this).attr('id') !== 'centerPlus') return;
        result = $(this).find('.a-fixed-left-grid-inner');
        if(counter>=maxResults) return;
        no[index] = startIndex + index + 1;
        url[index] = Helper.getUrlWORedirect($(result).find('a:contains("' + siteParser.searchPattern + '")').attr("href"));
        if(!url[index]) {
            index++;
            return;
        }
        var kprice = $(result).find('div').filter(function () {
            return $(this).text() == siteParser.searchPattern || $(this).children("a:contains(" + siteParser.searchPattern+ ")").length > 0;
        });
        price[index] = siteParser.currencySign + "0" + siteParser.decimalSeparator + "00";
        if($(kprice).length > 0){
            var prices = kprice.next().find('span.s-price');
            if (prices.length > 0 && prices.text().indexOf('0' + siteParser.decimalSeparator + '00') !== -1)
                prices = kprice.parent().find('span.s-price');
        }

        var el_price;
        if (typeof prices !== 'undefined') {
            if ((prices.parent().parent().has('span.s-icon-kindle-unlimited').length > 0)
                || (prices.parent().has("span:contains('" + siteParser.searchKeys[1] + "')").length > 0)) {
                el_price = $.grep(prices, function (element) {
                    return ($(element).parent().has("span:contains('" + siteParser.searchKeys[0] + "')").length > 0);
                });
            }else if(prices.parent().parent().parent().has("h3:contains('Audible Audio Edition')").length > 0){ //Amazon Added Audible Audio Edition block
                el_price = $(prices[0]);
            }else if($(prices).length > 1) {
                el_price = $(prices[0]);
            }else if(kprice.find('span.s-price').length > 0){
                el_price = kprice.find('span.s-price');
            }else{
                el_price =  prices;
            }

            if( el_price.length > 0) price[index] = $(el_price).text().trim();
        }

        review[index] = undefined;

        url[index] = url[index].replace("&amp;", "&");
        url[index] = url[index].replace(" ", "%20");
        index++;
        counter++;
    });
    if(counter == 0) return 0;

    var totalResults = Helper.parseInt(siteParser.getTotalSearchResult(jqNodes), siteParser.decimalSeparator);
    kindleSpy.saveTotalResults(totalResults);

    url.forEach(function(item, i) {
        if (typeof url[i] !== 'undefined' && url[i].length > 0
            && typeof price[i] !== 'undefined' && price[i].length > 0){
            kindleSpy.parserAsyncRunner.start(function(callback){
                function wrapper(){
                    kindleSpy.parseDataFromBookPageAndSend(pullingToken, no[i], url[i], price[i], parentUrl, "", review[i], category, type, callback);
                }
                setTimeout(wrapper, i*1000);
            })
        }
    });

    return counter;
};
