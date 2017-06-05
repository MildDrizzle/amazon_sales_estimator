function Popup(){
    this.booksData = [];
    this.books20 = [];
    this.activeTab = new MainTab();
    this.isErrorWindow = false;
    this.siteParser = undefined;
    this.storage = new BookStorage();
    this.columnGetterFunctions = [];
    var _this = this;
    this.columnGetterFunctions['no'] = function(book){return parseInt(book.No)};
    this.columnGetterFunctions['pageno'] = function(book){
        var printLength = Helper.parseInt(book.PrintLength, _this.siteParser.decimalSeparator);
        return isNaN(printLength) ? 0 : printLength;
    };
    this.columnGetterFunctions['title-book'] = function(book){return book.Title};
    this.columnGetterFunctions['price'] = function(book){return Helper.parseFloat(book.Price, _this.siteParser.decimalSeparator)};
    this.columnGetterFunctions['est-sales'] = function(book){return book.EstSales};
    this.columnGetterFunctions['sales-rev'] = function(book){return book.SalesRecv};
    this.columnGetterFunctions['reviews'] = function(book){return Helper.parseInt(book.Reviews, _this.siteParser.decimalSeparator)};
    this.columnGetterFunctions['sales-rank'] = function(book){return Helper.parseInt(book.SalesRank, _this.siteParser.decimalSeparator)};

    this.currentSortColumn = 'no';
    this.currentSortDirection = 1; //1 = ask, -1 = desc

    this.isRefreshStarted = false;
    this.isStaticLinkInitialized = false;
}

Popup.prototype.resetCss = function(){
    // header
    $('#main-header').hide();
    $('#tracking-header').hide();

    // info
    $('.info.single_book').hide();
    $('.info.list_books').hide();
    $('.info.single_book .info-item').css('width', '');
    $('#infoPages').hide();

    //table
    $('.table-head').hide();
    $('.img-load').hide();

    //table keywords
    $('.table-head-keyword-search').hide();

    // content
    $('#word-cloud-content').hide();
    $('#no-data-found-content').hide();
    $('#no-supported-area').hide();
    $('#main-content').hide();
    $('#loading-content').hide();
    $('#content-keyword-search').hide();
    $('#tracking-content').hide();
    $('.right-panel').hide();
    $('.left-panel').css('width', '');

    // footer
    $('#WordCloudFooter').hide();
    $('#BestSellersRankingFooter').hide();
    $('#NoDataFooter').hide();
    $('#no-compatible-aria-footer').hide();
    $('#ExportBtn').hide();
    $('#TrackedPanelFooter').hide();
    $('#BookTracked').hide();
    $('#totalReSalesRecvBlock').hide();
    $('#Conclusion').hide();
    $('#ExportBtnWordCloud').hide();
    $('#AdPanel').hide();
};

Popup.prototype.compare = function(a,b) {
    var func = this.columnGetterFunctions[this.currentSortColumn];
    if (func(a) < func(b))
        return -this.currentSortDirection;
    if (func(a) > func(b))
        return this.currentSortDirection;
    return 0;
};

Popup.prototype.getData = function(callback){
    var _this = this;
    callback = Helper.valueOrDefault(callback, function(){});
    Api.sendMessageToActiveTab({type: "get-data"}, function(data) {
        if(typeof data === 'undefined') return;
        var books20 = data.books.slice(0, Math.max(20, data.books.length))
        data.books.sort(function(a,b){return _this.compare(a,b)});
        return callback({books: data.books, isWaitingForPulling: data.isWaitingForPulling, isPulling: data.isPulling, books20: books20});
    });
};

Popup.prototype.refreshData = function(){
    var _this = this;
    _this.getData(function(result) {
        _this.booksData = result.books;
        _this.books20 = result.books20;

        if (_this.booksData.length <= 0) return;

        Helper.setupHeader(_this.booksData[0].Category, _this.booksData[0].CategoryKind);

        if (_this.isErrorWindow) {
            _this.checkUrlAndLoad();
            return;
        }

        if (_this.activeTab.isPaged) {
            _this.activeTab.insertData(_this.activeTab.pageNum - 1, _this.booksData, _this.siteParser, _this.books20);
            if (result.isWaitingForPulling) $('.img-load').show();
            else {
                $('.img-load').hide();
            }
            if (result.isPulling && _this.booksData.length < 20){
                $('.status-img div').hide();
                $('.bullet-progress').show();
            }
            else{
                $('.status-img div').show();
                $('.bullet-progress').hide();
            }
        }
    });
    setTimeout(function(){_this.refreshData()}, 1000);
};

