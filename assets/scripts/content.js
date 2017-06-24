'use strict';

let globalTimer = null;

let ContentScript = (function() {
	let _token = null;
	let _parser = null;

	const PARSERS = {
		"Books": BookParser,
		"eBooks": EBookParser
	};

	/**
	 * Initialize 2 objects to manage eBooks category and Books category on various amazon sub domains.
	 * @param {string} domain 
	 * @param {string} category 
	 */
	const init = (domain, category) => {
		// _parser = PARSERS[category];
		BookParser.init(domain);
		EBookParser.init(domain);
	};

	return {
		init: init
	};
})();

(function(window, jQuery) {
	chrome.runtime.sendMessage({
		from: "amazon",
		action: "status"
	}, function(response) {
		if (response.status) {
			ContentScript.init(response.domain, response.category);
		}
	});
})(window, $);