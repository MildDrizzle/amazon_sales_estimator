let EBookParser = (() => {
    let _started = false;
    let _domain = null;
    let _category = "eBooks";

    let _urls = [];
    let _searchPages = [];
    let _products = [];
    let _productsBuffer = [];

    let _searchResultTimer = null;
    let _productPageTimer = null;

    let comPatterns = {
        pagesPattern: /(Flexibound|Hardcover|\sLength|Paperback|book):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    };
    let caPatterns = {
        pagesPattern: /(Flexibound|Hardcover|\sLength|Paperback|book):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let auPatterns = {
        pagesPattern: /(Flexibound|Hardcover|\sLength|Paperback|book):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let ukPatterns = {
        pagesPattern: /(Flexibound|Hardcover|\sLength|Paperback|book):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let dePatterns = {
        pagesPattern: /(Geschenkartikel|Taschenbuch|Broschiert|Ausgabe|Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let esPatterns = {
        pagesPattern: /(blanda|impresión|Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let frPatterns = {
        pagesPattern: /(Broché|Poche|Relié|imprimée)(\s*):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let inPatterns = {
        pagesPattern: /(Flexibound|Paperback|Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let itPatterns = {
        pagesPattern: /(Copertina\srigida|flessibile|stampa|Hardcover|\sLength|Paperback)(\s*):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let jpPatterns = {
        pagesPattern: /(大型本|Hardcover|\sLength|Paperback):\s(\d+)/g,
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
        let protocol = window.location.protocol;
        page = parseInt(page);

        if (_domain === "amazon.com") {
            url = `${protocol}//www.amazon.com/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_pg_${page}?_encoding=UTF8&pg=${page}&ajax=1`;
        } else {
            url = `${protocol}//www.${_domain}/gp/bestsellers/digital-text/ref=zg_bs_pg_${page}?ie=UTF8&pg=${page}&ajax=1`;
        }

        return url;
    };


    /**
     * Function to parse necessary product detail info from amazon product detail page.
     * @param {string} text 
     * @param {string} pattern 
     * @return {object}
     */
    const parseProductPage = (text, pattern) => {
        let $page = $(text);
        let bulletString = (($page.find("#productDetailsTable .content ul").length > 0) 
                        ? $page.find("#productDetailsTable .content ul").eq(0).children("li") 
                        : $page.find("#detail_bullets_id .content ul")).text().trim();

        let pages = (bulletString.match(pattern.pagesPattern) || [""])[0].trim().split(" ")[1];

        let priceText = ($page.find("#tmmSwatches .swatchElement.selected span.a-color-base").text() || "");
        let price = (priceText.match(/\d+(.|,)\d+/g) || ["0"])[0];
        priceText = priceText.substr(0, priceText.indexOf(price)).trim();
        let tags = priceText.split(" ");
        let currency = tags[tags.length - 1];

        let prefix = '<meta name="keywords" content="';
        let suffix = '" />';
        let pos = text.indexOf(prefix) + prefix.length;
        let tmp = text.substr(pos);
        pos = tmp.indexOf(suffix);
        let keywords = tmp.substr(0, pos).trim();
        let isbn = "";
        let asin = $page.find("input[name='ASIN.0']").val();
        if (asin == undefined) {
            // debugger;
        }

        return {
            pages,
            keywords,
            asin,
            price,
            currency,
            isbn
        };
    };

    /**
     * Parse the current search result page or the search page respone(Ajax)
     * @param {string} pageContent 
     * @return {void}
     */
    const parseSearchPage = (pageContent) => {
        let $posts = null;
        let data = [];

        if (pageContent) {
            $posts = $(pageContent);
        } else {
            $posts = $("#zg_centerListWrapper div.zg_itemImmersion");
        }

        for (let i = 0; i < $posts.length; i ++) {
            if (!$($posts[i]).hasClass("zg_itemImmersion")) {
                continue;
            }
            let bsr = parseInt($posts[i].querySelector("span.zg_rankNumber").textContent);
            let url = $posts[i].querySelector(".a-link-normal").href;
            let img = $posts[i].querySelector(".a-link-normal img").src;
            let $titleTag = $($posts[i]).find(".a-section.a-spacing-mini").eq(0).next();
            let title = ($titleTag.attr("title") || $titleTag.text()).trim();
            let priceText = $($posts[i]).find(".p13n-sc-price").eq(0).text().trim();
            let price = (priceText.match(/\d+(.|,)\d+/g) || [null])[0];
            
            priceText = priceText.substr(0, priceText.indexOf(price)).trim();
            if (price) {
                price = price.replace(/,/g, ".");
            }

            let tags = priceText.split(" ");
            let currency = tags[tags.length - 1];
            let reviews = ($($posts[i]).find("a.a-size-small.a-link-normal").text() || "0").trim();
            reviews = reviews.replace(/,/g, "");
            reviews = parseInt(reviews);

            _productsBuffer.push({
                bsr,
                url,
                img,
                title,
                price,
                currency,
                reviews
            });
        }

        _productPageTimer = window.setInterval(() => {
            let buffer = _productsBuffer.shift();

            if (buffer == undefined) {
                clearInterval(_productPageTimer);
                let bufferUrl = _urls.shift();

                if (bufferUrl == undefined) {
                    _started = false;
                } else {
                    $.ajax({
                        url: bufferUrl,
                        method: "GET",
                        success: (response) => {
                            parseSearchPage(response);
                        }
                    });
                }
            } else {
                $.ajax({
                    url: buffer.url,
                    method: "GET",
                    success: (response) => {
                        let info = parseProductPage(response, regPatterns[_domain]);
                        if (info) {
                            info.url = buffer.url;
                            info.bsr = buffer.bsr;
                            info.img = buffer.img;
                            info.title = buffer.title;
                            info.reviews = buffer.reviews;
                            info.price = buffer.price || info.price;
                            switch(_domain) {
                                case "amazon.in":
                                    info.currency = "INR";
                                    break;
                                
                                case "amazon.com.au":
                                    info.currency = "AUD";
                                    break;

                                default:
                                    info.currency = (buffer.currency != "") ? buffer.currency : info.currency;
                                    break;
                            }

                            _products.push(info);
                            // if (_products.length > 99) {
                            //     _started = false;
                            // }
                        }
                    }
                });
            }
            
        }, 1000);
    }

    /**
     * Initializer of eBook page scraping TOOL.
     * @param {string} domain 
     * @return {void}
     */
    const init = (domain) => {
        _domain = domain;
        _started = true;
        parseSearchPage();
        for (let i = 2; i < 6; i ++) {
            let url = getSearchPageUrl(domain, i);
            _urls.push(url);
        }
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch(request.from) {
                case "popup":
                    if (request.action == "get_data" && request.category == _category) {
                        sendResponse({
                            started: _started,
                            products: _products
                        });
                    }
                    break;
            }
        })
    };

    return {
        init: init
    }
})();