/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function KeywordAnalysisTab(){
    if ( KeywordAnalysisTab.prototype._singletonInstance )
        return KeywordAnalysisTab.prototype._singletonInstance;
    KeywordAnalysisTab.prototype._singletonInstance = this;

    this.pageNum = 1;
    this.isPaged = true;
    this.analysis = new SearchAnalysisAlgorithm();
}

KeywordAnalysisTab.prototype.savePageNum = function(){
    Api.sendMessageToActiveTab({type: "save-pageNum", tab: 'KeywordAnalysisTab', pageNum: this.pageNum});
};

KeywordAnalysisTab.prototype.loadPageNum = function(callback){
    var _this = this;
    callback = Helper.valueOrDefault(callback, function() {});
    Api.sendMessageToActiveTab({type: "get-pageNum", tab: 'KeywordAnalysisTab'}, function(pageNum){
        _this.pageNum = parseInt(pageNum);
        callback();
    });
};

KeywordAnalysisTab.prototype.kwdAnalysisListShow = function() {
    var header = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label>" +
        "<label class=\"sort-column\" id=\"title-book\" style=\"padding-right:295px;\"> </label>" +
        "<label class=\"sort-column\" id=\"price\" style=\"padding-right:20px;\" >Price</label>" +
        "<label class=\"sort-column\" id=\"pages\" style=\"padding-right:15px;\">Page(s)</label>" +
        "<label class=\"sort-column\" id=\"kwt\" style=\"padding-right:15px;\">KWT</label>" +
        "<label class=\"sort-column\" id=\"kwd\" style=\"padding-right:20px;\">KWD</label>" +
        "<label class=\"sort-column\" id=\"rating\" style=\"padding-right:25px;\" >Rating</label>" +
        "<label class=\"sort-column\" id=\"reviews\" style=\"padding-right:40px;\" >Reviews</label>" +
        "<label class=\"sort-column\" id=\"sales-rank\" style=\"padding-right:10px;\" >Sales Rank</label>";
    var info = "<div class=\"info-item\">" +
        "<span style=\"font-size:11px\">Results:</span>" +
        "<div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div>" +
        "</div>" +
        "<div class=\"info-item\">" +
        "<span style=\"font-size:11px\">Avg. Price:</span>" +
        "<div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">$7.95</div>" +
        "</div><div class=\"info-item\">" +
        "<span style=\"font-size:11px\">Avg. Sales Rank:</span>" +
        "<div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">4,233</div>" +
        "</div><div class=\"info-item\">" +
        "<span style=\"font-size:11px\">Avg. Pages:</span>" +
        "<div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">112</div>" +
        "</div>" +
        "<div class=\"info-item\">" +
        "<span style=\"font-size:11px\">Avg. Rating:</span>" +
        "<div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">4.1</div>" +
        "</div>" +
        "<div class=\"info-item\">" +
        "<span style=\"font-size:11px\">Avg. Reviews:</span>" +
        "<div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result6\">31</div>" +
        "</div>";

    return {info: info, header: header};
};

KeywordAnalysisTab.prototype.exportToCsv = function(bookData, siteParser){
    var x = new Array(this.pageNum * 20 + 1);
    for (var i = 0; i < this.pageNum * 20 + 1; i++) {
        x[i] = new Array(9);
    }

    x[0][0] = "#";
    x[0][1] = "Kindle Book Title";
    x[0][2] = "Price";
    x[0][3] = "Page No(s)";
    x[0][4] = "KWT";
    x[0][5] = "KWD";
    x[0][6] = "Rating";
    x[0][7] = "Reviews";
    x[0][8] = "Sales Rank";

    for(var index = 0; index < bookData.length; index ++) {
        if (Math.floor(index / 20) <= (this.pageNum - 1))
        {
            x[index + 1][0] = (index + 1).toString();
            x[index + 1][1] = bookData[index].Title;
            x[index + 1][2] = bookData[index].FormattedPrice.replace(siteParser.currencySign, siteParser.currencySignForExport);
            x[index + 1][3] = bookData[index].PrintLength;
            x[index + 1][4] = this.isKeywordInText(bookData[index].Category, bookData[index].Title);
            x[index + 1][5] = this.isKeywordInText(bookData[index].Category, bookData[index].Description);
            x[index + 1][6] = bookData[index].Rating;
            x[index + 1][7] = bookData[index].Reviews;
            x[index + 1][8] = bookData[index].SalesRank;
        }
    }

    var fileName = "ka-" + Helper.getCategoryFromBookData(bookData);
    Export.toCSV(x, fileName, bookData.length);
};

