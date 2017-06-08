'use strict';

let env = "dev";
// let env = "product";

let restAPI = (function(window, jQuery) {
	let _mainHost = null,
		_v1ApiBaseUrl = null;

	if (env == "dev") {
		_mainHost = "http://localhost:8000/";
	} else {
		_mainHost = "http://54.175.85.52/";
	}
	_v1ApiBaseUrl = _mainHost + "api/v1/";

	let register = function(name, email, password, callback) {
			$.ajax({
				url: _v1ApiBaseUrl + "register",
				data: JSON.stringify({
					name: name,
					email: email,
					password: password
				}),
				method: "post",
				contentType: "application/json",
				success: function(res) {
					if (typeof callback == "function") {
						callback(res);
					} else {
						console.log(res);
					}
				}
			});
		},

		login = function(email, password, callback) {
			$.ajax({
				url: _v1ApiBaseUrl + "login",
				data: JSON.stringify({
					email: email,
					password: password
				}),
				method: "post",
				contentType: "application/json",
				success: function(res) {
					if (typeof callback == "function") {
						callback(res);
					} else {
						console.log(res);
					}
				}
			});
		},

		getHistory = function(params, callback) {
			$.ajax({
				url: _v1ApiBaseUrl + "properties",
				data: JSON.stringify(params),
				method: "post",
				contentType: "application/json",
				success: function(res) {
					if (typeof callback === "function") {
						callback(res);
					} else {
						console.log(res);
					}
				}
			})
		};

	return {
		base: _mainHost,
		apiBaseUrl: _v1ApiBaseUrl,
		// getHistory: getHistory,
		register: register,
		login: login
	};
	
})(window, $)