'use strict';

let Popup = (function() {
    let _steps = [
            "results",
            "niche-hunters",
            "tracking-products",
            "track",
            "initial",
            "login"
        ];

    let _itemsTable = null;
    let _productsTable = null;
    let _revenueOption = JSON.parse(localStorage._revenue_option || "null") || "monthly";
    let _revenueOptionvalue = {
        "monthly": 1,
        "daily": 30
    };
    let _curTabId = null;
    let _nicheSearchOptions = {
        bsr: null,
        title: null,
        pages: null,
        price: null,
        revenue: null,
        reviews: null
    };
    let _products = [];
    let _nicheHunters = [];
    
    let _selectedProduct = null;

    let _curStep = JSON.parse(localStorage._curStep || "null") || "results";

    let _background = chrome.extension.getBackgroundPage().Background;

    let $_category = $("#category");
    let $_domain = $("#domain");

    let _curSortColumn = "bsr";
    let _sortOption = "asc";

    let _nicheHuntersTable = $("table#niche-hunders-table");

    let _globalTimer = null;
    
    const bsrPagesPath = {
        "Books": {
            "amazon.com.au": "/best-sellers-books-Amazon/zgbs/books/",
            "amazon.ca": "/best-sellers-books-Amazon/zgbs/books/",
            "amazon.com": "/best-sellers-books-Amazon/zgbs/books/",
            "amazon.co.uk": "/best-sellers-books-Amazon/zgbs/books/",
            "amazon.de": "/gp/bestsellers/books/",
            "amazon.es": "/gp/bestsellers/books/",
            "amazon.fr": "/gp/bestsellers/books/",
            "amazon.in": "/gp/bestsellers/books/",
            "amazon.it": "/gp/bestsellers/books/",
            "amazon.co.jp": "/gp/bestsellers/books/"
        },
        "eBooks": {
            "amazon.com.au": "/gp/bestsellers/digital-text/",
            "amazon.ca": "/gp/bestsellers/digital-text/",
            "amazon.com": "/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/",
            "amazon.co.uk": "/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/",
            "amazon.de": "/gp/bestsellers/digital-text/",
            "amazon.es": "/gp/bestsellers/digital-text/",
            "amazon.fr": "/gp/bestsellers/digital-text/",
            "amazon.in": "/gp/bestsellers/digital-text/",
            "amazon.it": "/gp/bestsellers/digital-text/",
            "amazon.co.jp": "/gp/bestsellers/digital-text/"
        }
    };

    /**
     * Get the BSR based search result page for the given/selected domain and category.
     * @return {string}
     */
    const getSearchUrl = () => {
        let state = _background.get();
        let bsrPath = bsrPagesPath[state.category][state.domain];

        return {
            pattern: `*://www.${state.domain}${bsrPath}`,
            https: `https://www.${state.domain}${bsrPath}`,
            http: `http://www.${state.domain}${bsrPath}`
        };
    }

    /**
     * Truncate string with a specific length. In case of longer than the length, truncate with suffix "..."
     * @param {string} str 
     * @param {number} length 
     * @return {string}
     */
    const truncateString = (str, length) => {
        return (str.length > length) ? str.substr(0, length - 3) + "..." : str;
    }

    /**
     * Get the corresponding value for selected column in products table.
     * @param {object} obj 
     * @param {string} colName 
     */
    const getCompareValue = (obj, colName) => {
        switch(colName) {
            case "bsr":
            case "title":
            case "pages":
            case "price":
            case "estSale":
            case "reviews":
                return obj[colName];
            case "monthly_rev":
                return Number(parseInt(_background.estimation(obj.bsr) * obj.price));
            default:
                return 1;
        }
    }

    /**
     * Draw Table with products scraped from Amazon across domains and categories considered in the chrome extension.
     * @param {boolean} forceFlag
     * @return {void}
     */
    let drawTable = function(forceFlag) {
        chrome.tabs.sendMessage(_curTabId, {
            from: "popup",
            action: "get_data",
            category: $_category.val()
        }, (response) => {
            let products = response.products,
                trackings = _background.items(),
                index = 1,
                $tbody = $("table#results-table tbody");

            $(".tracking-count").text(trackings.length);

            if (products.length == _products.length && !forceFlag) {
                return false;
            } else {
                $tbody.children().remove();

                products = products.sort((a, b) => {
                    let aV = getCompareValue(a, _curSortColumn);
                    let bV = getCompareValue(b, _curSortColumn);

                    aV = (parseInt(aV) == NaN) ? (aV ? aV: -1) : parseInt(aV);
                    bV = (parseInt(bV) == NaN) ? (bV ? bV: -1) : parseInt(bV);
                    
                    if (typeof aV == "string") {
                        let flag = (_sortOption === "asc") ? 1 : -1;

                        if (aV > bV) {
                            return -1 * flag;
                        } else if (aV < bV) {
                            return 1 * flag;
                        } else {
                            return 0;
                        }
                    } else {
                        return (_sortOption == "asc") ? (aV - bV) : (bV - aV);
                    }
                });

                _products = products.concat();

                let bsrSum = 0,
                    pageSum = 0,
                    reviewSum = 0,
                    priceSum = 0.0,
                    estSaleSum = 0,
                    revenueSum = 0,
                    productsCount = products.length;

                for (let i = 0; i < productsCount; i ++) {
                    let found = trackings.filter(item => item.product.asin == products[i].asin);
                    let $record = $("<tr/>");

                    if (found.length > 0) {
                        $record.addClass("tracking").attr({"title": "Watching"});
                    }
                    
                    $record.append($("<td/>").text(products[i].bsr));
                    bsrSum += (parseInt(products[i].bsr) | 0);
                    $record.append($("<td/>").append($("<a/>").addClass("track-link").attr({"data-index": i}).text(truncateString(products[i].title, 30)).attr({title: "Track : " + products[i].title})));
                    if (found.length > 0) {
                        $record.append($("<td/>").append(
                            $(`<a class='untrack-product' title='Untrack this product' data-index='${i}' data-id='${found[0].product.id}'>UnTrack</a>`)
                        ));
                    } else {
                        $record.append($("<td/>").append(
                            $(`<a class='track-product' title='Track this product' data-index='${i}'>Track</a>`)
                        ));
                    }
                    $record.append($("<td/>").text(products[i].pages));
                    pageSum += (parseInt(products[i].pages) || 0);
                    $record.append($("<td/>").text(products[i].currency + products[i].price));
                    priceSum += (parseFloat(products[i].price) || 0.0);
                    _products[i].estSale = parseInt(_background.estimation(products[i].bsr));
                    $record.append($("<td/>").text(Number(parseInt(_background.estimation(products[i].bsr)  / _revenueOptionvalue[_revenueOption])).toLocaleString()));
                    estSaleSum += (parseInt(parseInt(_background.estimation(products[i].bsr)  / _revenueOptionvalue[_revenueOption])) | 0);
                    $record.append($("<td/>").text(products[i].currency + Number(parseInt(_background.estimation(products[i].bsr) * products[i].price / _revenueOptionvalue[_revenueOption])).toLocaleString()));
                    revenueSum += (parseInt(parseInt(_background.estimation(products[i].bsr) * products[i].price / _revenueOptionvalue[_revenueOption])) | 0);
                    $record.append($("<td/>").text(Number(products[i].reviews || 0).toLocaleString()));
                    reviewSum += (parseInt(products[i].reviews) | 0);

                    $record.appendTo($tbody);
                }

                $("table td[data-prop='bsr']").text(parseInt(bsrSum / productsCount) || 0);
                $("table td[data-prop='pages']").text(parseInt(pageSum / productsCount) || 0);
                $("table td[data-prop='reviews']").text(Number(parseInt(reviewSum / productsCount) || 0).toLocaleString());
                if (products.length > 0) {
                    $("table td[data-prop='price']").text(products[0].currency + Math.round(priceSum / productsCount * 100) / 100);
                    $("table td[data-prop='revenue']").text(products[0].currency + Number(parseInt(revenueSum / productsCount)).toLocaleString());
                } else {
                    $("table td[data-prop='price']").text(0);
                    $("table td[data-prop='revenue']").text(0);
                }
                
                $("table td[data-prop='estSales']").text(Number(parseInt(estSaleSum / productsCount) || 0).toLocaleString());
            }

            if (_background.started() && ["login", "initial"].indexOf(_curStep) == -1 && products.length < 20) {
                showLoading();
            } else {
                hideLoading();
            }
        });
    };

    /**
     * Check a op b;
     * @param {number} a 
     * @param {number} op 
     * @param {string} b 
     * @return {boolean}
     */
    const check = (a, op, b) => {
        a = parseInt(a);
        b = parseInt(b);
        if (a == NaN || b == NaN) {
            return false;
        }

        switch(op) {
            case "=":
                return a == b;
                
            case ">":
                return a > b;

            case "<":
                return a < b;
        }
    }

    /**
     * Filter function for niche hunter search.
     * @param {object} product 
     * @param {array} options 
     * @return {boolean}
     */
    const checkNicheHunterSearchOptions = (product, options) => {
        for (let i = 0; i < options.length; i ++) {
            let opIndex = null;
            let operators = ["=", ">", "<"];
            let key, op, value = null;
            for (let j = 0; j < operators.length; j ++) {
                if (options[i].indexOf(operators[j]) > -1) {
                    opIndex = j;
                    op = operators[opIndex];
                    break;
                }
            }

            if (!op) {
                return false;
            }

            [key, value] = options[i].split(op);

            switch(key) {
                case "t":
                case "title":
                    if (product.title.toLowerCase().indexOf(value.toLowerCase()) == -1) {
                        return false;
                    }
                    break;
                
                case "p":
                case "price":
                    if (!check(product.price, op, value)) {
                        return false;
                    }
                    break;

                case "pg":
                case "pages":
                case "page":
                    if (!check(product.pages, op, value)) {
                        return false;
                    }
                    break;

                case "r":
                case "reviews":
                case "review":
                    if (!check(product.reviews, op, value)) {
                        return false;
                    }
                    break;

                case "ms":
                case "monthly est.Sales":
                    if (!check(parseInt(_background.estimation(product.bsr)), op, value)) {
                        return false;
                    }
                    break;

                case "ds":
                case "daily est.Sales":
                    if (!check(parseInt(_background.estimation(product.bsr) / 30), op, value)) {
                        return false;
                    }
                    break;

                case "mr":
                case "monthly revenue":
                    if (!check(parseInt(_background.estimation(product.bsr) * product.price), op, value)) {
                        return false;
                    }
                    break;

                case "dr":
                case "daily revenue":
                    if (!check(parseInt(_background.estimation(product.bsr) * product.price / 30), op, value)) {
                        return false;
                    }
                    break;
                    
                case "k":
                case "keyword":
                case "keywords":
                    let flag = false;
                    let keywords = (product.keywords || "something new").split(",");
                    for (let j = 0; j < keywords.length; j ++) {
                        if (keywords[j].toLowerCase().indexOf(value.toLowerCase()) > -1) {
                            flag = true;
                            break;
                        }
                    }
                    if (!flag) {
                        return false;
                    }
                    break;
            }
        }
        return true;
    }

    /**
     * Render Niche Hunter Products table whenever parameter string changes.
     * @param {string} paramString 
     * @return {void}
     */
    let drawNicheHunterTable = (paramString) => {
        let products = _products.concat();
        let searchOptions = null;
        let trackings = _background.items();
        let $tbody = _nicheHuntersTable.find("tbody");
        let params = paramString ? paramString.split("&") : [];
        let nicheHunterAvgMonthlyRevenue = $(".footer-avg-monthly-revenu");
        let monthlyRevenueSum = 0;

        if (paramString == undefined) {
            paramString = $("#niche-hunters-search-param").val();
        }

        for (let i = 0; i < products.length; i ++) {
            products[i].index = i;
        }

        products = products.filter((product) => {
            if (!paramString) {
                return true;
            } else {
                return checkNicheHunterSearchOptions(product, params);
            }
        });
        products = products.sort((a, b) => {
            return a.bsr - b.bsr;
        });

        $tbody.children().remove();

        for (let i = 0; i < products.length; i ++) {
            let found = trackings.filter(item => item.product.asin == products[i].asin);
            let $record = $("<tr/>");

            if (found.length > 0) {
                $record.addClass("tracking").attr({"title": "Watching"});
            }
            
            // $record.append($("<td/>").text(products[i].bsr));
            // $record.append($("<td/>").append($("<span/>").text(truncateString(products[i].title, 30)).attr({title: "Track : " + products[i].title})));
            // $record.append($("<td/>").text(products[i].pages));
            // $record.append($("<td/>").text(products[i].currency + products[i].price));
            // $record.append($("<td/>").text(Number(parseInt(_background.estimation(products[i].bsr)  / _revenueOptionvalue[_revenueOption])).toLocaleString()));
            // $record.append($("<td/>").text(products[i].currency + Number(parseInt(_background.estimation(products[i].bsr) * products[i].price / _revenueOptionvalue[_revenueOption])).toLocaleString()));
            // $record.append($("<td/>").text(Number(products[i].reviews).toLocaleString()));

            $record.append(
                $("<td/>").text(i + 1),
                $("<td/>").append(
                    $(`<a href="${products[i].url}" target="_newTab" title="${products[i].title}">${truncateString(products[i].title, 15)}</a>`)
                )
            );
            
            if (found.length > 0) {
                $record.append(
                    $("<td/>").html(
                        `<a data-from="niche" class="untrack-product" data-id="${found[0].product.id}">UnTrack</a>`
                    )
                )
            } else {
                $record.append(
                    $("<td/>").html(
                        `<a data-from="niche" class="track-product" data-index="${products[i].index}">Track</a>`
                    )
                )
            }
            let estSale = parseInt(_background.estimation(products[i].bsr));
            $record.append(
                $("<td/>").text(products[i].bsr),
                $("<td/>").text(products[i].pages),
                $("<td/>").text(products[i].reviews),
                $("<td/>").text(products[i].currency + products[i].price),
                $("<td/>").text(Number(estSale).toLocaleString()),
                $("<td/>").text(products[i].currency + Number(parseInt(estSale * products[i].price)).toLocaleString())
            );

            monthlyRevenueSum += parseInt(estSale * products[i].price);

            $record.appendTo($tbody);
        }

        _nicheHunters = products;

        nicheHunterAvgMonthlyRevenue.text((products.length > 0)
            ? products[0].currency + Number(parseInt(monthlyRevenueSum / products.length)).toLocaleString()
            : 0);
    }

    /**
     * Draw change history chart for a given product being tracked by user.
     * @param {number} productID 
     * @return {void}
     */
    const drawChart = (productID) => {
        _background.histories(productID, (response) => {
            let revenueData = [];
            let bsrData = [];
            let xAxisData = [];
            let graphContainer = document.getElementById("graph-container");
            let daysTracking = 0;
            let dailyRevenueSum = 0;
            let $avgDailyRevenue = $(".avg-daily-revinue-estimation");
            let avgBSR = 0;

            for (let i = 0; i < response.histories.length; i ++) {
                revenueData.push([response.histories[i].updated_at, parseInt(response.histories[i].monthly_rev/* / 30*/)]);
                bsrData.push([response.histories[i].updated_at, parseInt(response.histories[i].bsr)]);
                xAxisData.push(new Date(response.histories[i].updated_at).toLocaleDateString());
                daysTracking++;
                dailyRevenueSum += parseInt(response.histories[i].monthly_rev / 30);
                avgBSR += parseInt(response.histories[i].bsr);
            }

            let lastHistory = response.product.histories[response.product.histories.length - 1];
            let first = response.histories[0].updated_at;
            let last = lastHistory.updated_at;
            let tmp = Math.round((new Date(last) - new Date(first)) / (24 * 3600 * 1000));
            $avgDailyRevenue.text(lastHistory.currency + Number(parseInt(dailyRevenueSum / daysTracking)).toLocaleString());
            $(".footer-tracking-days").text((tmp) ? tmp : daysTracking);
            $(".footer-avg-bsr").text(parseInt(avgBSR / daysTracking));

            Highcharts.chart('graph-container', {
                chart: {
                    zoomType: 'x'
                },
                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                        day: '%b %e'    //ex- 01 Jan 2016
                    },
                    categories: xAxisData
                },
                title: {
                    text: "Monthly Revenue Chart"
                },
                yAxis: {
                    title: "Monthly Revenue & BSR"
                },
                series: [
                    {
                        name: "Revenue",
                        data: revenueData,
                        tooltip: {
                            valuePrefix: "$"
                        }
                    },
                    {
                        name: "BSR",
                        data: bsrData,
                        tooltip: {
                            valuePrefix: "#"
                        }
                    }
                ],
                    

            });
        }, (response) => {
            //  To do in failure.
            if (response.status == false && response.message == "Your token was expired.") {
                goTo("login");
            }
        })
    }

    let downloadPlaintext = function(data, filename) {
        let blob = new Blob([data], { type: "text/plain" })

        let el = document.createElement("a")
        el.href = URL.createObjectURL(blob)
        el.download = filename
        document.body.appendChild(el)
        el.click()
        document.body.removeChild(el)
    }

    /**
     * Exporting products to CSV file.
     * @param {array} products
     */
    const downloadProductsToCSV = (products) => {
        let toLine = arr => arr.map(x => `"${(x + "").replace(/"/g, '""')}"`).join(",");
        let header = ["#BSR", "title", "pages", "price", "reviews", "est.Sales", "Revenue", "url"];
        let category = $_category.val();
        // let products = _background.get().products;
        let data = products.map(p => toLine([
                p.bsr,
                p.title,
                p.pages,
                p.currency + p.price,
                Number(p.reviews).toLocaleString(),
                Number(parseInt(_background.estimation(p.bsr))).toLocaleString(),
                p.currency + Number(parseInt(_background.estimation(p.bsr) * p.price)).toLocaleString(),
                p.url
        ]));
        
        data.unshift(toLine(header))

        downloadPlaintext(data.join("\n"), `${category}-${new Date().toISOString()}.csv`)
    }

    const downloadProduct = (p) => {
        const toLine = arr => arr.map(x => `"${(x + "").replace(/"/g, '""')}"`).join(",");
        let category = $_category.val();

        let data = [
            toLine([ "BSR", p.bsr ]),
            toLine([ "Title", p.title ]),
            toLine([ "Pages", p.pages ]),
            toLine([ "Price", p.currency + p.price ]),
            toLine([ "Reviews", Number(p.reviews).toLocaleString() ]),
            toLine([ "Est. Sales", Number(parseInt(_background.estimation(p.bsr))).toLocaleString() ]),
            toLine([ "Est. Revenue", p.currency + Number(parseInt(_background.estimation(p.bsr) * p.price)).toLocaleString() ]),
            toLine([ "URL", p.url ])
        ]

        downloadPlaintext(data.join("\n"), `${category}-detail-${new Date().toISOString()}.csv`)
    }

    /**
     * Render Tracking product view with specific/selected product. In this view, user will be able to watch/unwatch a product or see chart of the product details.
     * @param {object} product 
     * @return {void}
     */
    const renderTrackForm = (product, flag) => {
        let $img = $("#product-image"),
            $graph = $("#graph-container"),
            $title = $("#product-title"),
            $bsr = $("#product-bsr"),
            $estSales = $("#product-estSales"),
            $isbn = $("#product-isbn"),
            $price = $("#product-price"),
            $reviews = $("#product-reviews"),
            $revenue = $("#product-monthly-revenue"),
            $pages = $("#product-pages"),
            $asin = $("#product-asin");

        if (flag) {
            let lastHistory = product.histories[product.histories.length - 1];
            product.price = lastHistory.price;
            product.reviews = lastHistory.reviews;
            product.bsr = lastHistory.bsr;
            product.currency = lastHistory.currency;
        }
        
        $img[0].src = product.img;
        $title.text(product.title);
        $asin.text(product.asin);
        $price.text(product.currency + product.price);
        $reviews.text(Number(product.reviews).toLocaleString());
        $bsr.text("#" + product.bsr);
        $isbn.text(product.isbn);
        $pages.text(product.pages);
        product.estSale = parseInt(_background.estimation(product.bsr));
        $revenue.text(product.currency + Number(parseInt((parseInt(product.price || 1) * parseInt(product.estSale || 1)))).toLocaleString());
        
        $estSales.text(Number(product.estSale).toLocaleString());

        let trackingProducts = _background.items().filter(item => item.product.asin == product.asin);
        let trackButton = document.getElementById("product-track");
        if (trackingProducts.length > 0) {
            trackButton.setAttribute("data-id", trackingProducts[0].product.id);
            trackButton.setAttribute("data-action", "untrack");
            trackButton.textContent = "Untrack this product";
            trackButton.className = "btn btn-danger";
            $(".track-detail-info").show();

            drawChart(trackingProducts[0].product.id);
        } else {
            trackButton.setAttribute("data-id", null);
            trackButton.setAttribute("data-action", "track");
            trackButton.textContent = "Track this product";
            trackButton.className = "btn btn-primary";
            $(".track-detail-info").hide();
            $("#graph-container").children().remove();
            $("#graph-container").append($(`<h4 style="text-align:center;padding-top:140px;">Tracking is not enabled for this title yet.</h4>`));
        }
    }


    const getToken = () => {
        return JSON.parse(localStorage._token || "null");
    };

    const getUser = () => {
        return JSON.parse(localStorage._user || "{}");
    };

    const initializeComponents = () => {
        let settings = _background.get();
        $_category.val(settings.category || "eBooks");
        $_domain.val(settings.domain || "amazon.com");
    }

    /**
     * Switch to the specific step such as register, login, results and tracking.
     * @param {string} step 
     */
    const goTo = (step) => {
        _steps.forEach(function(val) {
            if (step == val) {
                $("#" + val).show();
                if (["track", "tracking-products", "niche-hunters"].indexOf(step) == -1) {
                    _curStep = step;
                    _background.step(step);
                } else if (step == "login") {
                    let credential = _background.credentials();
                    $("#login-email").text(credential.email);
                    $("#login-password").text(credential.email);
                }
            } else {
                $("#" + val).hide();
            }
        });

        if (step == "results") {
            drawTable(true);
        }

        switch(step) {
            case "login":
            case "initial":
                $(".mode-3").hide();
                $(".mode-2").hide();
                $(".mode-4").hide();
                $(".mode-1").show();
                break;

            case "results":
                $(".mode-3").hide();
                $(".mode-1").hide();
                $(".mode-4").hide();
                $(".mode-2").show();
                if (_background.started() && _background.get().products.length < 21) {
                    showLoading();
                }
                break;

            case "niche-hunters":
                $(".mode-3").hide();
                $(".mode-1").hide();
                $(".mode-2").hide();
                $(".mode-4").show();
                break;

            case "track":
                $(".mode-1").hide();
                $(".mode-2").hide();
                $(".mode-4").hide();
                $(".mode-3").show();
                break;
        }
    };

    /**
     * Set token / user via Background methods into local storage.
     * @param {string} token 
     * @param {object} user 
     */
    const setToken = function(token, user) {
        localStorage._token = JSON.stringify(token);
        localStorage._user = JSON.stringify(user);
    };

    /**
     * Event handler for control buttons placed on popup view. With the buttons, user should be able to switch to other views.
     * @param {object} event 
     */
    const controlButtonHandler = function(event) {
        event.preventDefault();

        if (event.target.getAttribute('data-target')) {
            if (event.target.getAttribute('data-action') === "register") {
                _background.register($("#username").val(), $("#email").val(), $("#password").val(), function(response) {
                    if (response.status) {
                        setToken(response.token, response.user);
                        goTo(event.target.getAttribute('data-target'));
                    }
                });
            } else if (event.target.getAttribute('data-action') === "login") {
                _background.login($("#login-email").val(), $("#login-password").val(), (response) => {
                    if (response.status) {
                        setToken(response.token, response.user);
                        $(".login-error-msg").hide();
                        updateTable();
                        goTo(event.target.getAttribute('data-target'));
                    } else {
                        $(".login-error-msg").show();
                    }
                }, (response) => {
                    $(".login-error-msg").show();
                });
            } else if (event.target.getAttribute('data-action') === "logout") {
                localStorage._token = JSON.stringify(null);
                goTo(event.target.getAttribute('data-target'));
            } else {
                goTo(event.target.getAttribute('data-target'));
            }
        } else {
            if (event.target.getAttribute('data-action') === "done") {
            }
        }
    };

    const showLoading = () => {
        $("#lading-mask").show();
    }

    const hideLoading = () => {
        $("#lading-mask").hide();
    }

    /**
     * Initialize Events for components.
     */
    const initEvents = () => {
        $("button.step-control-button").click(controlButtonHandler);
        $("button#product-track").click((event) => {
            event.preventDefault();
            switch (event.target.getAttribute('data-action')) {
                case "track":
                    _background.track(_selectedProduct, (response) => {
                        console.log(response);
                        event.target.setAttribute("data-action", "untrack");
                        event.target.setAttribute("data-id", response.product.id);
                        event.target.textContent = "Untrack this product";
                        event.target.className = "btn btn-danger";
                    }, (response) => {
                        //  To do in failure.
                        if (response.status == false && response.message == "Your token was expired.") {
                            goTo("login");
                        }
                    })
                    break;

                case "untrack":
                    let productID = event.target.getAttribute("data-id");
                    _background.untrack(productID, (response) => {
                        event.target.setAttribute("data-action", "track");
                        event.target.setAttribute("data-id", null);
                        event.target.textContent = "Track this product";
                        event.target.className = "btn btn-primary";
                    }, (response) => {
                        //  To do in failure.
                        if (response.status == false && response.message == "Your token was expired.") {
                            goTo("login");
                        }
                    })
                    break;

                default:
                    console.log("Unknown things occured.");
            }
            // restAPI.
        });

        if (!getToken() || !(getUser() || {}).id) {
            if (!JSON.parse(localStorage._curStep || "null")) {
                _curStep = "initial";
            } else {
                _curStep = "login";
            }
        }
        
        goTo(_curStep);
        if (_background.samples().length == 0) {
            _background.updateSamples(() => {
                initializeComponents();
            }, (response) => {
                //  To do in failure.
                if (response.status == false && response.message == "Your token was expired.") {
                    if (JSON.parse(localStorage._token || "null")) {
                        goTo("login");
                    }
                }
            });
        } else {
            initializeComponents();
        }

        $(document)
        .on("click", ".logout", (event) => {
            _background.logout(() => {
                goTo("login");
            });
        })
        .on("click", "span.main-nav-link", (event) => {
            let targetId = event.target.getAttribute("data-target");
            updateTrackingProductsTable();
            drawNicheHunterTable()
            goTo(targetId);
        })
        .on("click", ".icon-export", (event) => {
            event.preventDefault();
            let from = event.target.getAttribute("data-from");
            let products = null;

            if (from == "results") {
                products = _background.get().products;
                downloadProductsToCSV(products);
            } else if (from == "niche-hunter") {
                products = _nicheHunters;
                downloadProductsToCSV(products);
            } else if (from == "track") {
                downloadProduct(_selectedProduct);
            }
        })
        .on("click", "a.track-product", (event) => {
            let index = event.target.getAttribute("data-index");
            let $record = $(event.target).parents("tr");
            let option = event.target.getAttribute("data-from");
            let product = _products[index];

            _background.track(product, (response) => {
                $record.addClass("tracking");
                $(event.target)
                .attr({
                    "data-id": response.product.id,
                    "title": "Untrack this title."
                })
                .text("UnTrack")
                .removeClass("track-product")
                .addClass("untrack-product");

                let curCount = parseInt(JSON.parse($(".tracking-count").eq(0).text() || "0"));
                curCount++;
                $(".tracking-count").text(curCount);
            }, (response) => {
                //  To do in failure.
                if (response.status == false && response.message == "Your token was expired.") {
                    goTo("login");
                }
            });
        })
        .on("click", "a.untrack-product", (event) => {
            let id = event.target.getAttribute("data-id");
            let option = event.target.getAttribute("data-from");
            let $record = $(event.target).parents("tr");
            
            _background.untrack(id, (response) => {
                if (option == "tracking-list") {
                    $record.remove();
                } else {
                    $record.removeClass("tracking");
                    $(event.target)
                    .attr({
                        "title": "Track this title."
                    })
                    .text("Track")
                    .addClass("track-product")
                    .removeClass("untrack-product")
                }

                let curCount = parseInt(JSON.parse($(".tracking-count").eq(0).text() || "0"));
                curCount--;
                $(".tracking-count").text(Math.max(curCount, 0));
            }, (response) => {
                //  To do in failure.
                if (response.status == false && response.message == "Your token was expired.") {
                    goTo("login");
                }
            });
        })
        .on("click", "table .view-track", (event) => {
            let index = event.target.getAttribute("data-index");
            let items = _background.items();
            let product = items[index];
            
            _background.item(product.product.id, (response) => {
                debugger;
                product = response.product;
                renderTrackForm(product, true);
                goTo("track");
            }, (response) => {
                //  To do in failure.
                if (response.status == false && response.message == "Your token was expired.") {
                    goTo("login");
                }
            })
        })
        .on("change", "#domain", (event) => {
            event.preventDefault();

            if (event.target.value == "amazon.com.au") {
                $("#category").children("option.category-books").remove().val("eBooks");
                _background.set({
                    category: "eBooks"
                });
            } else if ($("#category").children("option.category-books").length == 0) {
                $("#category").append($("<option/>").attr({
                    class: "category-books",
                    value: "Books"
                }).text("Books"))
            }

            _background.updateSamples((samples) => {
                _background.set({
                    domain: event.target.value,
                    products: []
                });
                _background.started(false);
                updateTable();
            }, (response) => {
                //  To do in failure.
                if (response.status == false && response.message == "Your token was expired.") {
                    goTo("login");
                }
            });
        })
        .on("change", "#category", (event) => {
            event.preventDefault();

            _background.updateSamples((samples) => {
                _background.set({
                    category: event.target.value,
                    products: []
                });
                _background.started(false);

                updateTable();
            }, (response) => {
                //  To do in failure.
                if (response.status == false && response.message == "Your token was expired.") {
                    goTo("login");
                }
            });
        })
        .on("change", "#revenue_option", (event) => {
            _revenueOption = event.target.value;
            localStorage._revenue_option = JSON.stringify(_revenueOption);
            drawTable(true);
        })
        .on("click","#results-table th", (event) => {
            let sortTarget = event.target.getAttribute("sort-target");

            if (!sortTarget) {
                return false;
            }

            _curSortColumn = sortTarget;
            let curOption = event.target.getAttribute("sort-option") || "asc";
            _sortOption = ["asc", "desc"].filter(option => option != curOption)[0];
            event.target.setAttribute("sort-option", _sortOption);

            drawTable(true);
        })
        .on("change", "#niche-hunters-search-param", (event) => {
            let paramString = event.target.value;
            drawNicheHunterTable(paramString);
        })
    };

    /**
     * Update tracking products table.
     */
    const updateTrackingProductsTable = () => {
        let items = _background.items();
        let $tableBody = $("table#tracking-products-table tbody");
        $tableBody.children().remove();

        for (let i = 0; i < items.length; i ++) {
            let daysTracking = 1;
            let curProduct = items[i].product;
            if (curProduct.created_at != curProduct.updated_at) {
                let first = curProduct.created_at;
                let last = curProduct.updated_at;
                let tmp = parseInt((new Date(last) - new Date(first)) / (24 * 3600 * 1000));

                if (tmp > 1) {
                    daysTracking = tmp;
                }
            }
            $tableBody.append(
                $("<tr/>").append(
                    $("<td/>").text(i + 1),
                    $("<td/>").html(
                        `<a href="${items[i].product.url}" target="_newTab">${truncateString(items[i].product.title, 40)}</a>`
                    ),
                    $("<td/>").text(daysTracking),
                    $("<td/>").html(
                        `<a class='view-track' data-index='${i}'>View</a>`
                    ),
                    $("<td/>").html(
                        `<a class="untrack-product" data-from="tracking-list" data-id="${items[i].product.id}">UnTrack</a>`
                    )
                )
            )
        }
    }

    /**
     * Update products table.
     */
    const updateTable = () => {
        let {pattern, http, https} = getSearchUrl();
        let products = _background.get().products;
        let trackingProducts = _background.items();
        let $trackingCount = $(".tracking-count");

        $trackingCount.text(trackingProducts.length);

        // if (products.length == 0 && !_background.started()) {
            chrome.tabs.query({url: pattern}, (tabs) => {
                if (tabs.length > 0) {
                    _background.set({
                        curTab: tabs[0].id
                    });

                    _curTabId = tabs[0].id;

                    chrome.tabs.update(tabs[0].id, {active:true}, () => {
                        let status = _background.get();
                        initEvents();

                        // if (!_background.started()) {
                        //     chrome.tabs.sendMessage(tabs[0].id, {
                        //         from: "popup",
                        //         action: "get_data",
                        //         domain: status.domain,
                        //         category: status.category,
                        //         page: status.page || 1
                        //     }, (response) => {
                        //         if (response == undefined) {
                        //             _background.started(false);
                        //         } else {
                        //             _background.started(response.started);
                        //         }
                        //     });
                        // }
                    });
                } else {
                    chrome.tabs.create({
                        url: http
                    }, (tab) => {
                        _background.set({
                            curTab: tab.id
                        });
                    });
                }
            });
        // } else {
        //     initEvents();
        // }
    }

    /**
     * Initializer of this object. In this method, periodic bot to refresh table will be initialized.
     */
    const init = function() {
        if (_background.get().domain == "amazon.com.au") {
            $("#category").children("option.category-books").remove();
            _background.set({
                category: "eBooks"
            });
        }

        updateTable();

        if (!_globalTimer) {
            _globalTimer = window.setInterval(() => {
                drawTable();
            }, 3000);
        }
        drawNicheHunterTable();

        // _productsTable = $("#results-table").DataTable({
        //     "autoWidth": false
        // });

        $("table#results-table").on("click", "a.track-link", (event => {
            let index = event.target.getAttribute("data-index");
            let product = _products[index];

            _selectedProduct = product;
            renderTrackForm(product);
            goTo("track");
        }));

        if (JSON.parse(localStorage._token || "null")) {
            let userInfo = JSON.parse(localStorage._user);

            $(".user-name").text(userInfo.name);
        }

        $("#revenue_option").val(_revenueOption);

        $(document)
        .on("keypress", "#login-email", (event) => {
            if (event.which == 13 || event.keyCode == 13) {
                if (event.target.value.trim() !== "") {
                    $("#login-password").focus();
                }
            }
        })
        .on("keypress", "#login-password", (event) => {
            if (event.which == 13 || event.keyCode == 13) {
                if ($("#login-email").val().trim() !== "" && $("#login-password").val().trim() != "") {
                    $("#login-submit").click();
                }
            }
        })
    };

    const getSelectedProduct = () => {
        return _selectedProduct;
    }

    return {
        init: init,
        selected: getSelectedProduct
    };
})();

(function(window, jQuery) {
    Popup.init();
})(window, $);