let BookParser = (() => {
    let _urls = [],
        _detail = {};

    let _searchPages = [];
    let _products = [];

    let _started = false;

    let comPatterns = {
        pagesPattern: /(Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    };
    let caPatterns = {
        pagesPattern: /(Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let auPatterns = {
        pagesPattern: /(Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let ukPatterns = {
        pagesPattern: /(Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let dePatterns = {
        pagesPattern: /Ausgabe:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let esPatterns = {
        pagesPattern: /(blanda|impresión):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let frPatterns = {
        pagesPattern: /(Broché|Poche|imprimée)(\s*):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let inPatterns = {
        pagesPattern: /Paperback:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let itPatterns = {
        pagesPattern: /(flessibile|stampa)(\s*):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let jpPatterns = {
        pagesPattern: /大型本:\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let regPatterns = {
        "amazon.com": comPatterns,
        "amazon.ca": caPatterns,
        "amazon.com.au": auPatterns,
        "amazon.co.uk": ukPatterns,
        "amazon.de": dePatterns,
        "amazon.es": esPatterns,
        "amazon.fr": frPatterns,
        "amazon.in": inPatterns,
        "amazon.it": itPatterns,
        "amazon.co.jp": jpPatterns
    }

    /**
     * Getting a proper amazon Best Seller Ranking url for Books category for the given page.
     * @param {string} domain 
     * @param {number} page 
     * @return {string}
     */
    const getSearchPageUrl = (domain, page) => {
        let url = null;
        let protocol = window.location.protocol;
        page = parseInt(page);

        if (domain === "amazon.com") {
            url = `${protocol}//www.amazon.com/best-sellers-books-Amazon/zgbs/books/ref=zg_bs_pg_${page}?_encoding=UTF8&pg=${page}&ajax=1`;
        } else {
            url = `${protocol}//www.${domain}/gp/bestsellers/books/ref=zg_bs_pg_${page}?ie=UTF8&pg=${page}&ajax=1`;
        }

        return url;
    };

    /**
     * Parse an amazon product detail page and extract price, currency, pages, isbn, asin, etc and return them in an object.
     * @param {string} text 
     * @param {RegEx} pattern 
     * @return {object}
     */
    const extractInfo = (text, pattern) => {
        let $page = $(text);
        let title = $page.find("#productTitle").text().trim();
        let tmpImgObj = JSON.parse($page.find("#imgBlkFront").eq(0).attr("data-a-dynamic-image"));
        let img = null;
        for (p in tmpImgObj) {
            img = p;
            break;
        }
        let priceText = $page.find("#tmmSwatches .swatchElement.selected span.a-color-base").text().trim();
        if (!priceText.match(/(\d+.)\d+/g)) {
            priceText = $page.find("#tmmSwatches .swatchElement span.a-color-secondary").eq(0).text().trim();
            if (!priceText.match(/(\d+.)\d+/g)) {
                return false;
            }
        }
        let price = (priceText.match(/(\d+.)\d+/g) || [""])[0];
        let currency = priceText.replace(/(\d+.*)(\d+)/g, '').trim();
        let tempTags = currency.split(" ");
        currency = (tempTags.length > 0) ? tempTags[tempTags.length - 1] : currency;
        let bulletString = (($page.find("#productDetailsTable .content ul").length > 0) ? $page.find("#productDetailsTable .content ul") : $page.find("#detail_bullets_id .content ul")).text().trim();
        let pages = (bulletString.match(pattern.pagesPattern) || [""])[0].trim().split(" ")[1];
        if (pages == "") {
            debugger;
        }
        let prefix = '<meta name="keywords" content="';
        let suffix = '" />';
        let pos = text.indexOf(prefix) + prefix.length;
        let tmp = text.substr(pos);
        pos = tmp.indexOf(suffix);
        let keywords = tmp.substr(0, pos).trim();

        let isbn = (bulletString.match(pattern.isbnPattern) || [""])[0].split(" ")[1];
        let asin = $page.find("#ASIN").val();
        // let bsr = $page.find("#SalesRank").text().trim().match(/(\d+)\s/g)[0].match(/\d+/g)[0];
        // let reviewText = $page.find("#acrCustomerReviewText").text();
        // let reviews = parseInt(reviewText.match(/(\d+,*)(\d+)*/g)[0].replace(/,/g, ''));

        return {
            title,
            price,
            img,
            currency,
            pages,
            asin,
            keywords,
            isbn
        };
    };

    /**
     * Build an object with necessary info like ASIN, ISBN, title, bsr, details, etc and feed to background script to store.
     * @param {string} url 
     * @param {number} bsr 
     * @param {number} reviews 
     * @param {string} domain 
     */
    const parseDetail = (url, bsr, reviews, domain) => {
        let curProduct = _products.shift();

        if (curProduct) {
            url = curProduct.url;
            bsr = curProduct.bsr;
            reviews = curProduct.reviews;
            domain = curProduct.domain;

            $.ajax({
                url: url,
                method: "GET",
                success: (response) => {
                    let info = extractInfo(response, regPatterns[domain]);

                    if (info) {
                        info.url = url;
                        info.bsr = bsr;
                        info.reviews = reviews;
                        chrome.runtime.sendMessage({
                            from: "amazon",
                            action: "product-info",
                            data: info
                        });
                    }

                    parseDetail();
                }
            });
        } else {
            chrome.runtime.sendMessage({
                from: "amazon",
                action: "get_data_completed"
            });
        }
    }

    /**
     * Method to parse response text for the amazon best seller ranking search page. This page will parse the response text and extract 
     * detail products page urls.
     * @param {string} text 
     * @param {string} domain 
     * @return {void}
     */
    const parseSearchResult = (text, domain) => {
        let $items = $(text);
        let urls = [];

        for (let i = 0; i < $items.length; i ++) {
            if (!$items.eq(i).hasClass("zg_itemImmersion")) {
                continue;
            }
            let anchor = ($items.eq(i).find("a.a-link-normal")[0] || {}).href;
            let bsr = ($items.eq(i).find(".zg_rankNumber")[0] || {}).textContent.match(/\d+/g)[0];
            let reviews = ($items.eq(i).find("a.a-link-normal.a-size-small")[0] || {}).textContent;
            if (reviews) {
                reviews = reviews.replace(/,/g, '');
            } else {
                reviews = 0;
            }
            
            _products.push({
                bsr,
                reviews,
                domain,
                url: anchor
            });
        }
    }

    /**
     * Function to start parsing the current amazon books given domain and page.
     * @param {string} domain 
     * @param {number} page 
     * @return {void}
     */
    const extractProducts = (domain, page) => {
        // let searchUrl = getSearchPageUrl(domain, page);
        let searchPageUrl = _searchPages.shift();

        if (searchPageUrl) {
            $.ajax({
                url: searchPageUrl,
                method: "GET",
                success: (response) => {
                    parseSearchResult(response, domain);
                    extractProducts(domain);
                }
            })
        } else {
            //  To do start parsing detail product.
            parseDetail();
        }
    };

    /**
     * Initializer of Book Parsing Took for the given domain. This will be executed by message sent from backgroudn script.
     * So when user choose "Books" category in Popup.
     * @param {string} domain 
     * @return {void}
     */
    const init = (domain) => {
        domain = window.location.host.substr("www.".length);
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            let page = (request.page) ? request.page : 1;
            if (request.category == "Books" && request.action == "get_data") {
                _searchPages = [];
                _products = [];
                _started = true;

                for (let i = 1; i < 6; i ++) {
                    _searchPages.push(getSearchPageUrl(domain, i));
                }
                extractProducts(domain, page);
                sendResponse({
                    started: true
                });
            } else if (request.category == "Books" && request.action == "stop") {
                _started = false;
            }
        })
    };

    return {
        init: init
    }
})();