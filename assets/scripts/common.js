'use strict';
let _mainHost = null;
// let env = "dev";
// let env = "staging";
let env = "product";

if (env == "dev") {
	_mainHost = "http://localhost:8000/";
} else if (env == "staging") {
	_mainHost = "http://54.210.141.168/";
} else {
	_mainHost = "http://34.230.77.124/";
}

/**
 * Object to manage API calls to Backend APIs.
 */
let restAPI = (function(window, jQuery) {

	let _v1ApiBaseUrl = _mainHost + "api/v1/";
	let _settings = {
		"url": _v1ApiBaseUrl + "iSamples",
		"method": "POST",
		"data": {  },
		"headers": {
			"accept": "application/json"
		}
	};

	/**
	 * Send request to API to the specific url with given params.
	 * @param {string} url 
	 * @param {object} params 
	 * @param {function} success 
	 * @param {function} failure 
	 */
	const sendRequest = (url, params, success, failure) => {
		_settings.url = url;
		_settings.data = params;
		$.ajax(_settings).done((response) => {
			if (response.status) {
				if (typeof success === "function") {
					success(response);
				}
			} else {
				if (response.message == "Your token was expired.") {
					localStorage._token = JSON.stringify(null);
					localStorage._user = JSON.stringify({});
				}
				if (typeof failure === "function") {
					failure(response);
				}
			}
		});
	}

	/**
	 * Logout and go to login panel
	 * @param {function} callback 
	 * @return {void}
	 */
	const logout = (callback) => {
		localStorage._token = JSON.stringify(null);
		localStorage._user = JSON.stringify({});
		localStorage._curStep = JSON.stringify("login");

		if (typeof callback === "function") {
			callback();
		}
	}

	/**
	 * Getting initial sample parameters to compute estimation of unit sales.
	 * @param {string} domain 
	 * @param {string} category 
	 * @param {function} success 
	 * @param {function} failure 
	 */
	const getInitialSamples = (domain, category, success, failure) => {
		let params = {
			domain: domain,
			category: category,
			token: JSON.parse(localStorage._token || "null"),
		}

		sendRequest(_v1ApiBaseUrl + "iSamples", params, success, failure);
	};

	/**
	 * Track a product.
	 * @param {string} domain 
	 * @param {string} category 
	 * @param {object} product 
	 * @param {function} success 
	 * @param {function} failure 
	 * @return {void}
	 */
	const trackProduct = (domain, category, product, success, failure) => {
		product.domain = domain;
		product.category = category;
		product.token = JSON.parse(localStorage._token);
		product.est = product.estSale;
		product.monthly_rev = parseInt(parseFloat(product.price) * product.est);

		sendRequest(_v1ApiBaseUrl + "items/new", product, success, failure);
	}

	/**
	 * Getting Histories for a product being tracked.
	 * @param {number} id 
	 * @param {function} success 
	 * @param {function} failure 
	 * @return {void}
	 */
	const getHistories = (id, success, failure) => {
		let params = {
			token: JSON.parse(localStorage._token),
			id: id
		};

		sendRequest(_v1ApiBaseUrl + "items/get", params, success, failure);
	};

	/**
	 * Unwatch a product/Stop tracking a product.
	 * @param {number} id 
	 * @param {funtion} success 
	 * @param {function} failure 
	 * @return {void}
	 */
	const untrackProduct = (id, success, failure) => {
		let params = {
			token: JSON.parse(localStorage._token),
			id: id
		};

		sendRequest(_v1ApiBaseUrl + "items/del", params, success, failure);
	}

	/**
	 * Getting all of products being tracked by authenticated user for given domain and category.
	 * @param {string} domain 
	 * @param {string} category 
	 * @param {function} success 
	 * @param {function} failure 
	 */
	const getTrackingProducts = (domain, category, success, failure) => {
		// console.log(localStorage);
		let params = {
			domain: domain,
			category: category,
			token: JSON.parse(localStorage._token),
		}
		sendRequest(_v1ApiBaseUrl + "items", params, success, failure);
	}

	const findTrackingProduct = (productId, success, failure) => {
		let params = {
			token: JSON.parse(localStorage._token),
			id: productId
		}

		sendRequest(_v1ApiBaseUrl + "items/get", params, success, failure);
	}

	/**
	 * Register user with name, email address and password.
	 * @param {string} name 
	 * @param {string} email 
	 * @param {string} password 
	 * @param {function} callback 
	 * @param {function} failure
	 */
	const register = function(name, email, password, success, failure) {
		let params = {
			name: name,
			email: email,
			password: password
		};

		sendRequest(_v1ApiBaseUrl + "register", params, success, failure);
	};

	/**
	 * Login with email address and password.
	 * @param {string} email 
	 * @param {string} password 
	 * @param {function} success 
	 * @param {function} failure
	 */
	const login = function(email, password, success, failure) {
		let params = {
			email: email,
			password: password
		}

		sendRequest(_v1ApiBaseUrl + "login", params, success, failure);
	};

	return {
		base: _mainHost,
		apiBaseUrl: _v1ApiBaseUrl,
		trackings: getTrackingProducts,
		findTrack: findTrackingProduct,
		track: trackProduct,
		untrack: untrackProduct,
		histories: getHistories,
		samples: getInitialSamples,
		register: register,
		login: login,
		logout: logout
	};
	
})(window, $)