Popup.prototype.initRankTrackingTab = function(bookUrl){
    this.activeTab = new RankTrackingTab(this.siteParser);
    $('#LinkBackTo').hide();
    this.activeTab.loadDetails(bookUrl, function(){
        $('#LinkBackTo').show();
    });
    this.resetCss();
    RankTrackingTab.resetTrackingBookPage(bookUrl);
    $('#tracking-header').show();
    $('#tracking-content').show();
    $('#TrackedPanelFooter').show();
    $('.info.single_book').show();
    $('.right-panel').show();
    $('.table-head').show();
    $(".table-head").html("<label>Bestseller rank tracking(30 days)<label>");

    this.loadAdvertisementBanner();

    $('.left-panel').css("width", "525px");

    $('#main-header').html('');
    $('#tracking-content').html('');
};

Popup.prototype.setupClickListeners = function(){
    var _this = this;
    $('#TitleWordCloud').click(function() {
        _this.activeTab = new WordCloudTab(_this.activeTab.pageNum);
        var cloud = _this.activeTab.load(_this.booksData);

        _this.resetCss();
        $('.table-head').html("");
        $('.info.list_books').html(cloud.info);
        $('#word-cloud-content').html(cloud.content);
        $('#Words').html(cloud.words);
        $('#main-header').show();
        $('#word-cloud-content').show();
        $('.info.list_books').show();
        $('#WordCloudFooter').show();
        $('#ExportBtnWordCloud').show();
        $('#AdPanel').show();

        _this.loadAdvertisementBanner();
    });

    $('#BestSellerLink').click(function() {
        $('#data-body').css("overflow-y" , "auto");
        _this.activeTab = new MainTab();
        _this.checkUrlAndLoad();
    });

    $('#RankTrackingResultList').click(function() {
        _this.activeTab = new RankTrackingTab(_this.siteParser);
        var tracking = _this.activeTab.load();
        $('#main-header').html('');
        $('#data-body').html('');
        $('.info.list_books').html(tracking.info);
        _this.resetCss();
        $('#main-header').show();
        $('#main-content').show();
        $('#TrackedPanelFooter').show();
        $('.info.list_books').show();
        $('.table-head').show();
        $('#AdPanel').show();

        _this.loadAdvertisementBanner();

        $('#data-body').css("overflow-y", "auto");
        $('.table-head').html(tracking.header);
        _this.activeTab.updateRateTrackingTable();
    });

    $("#KeywordAnalysis").click(function() {
        _this.activeTab = new KeywordAnalysisTab();

        var kwdAnalysis = _this.activeTab.kwdAnalysisListShow();
        _this.resetCss();
        $('#data-body').html('');
        $('.info.list_books').html(kwdAnalysis.info);
        $('#main-content').show();
        $('#main-header').show();
        $('#BestSellersRankingFooter').show();
        $('#ExportBtn').show();
        $('.info.list_books').show();
        $('.table-head').show();
        $('#totalReSalesRecvBlock').show();
        $('#Conclusion').show();

        _this.loadAdvertisementBanner();

        $(".info-item").css("width","16.6%");
        $('#data-body').css("overflow-y" , "hidden");
        $('.table-head').html(kwdAnalysis.header);
        _this.activeTab.insertData(_this.activeTab.pageNum-1, _this.booksData, _this.siteParser, _this.books20);
    });
};

