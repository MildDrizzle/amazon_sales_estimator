let BookParser = (() => {
    let _urls = [],
        _detail = {};

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

    const extractInfo = (text) => {
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
        let currency = priceText[0];
        let bulletString = $page.find("#productDetailsTable .content ul").text().trim();
        let pages = bulletString.match(/\s(\d+)\spages/g)[0].trim().split(" ")[0];
        let isbn = bulletString.match(/ISBN\-13:\s(\d+\-\d+)/g)[0].split(" ")[1];
        let bsr = bulletString.match(/\#(\d+)\sin\sBooks/g)[0].match(/\d+/g)[0];
        let reviewText = $page.find("#acrCustomerReviewText").text();
        let reviews = parseInt(reviewText.match(/(\d+,)(\d+)/g)[0].replace(/,/g, ''));

        return {
            title,
            price,
            img,
            currency,
            pages,
            isbn,
            bsr,
            reviews
        };
    };

    const parseDetail = (url) => {
        $.ajax({
            url: url,
            method: "GET",
            success: (response) => {
                let info = extractInfo(response);
                info.url = url;
                chrome.runtime.sendMessage({
                    from: "amazon",
                    action: "product-info",
                    data: info
                });
            }
        });
    }

    const parseSearchResult = (text) => {
        let $res = $(text);
        let $items = $res.find(".zg_itemWrapper");
        let urls = [];

        for (let i = 0; i < $items.length; i ++) {
            let anchor = ($items.eq(i).find("a.a-link-normal")[0] || {}).href;
            urls.push(anchor);

            if (anchor) {
                parseDetail(anchor);
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
                parseSearchResult(response);
            }
        })
        console.log(searchUrl);
    };
    let init = (domain) => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            let page = (request.page) ? request.page : 1;
            extractProducts(domain, page);
        })
    };

    return {
        init: init
    }
})();