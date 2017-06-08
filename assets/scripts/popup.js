'use strict';

let Popup = (function() {
    let _steps = [
            "step_1",
            "step_2",
            "step_3",
            "step_4",
            "login"
        ],

        _itemsTable = null;

    let _curStep = JSON.parse(localStorage._curStep || "null") || "step_1";

    let _background = chrome.extension.getBackgroundPage().Background;

    let $_category = $("#category");
    let $_domain = $("#domain");

    let drawTable = function() {
        let data = JSON.parse(localStorage._histories || "{}"),
            index = 1;

        const getUrl = (domain, num) => {
            let url = null;
            switch(domain) {
                case "rightmove.co.uk":
                    url = `http://www.${domain}/property-for-sale/property-${num}.html`;
                    break;

                case "zoopla.co.uk":
                    url = `http://www.${domain}/for-sale/details/${num}`;
                    break;

                case "onthemarket.com":
                    url = `https://www.${domain}/details/${num}/`;
                    break;

                default:
                    break;
            }

            return url;
        }

        for (let domain in data) {
            let items = data[domain];
            for (let itemNum in items) {
                let logs = items[itemNum].histories,
                    img = items[itemNum].img,
                    ref = items[itemNum].ref,
                    item = logs[logs.length - 1],
                    url = getUrl(domain, itemNum);

                _itemsTable.row.add([
                    ref,
                    `<img class="property-img" src="${img}" />`,
                    item.title,
                    item.price,
                    item['address/subtitle'],
                    `<span title='${item.agent.address}'>${item.agent.name}</span>`,
                    `<a class='btn btn-info' target='_blank' href='${url}'>View property</a>`
                ]).draw();

                index ++;
            }
        }
    };

    let getToken = () => {
        return JSON.parse(localStorage._token);
    };

    let getUser = () => {
        return JSON.parse(localStorage._user);
    };

    let initializeComponents = () => {
        let settings = _background.get();
        $_category.val(settings.category || "Books");
        $_domain.val(settings.domain || "amazon.com");

        $_category.change((event) => {
            _background.set({
                category: event.target.value
            });
        });

        $_domain.change((event) => {
            _background.set({
                domain: event.target.value
            });
        });
    }

    let goTo = (step) => {
        _steps.forEach(function(val) {
            if (step == val) {
                $("#" + val).show();
                localStorage._curStep = JSON.stringify(step);
            } else {
                $("#" + val).hide();
            }
        });

        if (step == "step_4") {
            drawTable();
        }
    };

    let setToken = function(token, user) {
        localStorage._token = JSON.stringify(token || "");
        localStorage._user = JSON.stringify(user || {});
    };

    let controlButtonHandler = function(event) {
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
                console.log("Clicking done...");
            }
        }
    };

    let init = function() {
        $("button.step-control-button").click(controlButtonHandler);
        _itemsTable = $("table#tbl-items").DataTable({
            "autoWidth": false
        });

        if (!getToken() || !(getUser() || {}).id) {
            _curStep = "login";
        }
        
        goTo(_curStep);

        initializeComponents();
    };

    return {
        init: init
    };
})();

(function(window, jQuery) {
    Popup.init();
})(window, $);