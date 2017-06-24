'use strict';

let Popup = (function() {
    let _steps = [
            "step_1",
            "step_2",
            "step_3",
            "results",
            "track",
            "login"
        ];

    let _itemsTable = null;

    let selectedProduct = null;

    let _curStep = JSON.parse(localStorage._curStep || "null") || "step_1";

    let _background = chrome.extension.getBackgroundPage().Background;

    let $_category = $("#category");
    let $_domain = $("#domain");

    let _globalTimer = null;

    let drawTable = function() {
        let products = _background.get().products,
            index = 1,
            $tbody = $("table#results tbody");
        
        $tbody.children().remove();

        for (let i = 0; i < products.length; i ++) {
            let $record = $("<tr/>");
            
            $record.append($("<td/>").text(i + 1));
            $record.append($("<td/>").text(products[i].title));
            $record.append($("<td/>").append($("<a/>").addClass("track-link").attr({"data-index": i}).text("Track")));
            $record.append($("<td/>").text(products[i].pages));
            $record.append($("<td/>").text(products[i].price));
            $record.append($("<td/>").text(products[i].estSale));
            $record.append($("<td/>").text(products[i].bsr));

            $record.appendTo($tbody);
        }

        $tbody.on("click", "a.track-link", (event => {
            let index = event.target.getAttribute("data-index");
            let product = _background.get().products[index];

            selectedProduct = product;
            renderTrackForm(product);
            goTo("track");
        }));
    };

    /**
     * Render Tracking product view with specific/selected product. In this view, user will be able to watch/unwatch a product or see chart of the product details.
     * @param {object} product 
     * @return {void}
     */
    const renderTrackForm = (product) => {
        let $img = $("#product-image"),
            $graph = $("#graph-container"),
            $title = $("#product-title"),
            $bsr = $("#product-bsr"),
            $estSales = $("#proudct-estSales"),
            $asin = $("#product-asin");

        $img[0].src = product.img;
        $title.text(product.title);
        $asin.text(product.asin);
        $bsr.text("#" + product.bsr);
    }


    const getToken = () => {
        return JSON.parse(localStorage._token);
    };

    const getUser = () => {
        return JSON.parse(localStorage._user);
    };

    const initializeComponents = () => {
        let settings = _background.get();
        $_category.val(settings.category || "Books");
        $_domain.val(settings.domain || "amazon.com");

        $_category.change((event) => {
            event.preventDefault();
            _background.set({
                category: event.target.value,
                products: []
            });

            _background.updateSamples(() => {
                updateTable();
            });
        });

        $_domain.change((event) => {
            event.preventDefault();
            _background.set({
                domain: event.target.value,
                products: []
            });
            _background.updateSamples(() => {
                updateTable();
            });
        });
    }

    /**
     * Switch to the specific step such as register, login, results and tracking.
     * @param {string} step 
     */
    const goTo = (step) => {
        _steps.forEach(function(val) {
            if (step == val) {
                $("#" + val).show();
                _background.set({
                    _curStep: step
                });
            } else {
                $("#" + val).hide();
            }
        });

        if (step == "results") {
            drawTable();
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
                _background.login($("#login-email").val(), $("#login-password").val(), function(response) {
                    if (response.status) {
                        setToken(response.token, response.user);
                        goTo(event.target.getAttribute('data-target'));
                    }
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

    /**
     * Initialize Events for components.
     */
    const initEvents = () => {
        $("button.step-control-button").click(controlButtonHandler);
        $("button#product-track").click((event) => {
            event.preventDefault();
            switch (event.target.getAttribute('data-action')) {
                case "track":
                    _background.track(selectedProduct, (response) => {
                        console.log(response);
                        event.target.setAttribute("data-action", "untrack");
                        event.target.setAttribute("data-id", response.product.id);
                        event.target.textContent = "Untrack this product";
                        event.target.className = "btn btn-danger pull-right";
                    })
                    break;

                case "untrack":
                    let productID = event.target.getAttribute("data-id");
                    _background.untrack(productID, (response) => {
                        event.target.setAttribute("data-action", "track");
                        event.target.setAttribute("data-id", null);
                        event.target.textContent = "Track this product";
                        event.target.className = "btn btn-primary pull-right";
                    })
                    break;

                default:
                    console.log("Unknown things occured.");
            }
            // restAPI.
        });

        _itemsTable = $("table#tbl-items").DataTable({
            "autoWidth": false
        });

        if (!getToken() || !(getUser() || {}).id) {
            _curStep = "login";
        }
        
        goTo(_curStep);
        if (_background.samples().length == 0) {
            _background.updateSamples(() => {
                initializeComponents();
            });
        } else {
            initializeComponents();
        }
    };

    const updateTable = () => {
        let curUrl = `https://www.${JSON.parse(localStorage._data || "{}").domain || "amazon.com"}/`;
        let products = _background.get().products;

        if (products.length == 0) {
            chrome.tabs.query({url: curUrl + "*"}, (tabs) => {
                if (tabs.length > 0) {
                    _background.set({
                        curTab: tabs[0].id
                    });

                    let status = _background.get();
                    initEvents();

                    chrome.tabs.sendMessage(tabs[0].id, {
                        from: "popup",
                        action: "get_data",
                        domain: status.domain,
                        category: status.category,
                        page: status.page || 1
                    });
                } else {
                    chrome.tabs.create({
                        url: curUrl
                    }, (tab) => {
                        _background.set({
                            curTab: tab.id
                        });
                    });
                }
            });
        } else {
            initEvents();
        }
    }

    /**
     * Initializer of this object. In this method, periodic bot to refresh table will be initialized.
     */
    const init = function() {
        updateTable();

        if (!_globalTimer) {
            _globalTimer = window.setInterval(() => {
                drawTable();
            }, 1000);
        }
    };

    const getSelectedProduct = () => {
        return selectedProduct;
    }

    return {
        init: init,
        selected: getSelectedProduct
    };
})();

(function(window, jQuery) {
    Popup.init();
})(window, $);