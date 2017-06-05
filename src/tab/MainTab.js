/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function MainTab(){
    if ( MainTab.prototype._singletonInstance )
        return MainTab.prototype._singletonInstance;
    MainTab.prototype._singletonInstance = this;

    this.pageNum = 1;
    this.isPaged = true;
}

MainTab.prototype.savePageNum = function(){
    Api.sendMessageToActiveTab({type: "save-pageNum", tab: 'MainTab', pageNum: this.pageNum});
};

MainTab.prototype.loadPageNum = function(callback){
    var _this = this;
    callback = Helper.valueOrDefault(callback, function() {});
    Api.sendMessageToActiveTab({type: "get-pageNum", tab: 'MainTab'}, function(pageNum){
        _this.pageNum = parseInt(pageNum);
        callback();
    });
};

MainTab.prototype.load = function(){
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:175px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"searchf\" style=\"padding-right:20px;\">More</label><label class=\"sort-column\" id=\"pageno\" style=\"padding-right:8px;\">Page(s)</label><label class=\"sort-column\" id=\"price\" style=\"padding-right:30px;\">Price</label><label class=\"sort-column\" id=\"est-sales\" style=\"padding-right:20px;\" >Est. Sales</label><label class=\"sort-column\" id=\"sales-rev\" style=\"padding-right:15px;\" >Monthly Rev.</label><label class=\"sort-column\" id=\"reviews\" style=\"padding-right:10px;\" >Reviews</label><label class=\"sort-column\" id=\"sales-rank\" >Sales Rank</label>"
    var infoHtml = "<div class=\"info-item\"><span style=\"font-size:11px\">Results:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rank:</span><div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">2,233</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Monthly Rev:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">$7,000.00</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Price:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">$7.95</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. No. Reviews:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">31</div></div>";

    return { info: infoHtml, header: tableHead };
};

MainTab.prototype.exportToCsv = function(bookData, siteParser){
    var x = new Array(this.pageNum * 20 + 1);
    for (var i = 0; i < this.pageNum * 20 + 1; i++) {
        x[i] = new Array(11);
    }

    x[0][0] = "#";
    x[0][1] = "Kindle Book Title";
    x[0][2] = "Author";
    x[0][3] = "Date of publication";
    x[0][4] = "Price";
    x[0][5] = "Est. Sales";
    x[0][6] = "Sales Rev.";
    x[0][7] = "Reviews";
    x[0][8] = "Sales Rank";
    x[0][9] = "Page No(s)";
    x[0][10] = "Book URL";

    for(var index = 0; index < bookData.length; index ++) {
        if (Math.floor(index / 20) <= (this.pageNum - 1))
        {
            x[index + 1][0] = (index + 1).toString();
            x[index + 1][1] = bookData[index].Title;
            x[index + 1][2] = bookData[index].Author;
            x[index + 1][3] = bookData[index].DateOfPublication;
            x[index + 1][4] = bookData[index].FormattedPrice.replace(siteParser.currencySign, siteParser.currencySignForExport);
            x[index + 1][5] = Helper.addCommas(bookData[index].EstSales);
            x[index + 1][6] = siteParser.currencySignForExport + " " + Helper.addCommas(Math.round(bookData[index].SalesRecv));
            x[index + 1][7] = bookData[index].Reviews;
            x[index + 1][8] = bookData[index].SalesRank;
            x[index + 1][9] = bookData[index].PrintLength;
            x[index + 1][10] = '=HYPERLINK(""' + bookData[index].Url + '"")';
        }
    }

    var fileName = "bs-" + Helper.getCategoryFromBookData(bookData);
    Export.toCSV(x, fileName, bookData.length);
};