Popup.prototype.setupStaticClickListeners = function() {
    if (this.isStaticLinkInitialized) return;

    var _this = this;
    $('#LinkBackTo').click(function () {
        $('#data-body').css("overflow-y", "auto");
        _this.activeTab = new MainTab();
        _this.resetCss();
        _this.checkUrlAndLoad();
    });

    $('#enableTracking').click(function () {
        $('#enableTracking').prop('disabled', true);
        $('#LinkBackTo').hide();
        var element = this;
        _this.storage.enableTracking($(element).data().url, function() {
            _this.activeTab.loadDetails($(element).data().url, function(){
                $('#enableTracking').prop('disabled', false);
                $('#LinkBackTo').show();
            });
        });
    });

    $('#disableTracking').click(function () {
        var element = this;
        _this.storage.disableTracking($(element).data().url, function(bytesInUse) {
            $('#LinkBackTo').hide();
            _this.activeTab.loadDetails($(element).data().url, function(){
                $('#LinkBackTo').show();
            });
        });
    });

    $('table[name="data"] tbody').on('click', '.RankTrackingResultSingle', function(){
        _this.initRankTrackingTab($(this).attr('bookUrl'));
    });

    $('#PullResult').click(function () {
        _this.setActivePage(_this.activeTab.pageNum + 1);
        Api.sendMessageToActiveTab({type: 'pull-data', page: _this.activeTab.pageNum});
    });

    var exportToCsvFunction = function() {
        _this.activeTab.exportToCsv(_this.booksData, _this.siteParser);
    };
    $('#Export').click(exportToCsvFunction);
    $('#ExportWordCloud').click(exportToCsvFunction);

    $('.help').click(function(){
        Api.openNewTab('http://www.kdspy.com/help/');
    });

    $('#go-categories').click(function(){
        Api.openNewTab('https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html');
    });

    $('.search').click(function() {
        _this.activeTab = new SearchKeywordsTab(_this.siteParser);
        var info = _this.activeTab.load();
        $('#main-header').html('');
        $('.info.list_books').html(info);

        $("#search-text").keypress(function(event){
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if(keycode == '13'){
                _this.activeTab.search();
            }
        });

        $("#go-search").click(function()
        {
            _this.activeTab.search();
        });

        _this.resetCss();
        $('#main-header').show();
        $('#content-keyword-search').show();
        $('#TrackedPanelFooter').show();
        $('.info.list_books').show();
        $('#search-text').focus();
        $('#AdPanel').show();
        if ($('table[name="data-keyword-search"] tr').length > 0) $('.table-head-keyword-search').show();

        _this.loadAdvertisementBanner();

        $('#data-body-keyword-search').css("overflow-y", "auto");
    });

    $('table[name="data-keyword-search"] tbody').on('click', '.keyword-analyze', function(){
        _this.activeTab = new MainTab();
        var search = $(this).attr('keyword');
        Api.sendMessageToActiveTab({type: "start-analyze-search-keywords", keyword: search});
        _this.checkUrlAndLoad();
    });

    _this.isStaticLinkInitialized = true;
};

Popup.prototype.loadData = function(books, books20) {
    this.setupStaticClickListeners();
    if (typeof books === 'undefined' || books.length < 1)
    {
        this.isErrorWindow = true;
        this.resetCss();
        $('#main-header').html('');
        $('.info.list_books').html("");
        $('.info.list_books').show();
        $('#NoDataFooter').show();
        $('#AdPanel').show();

        $('.table-head').html("");
        $('#main-content').hide();
        $('#loading-content').show();
        $('#main-header').show();

        var _this = this;
        setTimeout(function(){_this.checkIsDataLoaded()}, 6000);
    }else{
        this.updateTable(books, books20);
    }
};

Popup.prototype.checkIsDataLoaded = function(){
    var _this = this;
    Api.sendMessageToActiveTab({type: "get-data"}, function(settings) {
        if (settings.books.length == 0){
            _this.isErrorWindow = true;
            _this.resetCss();
            $('#main-header').html('');
            $('.table-head').html('');

            Api.sendMessageToActiveTab({type: "get-type-page"}, function(pageName) {
                if (typeof pageName === 'undefined' || pageName === '') {
                    $('#no-supported-area').show();
                    $('#no-compatible-aria-footer').show();
                }else {
                    $('#no-data-found-content').show();
                    $('#NoDataFooter').show();
                }

                $('#ExportBtn').show();
                $('#AdPanel').show();

                _this.loadAdvertisementBanner();
            });
        }
    });
};

Popup.prototype.updateTable = function(books, books20){
    var _this = this;
    _this.isErrorWindow = false;
    _this.storage.getNumberOfBooks(function(num){
        num = (typeof num === 'undefined') ? 0 : num;

        $('#RankTrackingResultList').html('Rank Tracking (' + num + ')');
        $('#main-header').html(Helper.buildHeaderHtml(num, _this.activeTab.pageNum * 20));
        Helper.setupHeader(books[0].Category, books[0].CategoryKind);
        Helper.setupFooter(books[0].CategoryKind);

        _this.setupClickListeners();
    });

    var main = _this.activeTab.load();

    _this.resetCss();
    $('#data-body').html('');
    $('.info.list_books').html(main.info);
    $('#main-content').show();
    $('#main-header').show();
    $('#BestSellersRankingFooter').show();
    $('#ExportBtn').show();
    $('.info.list_books').show();
    $('.table-head').show();
    $('#totalReSalesRecvBlock').show();
    $('#Conclusion').show();

    _this.loadAdvertisementBanner();

    $('#data-body').css("overflow-y" , "hidden");
    $('.table-head').html(main.header);

    $('.sort-column').each(function( index ){
        $(this).click(function() {
            var newSortColumn = $(this).attr('id');
            _this.currentSortDirection *= -1;

            if(_this.currentSortColumn != newSortColumn)
                _this.currentSortDirection = 1;

            _this.currentSortColumn = newSortColumn;
        });
    });

    _this.activeTab.insertData(_this.activeTab.pageNum-1, books, _this.siteParser, books20);
};

