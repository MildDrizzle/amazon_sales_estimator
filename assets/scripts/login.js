'use strict';

let Login = (function() {
    let _steps = [
            "step_1",
            "step_2",
            "step_3",
            "step_4",
            "login"
        ],

        _curStep = JSON.parse(localStorage._curStep || "null") || "step_1",

        goTo = function(step) {
            _steps.forEach(function(val) {
                if (step == val) {
                    $("#" + val).show();
                    localStorage._curStep = JSON.stringify(step);
                } else {
                    $("#" + val).hide();
                }
            });
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
                    chrome.runtime.sendMessage({
                        from: "login",
                        action: "close_me"
                    });
                }
            }
        },

        init = function() {
            $("button.step-control-button").click(controlButtonHandler);
            goTo(_curStep);
        };

    return {
        init: init
    };
})();

(function(window, jQuery) {
    Login.init();
})(window, $);