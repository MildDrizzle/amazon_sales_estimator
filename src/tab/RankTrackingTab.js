/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function RankTrackingTab(siteParser){
    if ( RankTrackingTab.prototype._singletonInstance )
        return RankTrackingTab.prototype._singletonInstance;
    RankTrackingTab.prototype._singletonInstance = this;

    this.storage = new BookStorage();
    this.siteParser = siteParser;
}

RankTrackingTab.prevBookUrl = '';

RankTrackingTab.resetTrackingBookPage = function(bookUrl) {
    if(RankTrackingTab.prevBookUrl === bookUrl) return;
    RankTrackingTab.prevBookUrl = bookUrl;
    $('#singleResult1').html('');
    $('#singleResult2').html('');
    $('#singleResult3').html('');
    $('#singleResult4').html('');
    $('#singleResult5').html('');
    $('#singleResult6').html('');
    $('#days').html('');
    $('#AvgSalesRank').html('');
    $('#EstDailyRev').html('');
    $('#authorName').html('');
    $('#bookImage').attr('src','');
    $('#enableTracking').show();
    $('#enableTracking').prop('disabled', true);
    $('#disableTracking').hide();
    $('#BookTracked').hide();
    $('#ExportBtn').hide();
    $('#ExportBtnWordCloud').show();
    $('#ExportBtnWordCloud').attr('book-url','');
};

RankTrackingTab.prototype.exportToCsv = function(bookData, siteParser){
    var bookUrl = $('#ExportBtnWordCloud').attr('book-url');

    this.storage.getBook(bookUrl, function(bookData) {
        if(bookData) {
            var x = new Array(bookData.salesRankData.length+1);

            for (var i = 0; i < bookData.salesRankData.length+1; i++) {
                x[i] = new Array(2);
            }

            x[0][0] = "Date";
            x[0][1] = "Sales Rank";

            for(var index = 0; index < bookData.salesRankData.length; index ++) {
                x[index + 1][0] = new Date(bookData.salesRankData[index].date).toDateString();
                x[index + 1][1] = Helper.addCommas(bookData.salesRankData[index].salesRank);
            }

            var fileName = "rs-" + bookData.title;
            Export.toCSV(x, fileName, bookData.salesRankData.length + 1);
        }
    });
};

RankTrackingTab.prototype.load = function(){
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:350px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"daysTracked\" style=\"padding-right:30px;\">Days Tracked</label><label class=\"sort-column\" id=\"resTracking\" style=\"padding-right:45px;\">Tracking</label><label class=\"sort-column\" id=\"removeTracking\" style=\"padding-right:5px;\">Action</label>";
    var info = "<div style=\"font-size:15px;\"><b>Best Seller Rank Tracking:</b></div>";

    return { info: info, header: tableHead };
};

RankTrackingTab.prototype.loadDetails = function(bookUrl, callback){
    callback = Helper.valueOrDefault(callback, function(){});
    var _this = this;
    _this.storage.getBook(bookUrl, function(bookData) {
        if(bookData) {
            _this.updateTrackedBookView(bookData);
            return callback();
        }

        _this.storage.initBookFromUrl(bookUrl, function(bookFromUrl){
            _this.updateTrackedBookView(bookFromUrl);
            return callback();
        });
    });
};

RankTrackingTab.prototype.updateRateTrackingTable = function(){
    var _this = this;
    _this.storage.getAllBooks(function(books){
        var html = "";
        for(var i=0;i<books.length;i++){
            html += "<tr>" +
            "<td >" + (i+1) + "</td>" +
            "<td style=\"width:500px;padding-right: 20px;\">" + books[i].title + "</td>" +
            "<td style=\"width:75px;padding-right: 10px;padding-left: 30px;\">" + books[i].salesRankData.length + "</td>" +
            "<td style=\"width:85px;\"><a class='RankTrackingResultSingle' href='#' bookUrl='" + books[i].url + "'>Results</a></td>" +
            "<td style=\"width:85px;\"><a class='RankTrackingRemove' href='#' bookUrl='" + books[i].url + "'>Remove</a></td>" +
            "</tr>";
        }
        $('table[name="data"] tbody').html(html);

        //Remove links
        var removeRankTrackedBooks = $('.RankTrackingRemove');
        for(var i = 0;i<removeRankTrackedBooks.length; i++) {
            $(removeRankTrackedBooks[i]).click(function () {
                _this.storage.removeBookInStorage($(this).attr('bookUrl'), function(){
                    _this.updateRateTrackingTable();
                });
            });
        }
    });
};