MainTab.prototype.insertData = function(pageNumber, books, siteParser, books20){
    var category = "";
    var categoryKind = "";
    var salesRankSum = 0;
    var salesRecvSum = 0;
    var priceSum = 0;
    var reviewSum = 0;
    var html = "";
    var nTotalCnt = 0;

    for(var i = books.length - 1; i >= 0 ; i --)
    {
        if ((typeof books[i].SalesRank === "undefined" || books[i].SalesRank.length < 1)
            || (typeof books[i].Title === "undefined" || books[i].Title.length < 1))
        {
            books.splice(i, 1);
        }
    }

    for(var i = 0; i < books.length; i ++) {
        if (Math.floor(i / 20) <= pageNumber)
        {
            html += "<tr>" +
                "<td>"+(i + 1)+"</td>" +
                "<td class='wow'><a href="+books[i].Url+" target='_blank'>" + books[i].Title + "</a></td>" +
                "<td style='width:50px;'><a class='RankTrackingResultSingle' href='" + "#" + "' bookUrl='" + books[i].Url + "'>T</a> " + " | " +
                "<a target='_blank' href='" + books[i].GoogleSearchUrl + "' >S</a> " + " | " +
                "<a target='_blank' href='" + books[i].GoogleImageSearchUrl + "' >C</a>" + "</td>" +
                "<td style='padding-left:15px; width:30px;'>" +books[i].PrintLength + "</td>" +
                "<td style='width:50px;'>"+ books[i].FormattedPrice +"</td>" +
                "<td style='width:60px;' align='center'>" + Helper.addCommas(books[i].EstSales) +"</td>" +
                "<td style='width:80px;'><div style='float:left'> "+ siteParser.currencySign +" </div> <div style='float:right'>"+ Helper.addCommas(Math.round(books[i].SalesRecv)) +"</div></td>" +
                "<td style='width:50px;' align='right'>"+ books[i].Reviews +"</td>" +
                "<td style='width:80px;padding-right : 10px;' align='right'>"+ books[i].SalesRank +"</td>"+
                "</tr>";

            var review = "" + books[i].Reviews;

            salesRankSum += Helper.parseInt(books[i].SalesRank, siteParser.decimalSeparator);
            salesRecvSum += parseInt(books[i].SalesRecv);
            priceSum += books[i].Price;
            reviewSum += Helper.parseInt(review, siteParser.decimalSeparator);
            
            nTotalCnt ++;

            if (category == "")
            {
                categoryKind = books[i].CategoryKind;
                category = books[i].Category;
            }
        }
    }

    if (this.isPaged && pageNumber * 20 >= 20)
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
	var salesRank20index = Math.min(19, books20.length-1);
    var salesRank20 = Helper.parseInt(books20[salesRank20index].SalesRank || 0, siteParser.decimalSeparator);
	
	var monthlyRev20 = 0;
	var salesRankConclusionValue = 0;
	var monthlyRevBook = 0;
	for (var i = 0; i < 20 && i < books20.length; i++) {
        monthlyRev20 += parseInt(books20[i].SalesRecv);
		if(this.getSalesRankConclusion(Helper.parseInt(books20[i].SalesRank, siteParser.decimalSeparator)) == 1) salesRankConclusionValue ++;
		if (books20[i].SalesRecv > 500) monthlyRevBook ++;
	}
	var avgMonthlyRev20 = monthlyRev20/(Math.min(20, books20.length));
	/*End region get data for analysis*/
    
	$('#result2').html(Helper.addCommas(Math.floor(salesRankSum / nTotalCnt)));
    $('#result3').html( siteParser.formatPrice(Helper.addCommas(Math.floor(salesRecvSum / nTotalCnt))));
    $('#result4').html(siteParser.formatPrice(Helper.addCommas((priceSum/nTotalCnt).toFixed(2))));
    $('#result5').html(Helper.addCommas(Math.floor(reviewSum / nTotalCnt)));
    $('#totalReSalesRecv').html(siteParser.formatPrice(Helper.addCommas(salesRecvSum)));
    this.analysis = Helper.isSearchPageFromCategoryKind(categoryKind)? new SearchAnalysisAlgorithm() : new CategoryAnalysisAlgorithm();
    this.analysis.setBullets({salesRank20: salesRank20,
        avgMonthlyRev:avgMonthlyRev20,
        salesRankConclusionValue: salesRankConclusionValue,
        monthlyRevBook:monthlyRevBook});
};

MainTab.prototype.getSalesRankConclusion = function(salesRank){
    if (salesRank == 0) return 0;
    if (salesRank < 10000) return 1;
    if (salesRank < 20000) return 2;
    if (salesRank < 50000) return 3;
    return 0;
};