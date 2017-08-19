'use strict';

let Background = (() => {
	let _tabsInfo = {};
	let _data = {
		domain: JSON.parse(localStorage._data || "{}")._domain || "amazon.com",
		category: JSON.parse(localStorage._data || "{}")._category || "eBooks",
		products: []
	};

	let _credentials = {
		email: "",
		password: ""
	};

	let _trackedProducts = [];

	let _restAPI = restAPI;
	let _initialSamples = [];

	let _started = false;

	/**
	 * Getting a proper amazon best seller ranking url according to given domain and category.
	 * @param {string} domain 
	 * @param {string} category 
	 * @return {string}
	 */
	const amazonBaseUrl = (domain, category) => {
		const urls = {
			"Books": {
				"amazon.com": `https://www.${domain}/best-sellers-books-Amazon/zgbs/books/`,
				"others": `https://www.${domain}/gp/bestsellers/books/`
			},
			"eBooks": {
				"amazon.com": `https://www.${domain}/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/`,
				"others": `https://www.${domain}/gp/bestsellers/digital-text/`
			}
		}

		if (domain == "amazon.com") {
			return (domain && category) ? urls[category][domain] : null;
		} else {
			return (domain && category) ? urls[category]["others"] : null;
		}
	};

	/**
	 * Save credentials when a user logs in.
	 * @param {string} email 
	 * @param {password} password 
	 * @return {void}
	 */
	const setCredentials = (email, password) => {
		localStorage._credentials = JSON.stringify({email, password});
		// _credentials = {email, password};
	}

	/**
	 * Function to get username and password.
	 */
	const getCredentials = () => {
		return JSON.parse(localStorage._credentials || "{}");
	}

	/**
	 * Getting a correct amazon best seller ranking eBooks/Books url.
	 * @return {string}
	 */
	const getCurUrl = () => {
		return amazonBaseUrl(_data.domain, _data.category);
	}

	/**
	 * Check if the current user is authenticated. This method should be able to check if the token is expired or not.
	 * @param {function} callback 
	 */
	const checkAuth = (callback) => {
		let _token = JSON.parse(localStorage._token || "null");
		
		if (!_token) {
			chrome.tabs.query({url: chrome.extension.getURL("assets/html/login.html")}, function(tabs) {
				if (tabs.length > 0) {
					chrome.tabs.update(tabs[0].id, {active: true});
				} else {
					chrome.tabs.create({url: chrome.extension.getURL("assets/html/login.html")});
				}
			})
		} else {
			if (typeof callback === "function") {
				callback(_token);
			} else {
				return _token;
			}
		}
	};

	/**
	 * Getting a current data stored in Background object.
	 * @return {object}
	 */
	const getData = () => {
		return _data;
	}

	/**
	 * Setting the current state.
	 * @param {object} params 
	 * @return {void}
	 */
	const setData = (params) => {
		for (let p in params) {
			_data[p] = params[p];
		}
		localStorage._data = JSON.stringify(_data);
	};

	/**
	 * Set the current step with the given step.
	 * @param {string} step 
	 * @return {void}
	 */
	const setStep = (step) => {
		if (step) {
			localStorage._curStep = JSON.stringify(step);
		} else {
			return JSON.parse(localStorage._curStep || "null") || "login";
		}
	}

	/**
	 * Update initial Samples in order to compute coefficients according to given domain and category.
	 * @param {function} success 
	 * @param {function} failure
	 * @return {void}
	 */
	const updateSamples = (success, failure) => {
		let domain = JSON.parse(localStorage._data || "{}")._domain || "amazon.com",
			category = JSON.parse(localStorage._data || "{}")._category || "eBooks";
		_restAPI.samples(domain, category, (response) => {
			let samples = response.samples;
			_initialSamples = samples || [];
			if (typeof success === "function") {
				success(samples);
			}

			_restAPI.trackings(_data.domain, _data.category, (res) => {
				if (res.status) {
					_trackedProducts = res.items;
				}
			});
		}, (response) => {
			localStorage._token = JSON.stringify(null);
			localStorage._user = JSON.stringify({});
			if (typeof failure === "function") {
				failure(response);
			}
		})
	};

	/**
	 * Getting the proper coefficients to be used in computing estimation of monthly unit sales for a product.
	 * In this function, the initial samples data pulled from database will be used.
	 * The result will be {alpha, max}
	 * @param {number} x1 
	 * @param {number} y1 
	 * @param {number} x2 
	 * @param {number} y2 
	 * @return {object}
	 */
	const getCoefficients = (x1, y1, x2, y2) => {
        let sqrtX1 = Math.sqrt(x1),
            sqrtX2 = Math.sqrt(x2 + 1);

        let alpa = (y2 - y1) / (sqrtX1 - sqrtX2);
        let max = (y2 * sqrtX1 - y1 * sqrtX2) / (sqrtX1 - sqrtX2);

        return {alpa, max};
    }

	/**
	 * Getting the estimation of monthly unit sales of a product based on coefficients given by method {getCoefficients}.
	 * @param {number} bsr 
	 * @return {number}
	 */
    const calculate = (bsr) => {
		if (typeof bsr === "string") {
			bsr = parseInt(bsr);
		}

		if (bsr == 0) {
			return 0;
		}
        let _data = _initialSamples;
		let _estimation = null;

        for (let i = 0; i < _data.length; i ++) {
            if (_data[i].max < bsr) {
                continue;
            } else {
                if (i == _data.length - 1) {
                    _estimation = _data[i].est;
                } else {
                    let coefficients = getCoefficients(_data[i].min, _data[i].est, _data[i].max, _data[i + 1].est);
                    _estimation = coefficients.max - coefficients.alpa * Math.sqrt(bsr);
                }
                break;
            }
        }
        
        return _estimation;
	}
	
	/**
	 * Getter or Setter of started flag variable of background script.
	 * @param {boolean} started 
	 * @return {boolean}
	 */
	const started = (started) => {
		if (started == undefined) {
			return _started;
		} else {
			_started = started;
		}
	}

	let init = () => {
			chrome.runtime.onInstalled.addListener(function (details) {
				console.log('previousVersion', details.previousVersion);
				chrome.tabs.query({url: "*://www.amazon.com/*"}, (tabs) => {
					for (let i = 0; tabs && i < tabs.length; i ++) {
						chrome.tabs.reload(tabs[i].id, {bypassCache: true});
					}
				})
			});

			chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
				switch(request.from) {
					case "amazon":
						if (request.action == "status") {
							let temp = getData();
							temp.status = true;
							sendResponse(temp);
						} else if (request.action == "product-info") {
							let info = request.data;
							let curTab = JSON.parse(localStorage._data).curTab;
							if (parseInt(info.bsr) != NaN) {
								info.estSale = parseInt(calculate(info.bsr));
							}

							if (curTab == sender.tab.id) {
								_data.products.push(info);
							}
						} else if (request.action == "get_data_completed") {
							if (curTab == sender.tab.id) {
								_started = false;
							}
						}
						break;

					case "login":
						if (request.action === "close_me") {
							chrome.tabs.remove(sender.tab.id);
						}
						break;

					default:
						console.log("Unknown message detected.");
						break;
				}
			});
		};

	/**
	 * Getting initialize samples data. This will be used for debugging and will be removed in production mode.
	 * @return {array}
	 */
	const getSamples = () => {
		return _initialSamples;
	}

	/**
	 * Login handler in background script. Once authenticated, the extension pulls product being tracked by the author.
	 * @param {string} email 
	 * @param {string} password 
	 * @param {function} success 
	 * @param {function} failure 
	 * @return {void}
	 */
	const login = (email, password, success, failure) => {
		_restAPI.login(email, password, (response) => {
			if (typeof success === "function") {
				success(response);
				setCredentials(email, password);
				//	Getting tracking products once 
				updateSamples();
			}
		}, failure)
	};

	/**
	 * Logout function via Rest API.
	 * @param {function} callback 
	 * @return {void}
	 */
	const logout = (callback) => {
		_restAPI.logout(() => {
			if (typeof callback === "function") {
				callback();
			}
		})
	};

	/**
	 * Funtion to call API for histories for a given product.
	 * @param {number} id 
	 * @param {function} success 
	 * @param {function} failure 
	 * @return {void}
	 */
	const getHistories = (id, success, failure) => {
		_restAPI.histories(id, success, failure);
	}

	/**
	 * Functoin to track a product by using REST API to track. Every api call should be done in background side.
	 * @param {object} product 
	 * @param {function} success 
	 * @param {function} failure 
	 * @return {void}
	 */
	const trackProduct = (product, success, failure) => {
		// product.est = calculate(product.bsr);
		_restAPI.track(_data.domain, _data.category, product, (response) => {
			if (response.status) {
				if (typeof success === "function") {
					success(response);
					let found = _trackedProducts.filter(item => item.product.id == response.item.product.id);

					if (found.length == 0) {
						_trackedProducts.push(response.item);
					}
				}
			}
		}, failure)
	}

	/**
	 * Background script function to stop watching a product.
	 * @param {number} id 
	 * @param {function} success 
	 * @param {function} failure 
	 * @return {void}
	 */
	const untrackProduct = (id, success, failure) => {
		_restAPI.untrack(id, (response) => {
			if (response.status) {
				_trackedProducts = _trackedProducts.filter(item => item.product.id != id);

				if (typeof success === "function") {
					success(response);
				}
			} else {
				failure(response);
			}
		}, failure)
	}

	/**
	 * 
	 * @param {number} id 
	 * @param {function} success 
	 * @param {function} failure 
	 * @return {void}
	 */
	const findTrackingProduct = (id, success, failure) => {
		_restAPI.findTrack(id, (response) => {
			if (response.status) {
				if (typeof success == "function") {
					success(response);
				}
			} else {
				if (typeof failure == "function") {
					failure(response);
				}
			}
		}, failure)
	}

	/**
	 * Getting products being tracked by author for the given domain and category.
	 * @return {array}
	 */
	const getTrackingProducts = () => {
		return _trackedProducts;
	}

	return {
		init: init,
		get: getData,
		set: setData,
		login: login,
		logout: logout,
		samples: getSamples,
		register: _restAPI.register,
		checkSubscription: _restAPI.check,
		updateSamples: updateSamples,
		url: getCurUrl,
		estimation: calculate,
		items: getTrackingProducts,
		item: findTrackingProduct,
		track: trackProduct,
		untrack: untrackProduct,
		histories: getHistories,
		step: setStep,
		credentials: getCredentials,
		started: started
	};
})();

(function(window, jQuery) {
	window.Background = Background;
	window.Background.init();
})(window, $);