Popup.prototype.setActivePage = function(pageNum){
    $('#TitleWordCloud').text("Word Cloud (" + (pageNum) * 20 + ")");
    this.activeTab.pageNum = pageNum;
    this.activeTab.savePageNum();
    this.activeTab.insertData(pageNum-1, this.booksData, this.siteParser, this.books20);
};

Popup.prototype.checkUrlAndLoad = function(){
    var _this = this;
    Api.sendMessageToActiveTab({type: "get-current-url"}, function(url) {
        if (typeof url === 'undefined' || url.indexOf("www.amazon.") < 0)
        {
            //Go To Amazon Page
            Api.openNewTab('https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html');
            window.close();
            return;
        }

        // load
        _this.siteParser = Helper.getSiteParser(url);
        $("#regionSelector").val(_this.siteParser.region);
        Api.sendMessageToActiveTab({type: "get-type-page"}, function(pageName) {
            if (pageName == 'SingleBookPage') {
                _this.activeTab = new RankTrackingTab(_this.siteParser);
                _this.initRankTrackingTab(url);
                //_this.activeTab.loadDetails(url);
                return;
            }

            new MainTab().loadPageNum(function(){
                new KeywordAnalysisTab().loadPageNum(function(){
                    _this.getData(function(result){
                        _this.booksData = result.books;
                        _this.books20 = result.books20;
                        _this.loadData(_this.booksData, _this.books20);
                        _this.loadAdvertisementBanner();
                    });
                });
            });

            if (!_this.isRefreshStarted) {
                _this.refreshData();
                _this.isRefreshStarted = true;
            }
        });
    });
};

Popup.prototype.initRegionSelector = function(){
    $('#regionSelector').on('change', function(){
        var url;
        switch ($(this).val()){
            case AmazonComParser.region:
                url = "http://www.amazon.com/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/154606011/ref=zg_bs_nav_kstore_1_kstore";
                break;
            case AmazonCoUkParser.region:
                url = "http://www.amazon.co.uk/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/341689031/ref=zg_bs_nav_kinc_1_kinc";
                break;
            case AmazonDeParser.region:
                url = "http://www.amazon.de/gp/bestsellers/digital-text/530886031/ref=zg_bs_nav_kinc_1_kinc";
                break;
            case AmazonFrParser.region:
                url = "http://www.amazon.fr/gp/bestsellers/digital-text/695398031/";
                break;
            case AmazonCaParser.region:
                url = "http://www.amazon.ca/gp/bestsellers/digital-text/2980423011/";
                break;
            case AmazonItParser.region:
                url = "http://www.amazon.it/gp/bestsellers/digital-text/827182031/";
                break;
            case AmazonEsParser.region:
                url = "http://www.amazon.es/gp/bestsellers/digital-text/827231031";
                break;
            case AmazonInParser.region:
                url = "http://www.amazon.in/gp/bestsellers/digital-text/1634753031";
                break;
            case AmazonJpParser.region:
                url = "https://www.amazon.co.jp/gp/bestsellers/digital-text/2275256051";
                break;
            case AmazonAuParser.region:
                url = "https://www.amazon.com.au/gp/bestsellers/digital-text/2496762051";
                break;
        }

        Api.openNewTab(url);
    });
};

Popup.prototype.loadAdvertisementBanner = function(){
    Api.sendMessageToBackground({
            type:'http-get-bg',
            data: {url:"http://www.kdspy.com/banner.html"}},
        function(responseText) {
            if (typeof responseText === 'undefined') return;
            $("#ad").html(responseText);
        });
};


var popup = undefined;
$(window).ready(function () {
    $('#bullet-1, #bullet-2, #bullet-3').tooltipster({
        animation: 'fade',
        theme: 'tooltip-theme',
        maxWidth: 200,
        updateAnimation: false,
        position: 'top'
    });

    ApiLoader.load(function(){
        popup = new Popup();
        popup.setupStaticClickListeners();
        popup.initRegionSelector();
        Api.registerOnShowEvent(onShow);
    });
});

// run this when show the popup
function onShow(){
    popup.resetCss();
    popup.activeTab = new MainTab();
    SearchKeywordsTab.clearTable();
    SearchKeywordsTab.searchedKeyword = '';
    popup.checkUrlAndLoad();
}

