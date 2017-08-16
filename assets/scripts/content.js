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
		if (category == "eBooks") {
			EBookParser.init(domain);
		} else if (category == "Books") {
			BookParser.init(domain);
		}
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
		if (response && response.status) {
			let domain = window.location.hostname;
			let wwwPrefix = "www.";
			let category = response.category;
			let path = window.location.pathname;
			let eBooksPattern = /^\/(Best-Sellers-Kindle-Store-eBooks\/zgbs\/digital-text)|(gp\/bestsellers\/digital-text)\//g;
			let booksPattern = /^\/(best-sellers-books-Amazon\/zgbs\/books)|(gp\/bestsellers\/books)\//g;

			if (domain.indexOf(wwwPrefix) > -1) {
				domain = domain.substr(domain.indexOf(wwwPrefix) + wwwPrefix.length);

				if (category == "eBooks") {
					ContentScript.init(domain, "eBooks");
				} else if (category == "Books") {
					ContentScript.init(domain, "Books");
				}
				// if (path.match(eBooksPattern)) {
				// 	ContentScript.init(domain, "eBooks");
				// } else if (path.match(booksPattern)) {
				// 	ContentScript.init(domain, "Books");
				// }
			}
		}
	});
})(window, $);