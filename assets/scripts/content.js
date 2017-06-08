'use strict';

let globalTimer = null;

let ContentScript = (function() {
	let _token = null;
	let _parser = null;
	const PARSERS = {
		"Books": BookParser,
		"eBooks": EBookParser
	};

	const init = (domain, category) => {
		_parser = PARSERS[category];
		_parser.init(domain);
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