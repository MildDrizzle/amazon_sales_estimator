'use strict';

let Popup = (function() {
    let _steps = [
            "step_1",
            "step_2",
            "step_3",
            "step_4",
            "login"
        ],

        _itemsTable = null,

        _curStep = JSON.parse(localStorage._curStep || "null") || "step_1",

        drawTable = function() {
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
        },

        getToken = () => {
            return JSON.parse(localStorage._token);
        },

        getUser = () => {
            return JSON.parse(localStorage._user);
        },

        goTo = (step) => {
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
        },

        setToken = function(token, user) {
            localStorage._token = JSON.stringify(token || "");
            localStorage._user = JSON.stringify(user || {});
        },

        controlButtonHandler = function(event) {
            event.preventDefault();

            if (event.target.getAttribute('data-target')) {
                if (event.target.getAttribute('data-action') === "register") {
                    restAPI.register($("#username").val(), $("#email").val(), $("#password").val(), function(response) {
                        if (response.status) {
                            setToken(response.token, response.user);
                            goTo(event.target.getAttribute('data-target'));
                        }
                    });
                } else if (event.target.getAttribute('data-action') === "login") {
                    restAPI.login($("#login-email").val(), $("#login-password").val(), function(response) {
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
        },

        init = function() {
            $("button.step-control-button").click(controlButtonHandler);
            _itemsTable = $("table#tbl-items").DataTable({
                "autoWidth": false
            });

            if (!getToken() || !(getUser() || {}).id) {
                _curStep = "login";
            }
            goTo(_curStep);
        };

    return {
        init: init
    };
})();

(function(window, jQuery) {
    Popup.init();
})(window, $);