RankTrackingTab.prototype.updateTrackedBookView = function(bookData){
    $('#tracking-header').show();
    $('#ExportBtnWordCloud').show();
    $('#AdPanel').show();
    var contentHtml = '';
    $('#bookTitle').text(bookData.title);
    var points = bookData.salesRankData.slice(Math.max(bookData.salesRankData.length - 30, 0));
    if(points.length == 1 && !bookData.trackingEnabled){
        contentHtml = '<div class="brtdisable"><div>Bestseller Rank Tracking</div><div>Currently Disabled</div></div>';
   }else{
        contentHtml = '<div><canvas id="canvas" height="290" width="520"></canvas></div>';
        $('#infoPages').show();
        $('.info.single_book .info-item').css('width', '16%');
        $('#ExportBtnWordCloud').show();
        $('#BookTracked').show();
    }
    $('#enableTracking').prop('disabled', bookData.trackingEnabled);
    $('#disableTracking').prop('disabled', !bookData.trackingEnabled);

    $('#tracking-content').html(contentHtml);
    $('#enableTracking').toggle(!bookData.trackingEnabled);
    $('#disableTracking').toggle(bookData.trackingEnabled);
    $('#enableTracking').data({url: bookData.url});
    $('#disableTracking').data({url: bookData.url});

    $('#singleResult1').html(bookData.currentSalesRank);
    $('#singleResult2').html(this.siteParser.formatPrice(Helper.addCommas(bookData.price.toFixed(2))));
    $('#singleResult3').html(bookData.pages);
    $('#singleResult4').html(Helper.addCommas(bookData.estSales));
    $('#singleResult5').html(this.siteParser.formatPrice(Helper.addCommas(Math.round(bookData.estSalesRev))));
    $('#singleResult6').html(bookData.numberOfReviews);
    var sumRank=0;

    for(var j=0; j<points.length;j++){
        sumRank += Helper.parseInt(points[j].salesRank, this.siteParser.decimalSeparator);
    }
    var avgSalesRank = sumRank/points.length;
    var bookPageParser = new BookPageParser(bookData.url);
    var estSale = bookPageParser.getEstSale(avgSalesRank);
    var salesRecv = bookPageParser.getSalesRecv(estSale, bookData.price);
    var estDailyRev = Math.floor((salesRecv/30)*100)/100;//30days

    $('#days').html(points.length);
    $('#AvgSalesRank').html(Helper.addCommas(Math.floor(avgSalesRank)));
    $('#EstDailyRev').html(this.siteParser.formatPrice(Helper.addCommas(estDailyRev)));
    $('#authorName').html(bookData.author);
    $('#bookImage').attr('src',bookData.image.replace('AA300', '').replace('AA324', '').replace('AA278', '').replace('PIsitb-sticker-v3-big,TopRight', '').replace('PIkin4,BottomRight', ''));
    $('#ExportBtnWordCloud').attr('book-url', bookData.url);

    var chartData = points;
    var labels = [];
    var data = [];
    for(var i=0;i<chartData.length;i++){
        labels.push(new Date(chartData[i].date).toDateString());
        data.push(Helper.parseInt(chartData[i].salesRank, this.siteParser.decimalSeparator));
    }

    if(labels.length === 1) labels.push('');
    if(data.length === 1) labels.push('');

    var lineChartData = {
        labels: labels,
        datasets: [
            {
                label: "Sales Rank",
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: data
            }
        ]
    };

    var canvas = document.getElementById("canvas");
    if(!canvas) return;
    var context = canvas.getContext("2d");
    window.myLine = new Chart(context).Line(lineChartData, {
        bezierCurve: false,
        scaleLabel: "<%=RankTrackingTab.formatScaleLabel(value)%>"
    });
};

RankTrackingTab.formatScaleLabel = function(value){
    var suffix = ['', 'k', 'M', 'G', 'T', 'P'];
    var result = value;
    var thousands = 0;
    while(result >= 1000){
        result = result / 1000;
        thousands++;
    }
    result = Math.floor(result*100)/100;
    return String(result) + suffix[thousands];
};
