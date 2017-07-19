let EBookParser = (() => {
    let _urls = [],
        _detail = {};
    
    let _searchPages = [];
    let _products = [];

    let comPatterns = {
        pagesPattern: /(Hardcover|\sLength|Paperback):\s(\d+)\spages/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    };
    let caPatterns = {
        pagesPattern: /(Hardcover|\sLength|Paperback):\s(\d+)\spages/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let auPatterns = {
        pagesPattern: /(Hardcover|\sLength|Paperback):\s(\d+)\spages/g,
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
        // pagesPattern:/Relié:\s(\d+)\s/g,
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
     * Getting the proper amazon BSR based eBooks search page with given domain and page number.
     * @param {string} domain 
     * @param {number} page 
     */
    const getSearchPageUrl = (domain, page) => {
        let url = null;
        page = parseInt(page);

        if (domain === "amazon.com") {
            url = `https://www.amazon.com/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_pg_${page}?_encoding=UTF8&pg=${page}&ajax=1`;
        } else {
            url = `https://www.${domain}/gp/bestsellers/digital-text/ref=zg_bs_pg_${page}?ie=UTF8&pg=${page}&ajax=1`;
        }

        return url;
    };

    /**
     * Function to parse necessary product detail info from amazon product detail page.
     * @param {string} text 
     * @param {string} pattern 
     * @return {object}
     */
    const extractInfo = (text, pattern) => {
        let $page = $(text);
        let title = $page.find("#ebooksProductTitle").text().trim();

        if (!$page.find("#ebooks-img-canvas img").eq(0).attr("data-a-dynamic-image")) {
            return false;
        }
        
        let tmpImgObj = JSON.parse($page.find("#ebooks-img-canvas img").eq(0).attr("data-a-dynamic-image"));
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
        let bulletString = (($page.find("#productDetailsTable .content ul").length > 0) ? $page.find("#productDetailsTable .content ul").eq(0).children("li") : $page.find("#detail_bullets_id .content ul")).text().trim();
        // let pages = bulletString.match(/(\d+)\spages/g)[0].trim().split(" ")[0];
        let pages = (bulletString.match(pattern.pagesPattern) || [""])[0].trim().split(" ")[1];
        if (!pages) {
            debugger;
        }
        let prefix = '<meta name="keywords" content="';
        let suffix = '" />';
        let pos = text.indexOf(prefix) + prefix.length;
        let tmp = text.substr(pos);
        pos = tmp.indexOf(suffix);
        let keywords = tmp.substr(0, pos).trim();

        // let isbn = (bulletString.match(/ISBN:\s(\d+)/g) || ["a none"])[0].split(" ")[1];
        let isbn = "";
        let asin = $page.find("input[name='ASIN.0']").val();
        // let bsr = $page.find("#SalesRank").text().trim().match(/(\d+)\s/g)[0].match(/\d+/g)[0];
        // let reviewText = $page.find("#acrCustomerReviewText").text();
        // let reviews = parseInt(reviewText.match(/(\d+,*)(\d+)*/g)[0].replace(/,/g, ''));

        return {
            title,
            price,
            img,
            currency,
            pages,
            keywords,
            asin,
            isbn
        };
    };

    /**
     * Function to send ajax request to amazon product detail page and send request to parse product detail and seed data to Background Script.
     * @param {string} url 
     * @param {number} bsr 
     * @param {number} reviews 
     * @param {string} domain 
     * @return {void}
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
     * Parse the search result page and get all of product result pages from the url given by trigger.
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
     * Trigger to scraping all of products from BSR based amazon search result pages.
     * @param {string} domain 
     * @param {number} page 
     * @return {void}
     */
    const extractProducts = (domain, page) => {
        let searchUrl = _searchPages.shift();

        if (searchUrl) {
            $.ajax({
                url: searchUrl,
                method: "GET",
                success: (response) => {
                    parseSearchResult(response, domain);
                    extractProducts(domain);
                }
            });
        } else {
            //
            parseDetail();
        }
    };

    /**
     * Initializer of eBook page scraping TOOL.
     * @param {string} domain 
     * @return {void}
     */
    const init = (domain) => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            let page = (request.page) ? request.page : 1;
            if (request.category === "eBooks" && request.action == "get_data") {
                _searchPages = [];
                _products = [];
                for (let i = 1; i < 6; i ++) {
                    _searchPages.push(getSearchPageUrl(domain, i))
                }
                extractProducts(domain, page);
                sendResponse({
                    started: true
                });
            }
        })
    };

    return {
        init: init
    }
})();