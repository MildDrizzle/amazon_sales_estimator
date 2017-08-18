let Parser = (() => {
    let _started = false;
    let _domain = null;
    let _category = null;
    let _mode = null;

    let _urls = [];
    let _searchPages = [];
    let _products = [];
    let _productsBuffer = [];
    
    let _productPageTimer = null;

    let comPatterns = {
        pagesPattern: /(Flexibound|Hardcover|\sLength|Paperback|book):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Amazon\s(Best\sSellers|Bestsellers)\sRank:\s+#)(\d+((,|.)\d+)*)/g
    };
    let caPatterns = {
        pagesPattern: /(Flexibound|Hardcover|\sLength|Paperback|book):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Amazon\s(Best\sSellers|Bestsellers)\sRank:\s+#)(\d+((,|.)\d+)*)/g
    }
    let auPatterns = {
        pagesPattern: /(Flexibound|Hardcover|\sLength|Paperback|book):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Amazon\s(Best\sSellers|Bestsellers)\sRank:\s+#)(\d+((,|.)\d+)*)/g
    }
    let ukPatterns = {
        pagesPattern: /(Flexibound|Hardcover|\sLength|Paperback|book):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Amazon\s(Best\sSellers|Bestsellers)\sRank:\s+#)(\d+((,|.)\d+)*)/g
    }
    let dePatterns = {
        pagesPattern: /(Geschenkartikel|Taschenbuch|Broschiert|Ausgabe|Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Amazon\sBestseller-Rang:\s+#)(\d+((,|.)\d+)*)/g
    }
    let esPatterns = {
        pagesPattern: /(blanda|impresión|Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Clasificación\sen\slos\smás\svendidos\sde\sAmazon:\s*n.°\s*)(\d+((,|.)\d+)*)/g
    }
    let frPatterns = {
        pagesPattern: /(Broché|Poche|Relié|imprimée)(\s*):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Classement\sdes\smeilleures\sventes\sd\'Amazon:\s*n°)(\d+((,|.)\d+)*)/g
    }
    let inPatterns = {
        pagesPattern: /(Flexibound|Paperback|Hardcover|\sLength|Paperback):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Amazon\s(Best\sSellers|Bestsellers)\sRank:\s+#)(\d+((,|.)\d+)*)/g
    }
    let itPatterns = {
        pagesPattern: /(Copertina\srigida|flessibile|stampa|Hardcover|\sLength|Paperback)(\s*):\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Posizione\snella\sclassifica\sBestseller\sdi\sAmazon:\s+#)(\d+((,|.)\d+)*)/g
    }
    let jpPatterns = {
        pagesPattern: /(大型本|Hardcover|\sLength|Paperback):\s(\d+)/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g,
        bsrPattern: /(Amazon\s(Best\sSellers|Bestsellers)\sRank:\s+#)(\d+((,|.)\d+)*)/g
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
        let asin = ($page.find("input[name='ASIN.0']") || $page.find("#ASIN")).val();
        if (asin == undefined) {
            // debugger;
        }

        let bsrString = (bulletString.match(pattern.bsrPattern) || ["0"])[0].match(/\d+((,|.)\d+)*/g)[0];
        let bsr = parseInt(bsrString.replace(/(,|\.)/g, ""));

        return {
            pages,
            keywords,
            asin,
            bsr,
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

            for (let i = 0; i < $posts.length; i ++) {
                if (!$($posts[i]).hasClass("zg_itemImmersion")) {
                    continue;
                }
                let bsr = parseInt($posts[i].querySelector("span.zg_rankNumber").textContent);

                if (!$posts[i].querySelector(".a-link-normal")) {
                    continue;
                }
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
                                // info.bsr = buffer.bsr;
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
        } else {
            // $posts = $("#zg_centerListWrapper div.zg_itemImmersion");
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
        }
    }

    const initListParser = () => {
        _started = true;
        let $links = $(".zg_page a");
        for (let i = 0; i < $links.length; i ++) {
            let url = $links.eq(i).attr("ajaxurl");
            _urls.push(url);
        }
        parseSearchPage();

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch(request.from) {
                case "popup":
                    if (request.action == "get_data" && request.category == _category) {
                        sendResponse({
                            layout: true,
                            mode: _mode,
                            started: _started,
                            products: _products
                        });
                    }
                    break;
            }
        });
    }

    const initIndividualParser = () => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch(request.from) {
                case "popup":
                    if (request.action == "get_data" && request.category == _category) {
                        sendResponse({
                            layout: true,
                            mode: _mode,
                            started: _started,
                            products: _products
                        });
                    }
                    break;
            }
        });
    }

    /**
     * Initializer of eBook page scraping TOOL.
     * @param {string} domain 
     * @return {void}
     */
    const init = (domain, category, mode) => {
        _domain = domain;
        _category = category;
        _mode = mode;

        if (mode === "list") {
            initListParser();
        } else if (mode === "individual") {
            initIndividualParser();
        }
    };

    return {
        init: init
    }
})();