KeywordAnalysisTab.prototype.insertData = function(pageNumber, books, siteParser, books20)
{
    var category = "";
    var categoryKind = "";
    var salesRankSum = 0;
    var pagesSum = 0;
    var ratingSum = 0;
    var priceSum = 0;
    var reviewSum = 0;
    var html = "";
    var nTotalCnt = 0;
    var salesRankConclusion = 0;

    for(var i = books.length - 1; i >= 0 ; i --)
    {
        if (typeof books[i].SalesRank === "undefined" || books[i].SalesRank.length < 1)
        {
            books.splice(i, 1);
            continue;
        }

        if (typeof books[i].Title === "undefined" || books[i].Title.length < 1)
        {
            books.splice(i, 1);
            continue;
        }
    }

    for(var i = 0; i < books.length; i ++) {
        if (Math.floor(i / 20) <= pageNumber)
        {

            var kwt = this.isKeywordInText(books[i].Category, books[i].Title);
            var kwd = this.isKeywordInText(books[i].Category, books[i].Description);
            salesRankConclusion = this.getSalesRankConclusion(Helper.parseInt(books[i].SalesRank, siteParser.decimalSeparator));
            html += "<tr>" +
                "<td>"+(i + 1)+"</td>" +
                "<td class='wow' style='min-width:280px;max-width:280px;'><a href="+books[i].Url+" target='_blank'>" + books[i].Title + "</a></td>" +
                "<td style='min-width:50px;max-width:50px;padding-left:5px;padding-right:5px;'>"+ books[i].FormattedPrice +"</td>" +
                "<td class='bg-" + this.getPagesColor(books[i].PrintLength) + "' style='padding-left:18px;min-width:22px;max-width:22px;padding-right:18px;'>" +books[i].PrintLength + "</td>" +
                "<td class='bg-" + this.getKWColor(kwt) + "' style='padding-left:10px;min-width:22px;max-width:22px;padding-right:10px;'>" + kwt + "</td>" +
                "<td class='bg-" + this.getKWColor(kwd) + "' style='padding-left:10px;min-width:22px;max-width:22px;padding-right:10px;'>" + kwd + "</td>" +
                "<td class='bg-" + this.getRatingColor(books[i].Rating) + "' style='padding-left:20px;min-width:20px;max-width:20px;padding-right:20px;'>" + Number(books[i].Rating).toFixed(1) +"</td>" +
                "<td class='bg-" + this.getReviewColor(Helper.parseInt(books[i].Reviews, siteParser.decimalSeparator)) + "' style='min-width:50px;max-width:50px;padding-left:20px;padding-right:10px;' align='right'>"+ books[i].Reviews +"</td>" +
                "<td class='bg-" + this.getSalesRankColor(salesRankConclusion) + "' align='right' style='padding-left:31px;width:70px;'>"+ books[i].SalesRank +"</td>"+
                "</tr>";

            var review = "" + books[i].Reviews;
            salesRankSum += Helper.parseInt(books[i].SalesRank, siteParser.decimalSeparator);
            priceSum += books[i].Price;
            reviewSum += Helper.parseInt(review, siteParser.decimalSeparator);
            pagesSum += $.isNumeric(books[i].PrintLength) ? parseInt(books[i].PrintLength) : 0;
            ratingSum += parseFloat(books[i].Rating);

            nTotalCnt ++;

            if (category == "")
            {
                categoryKind = books[i].CategoryKind;
                category = books[i].Category;
            }
        }
    }

    if (pageNumber * 20 >= 20)
    {
        $('#data-body').css("overflow-y" , "scroll");
    }

    var min = (pageNumber + 1) * 20 - 19;
    var max = (pageNumber + 1) * 20;

    if (pageNumber >= 4)
    {
        $('#result1').html(1 + "-" + (books.length));
        $('#PullResult').html("");
    }
    else
    {
        $('#result1').html(1 + "-" + max);
        $('#PullResult').html("Pull Results " + (min + 20) + "-" + (max + 20));
    }

    $("table[name='data']").find("tbody").html(html);
	
	/*Start region: get data for analysis*/
	var salesRankConclusionValue = 0;
	var monthlyRevBook = 0;
	for (var i = 0; i < 20 && i < books20.length; i++) {
		if(this.getSalesRankConclusion(Helper.parseInt(books20[i].SalesRank, siteParser.decimalSeparator)) == 1) salesRankConclusionValue++;
		if (books20[i].SalesRecv > 500) monthlyRevBook++;
	}
	/*End region get data for analysis*/
	
    $('#result2').html(siteParser.formatPrice(Helper.addCommas((priceSum/nTotalCnt).toFixed(2))));
    $('#result3').html(Helper.addCommas(Math.floor(salesRankSum / nTotalCnt)));
    $('#result4').html(Helper.addCommas(Math.floor(pagesSum/ nTotalCnt)));
    $('#result5').html(Helper.addCommas((ratingSum/ nTotalCnt).toFixed(1)));
    $('#result6').html(Helper.addCommas(Math.floor(reviewSum / nTotalCnt)));

    this.analysis.setBullets({
        salesRankConclusionValue: salesRankConclusionValue,
        monthlyRevBook: monthlyRevBook
    });

};

KeywordAnalysisTab.prototype.isKeywordInText = function(keyWord, text){
    return text.toLowerCase().indexOf(keyWord.toLowerCase())!=-1 ? "Yes" : "No";
};

KeywordAnalysisTab.prototype.getSalesRankConclusion = function(salesRank){
    if (salesRank == 0) return 0;
    if (salesRank < 10000) return 1;
    if (salesRank < 20000) return 2;
    if (salesRank < 50000) return 3;
    return 0;
};

KeywordAnalysisTab.prototype.getSalesRankColor = function(salesRankConclusion){
    if (salesRankConclusion == 1) return 'red';
    if (salesRankConclusion == 2) return 'orange';
    if (salesRankConclusion == 3) return 'green';
    return 'grey';
};

KeywordAnalysisTab.prototype.getRatingColor = function(rating){
    if (rating == '') return 'grey';
    if (rating < 4) return 'green';
    if (rating < 4.5) return 'orange';
    return 'red';
};

KeywordAnalysisTab.prototype.getReviewColor = function(review){
    if (review == '' || review == 0) return 'grey';
    if (review < 21) return 'green';
    if (review < 76) return 'orange';
    return 'red';
};

KeywordAnalysisTab.prototype.getKWColor = function(keyword){
    if (keyword.toLowerCase() == 'yes') return 'red';
    return 'green';
};

KeywordAnalysisTab.prototype.getPagesColor = function(pages){
    if (!$.isNumeric(pages)) return 'grey';
    if (pages < 66) return 'green';
    if (pages < 150) return 'orange';
    return 'red';
};
