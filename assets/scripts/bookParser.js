let BookParser = (() => {
    let _urls = [],
        _detail = {};

    let comPatterns = {
        pagesPattern: /Hardcover:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    };
    let caPatterns = {
        pagesPattern: /Paperback:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let auPatterns = {
        pagesPattern: /Hardcover:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let ukPatterns = {
        pagesPattern: /Hardcover:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let dePatterns = {
        pagesPattern: /Ausgabe:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let esPatterns = {
        pagesPattern: /blanda:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let frPatterns = {
        pagesPattern: /Broché:\s(\d+)\s/g,
        // pagesPattern:/Relié:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let inPatterns = {
        pagesPattern: /Paperback:\s(\d+)\s/g,
        isbnPattern: /ISBN\-13:\s(\d+\-\d+)/g
    }
    let itPatterns = {
        pagesPattern: /flessibile:\s(\d+)\s/g,
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

    const getSearchPageUrl = (domain, page) => {
        let url = null;
        page = parseInt(page);

        if (domain === "amazon.com") {
            url = `https://www.amazon.com/best-sellers-books-Amazon/zgbs/books/ref=zg_bs_pg_${page}?_encoding=UTF8&pg=${page}&ajax=1`;
        } else {
            url = `https://www.${domain}/gp/bestsellers/books/ref=zg_bs_pg_${page}?ie=UTF8&pg=${page}&ajax=1`;
        }

        return url;
    };

    const extractInfo = (text, pattern) => {
        let $page = $(text);
        let title = $page.find("#productTitle").text().trim();
        let tmpImgObj = JSON.parse($page.find("#img-canvas img#imgBlkFront").eq(0).attr("data-a-dynamic-image"));
        let img = null;
        for (p in tmpImgObj) {
            img = p;
            break;
        }
        let priceText = $page.find("#tmmSwatches .swatchElement.selected span.a-color-base").text().trim();
        let price = priceText.match(/(\d+.)\d+/g)[0];
        let currency = priceText.replace(/(\d+.*)(\d+)/g, '').trim();
        let bulletString = (($page.find("#productDetailsTable .content ul").length > 0) ? $page.find("#productDetailsTable .content ul") : $page.find("#detail_bullets_id .content ul")).text().trim();
        let pages = (bulletString.match(pattern.pagesPattern) || [""])[0].trim().split(" ")[1];
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
            isbn
            // bsr,
            // reviews
        };
    };

    const parseDetail = (url, bsr, reviews, domain) => {
        $.ajax({
            url: url,
            method: "GET",
            success: (response) => {
                let info = extractInfo(response, regPatterns[domain]);
                info.url = url;
                info.bsr = bsr;
                info.reviews = reviews;
                chrome.runtime.sendMessage({
                    from: "amazon",
                    action: "product-info",
                    data: info
                });
            }
        });
    }

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
            urls.push(anchor);

            if (anchor) {
                parseDetail(anchor, bsr, reviews, domain);
                break;
            }
        }
    }

    const extractProducts = (domain, page) => {
        let searchUrl = getSearchPageUrl(domain, page);

        $.ajax({
            url: searchUrl,
            method: "GET",
            success: (response) => {
                parseSearchResult(response, domain);
            }
        })
        console.log(searchUrl);
    };
    let init = (domain) => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            let page = (request.page) ? request.page : 1;
            if (request.category == "Books") {
                extractProducts(domain, page);
            }
        })
    };

    return {
        init: init
    }
})();