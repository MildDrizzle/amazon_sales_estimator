'use strict';

let Background = (() => {
	let _tabsInfo = {};
	let _data = {
		domain: JSON.parse(localStorage._domain || "null") || "amazon.com",
		category: JSON.parse(localStorage._category || "null") || "Books",
		products: []
	};
	let _restAPI = restAPI;

	let amazonBaseUrl = (domain, category) => {
		let urls = {
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

	let getCurUrl = () => {
		return amazonBaseUrl(_data.domain, _data.category);
	}

	let checkAuth = (callback) => {
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

	let getData = () => {
		return _data;
	}

	let setData = (params) => {
		for (let p in params) {
			_data[p] = params[p];
		}
		localStorage._data = JSON.stringify(_data);
	}

	let init = () => {
			chrome.runtime.onInstalled.addListener(function (details) {
				console.log('previousVersion', details.previousVersion);
				checkAuth();
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
							_data.products.push(info);
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

	return {
		init: init,
		get: getData,
		set: setData,
		login: _restAPI.login,
		register: _restAPI.register,
		url: getCurUrl
	};
})();

(function(window, jQuery) {
	window.Background = Background;
	window.Background.init();
})(window, $);