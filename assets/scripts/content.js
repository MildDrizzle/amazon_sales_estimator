'use strict';

let globalTimer = null;

let ContentScript = (function() {
	let _token = null,
		_user = null,
		_itemNum = null,
		_itemTitle = null,
		_bidCount = null,
		_itemPrice = null,
		_itemCond = null,
        _itemDescription = null,
		_hostname = null,
		_currencies = {
			"£": "GBP",
			"$": "USD"
		},
		_itemImgUrl = null;

	const getProductInfo = function() {
		return {
			number: _itemNum,
			title: _itemTitle,
			price: _itemPrice,
			count: _bidCount,
			condition: _itemCond
		}
	};

	const fieldCaptions = {
		"price" : "Price",
		"price_data": "Price data",
		"currency": "Price Currency",
		"title" : "Title",
		"address/subtitle": "Address",
		"features": "Features",
		"agent": "Agent",
		"agent_address": "Agent Address",
		"agent_phone": "Agent Phone",
		"description": "Description"
	}

	const renderData = ($change, $full, $chart, histories, user) => {
		user = user || _user;
		let $changeLogTable = $("<table/>").addClass("ppy-ext-change-log-table").append(
				$('<colgroup>\
					<col span="1" style="width: 15%;">\
					<col span="1" style="width: 85%;">\
				</colgroup>')
			),
			$changeLogTbody = $("<tbody/>"),
			$fullLogTable = $("<table/>").addClass("ppy-ext-full-log-table").append(
				$('<colgroup>\
					<col span="1" style="width: 25%;">\
					<col span="1" style="width: 75%;">\
				</colgroup>')
			),
			chartData = [],
			$fullLogTBody = $("<tbody/>"),
			$chartView = $("<div/>").attr({
				id: "ppy-ext-chart-container"
			});

		//	For change log
		$changeLogTable.append($changeLogTbody);
		$change.append($changeLogTable);

		//	For full log
		$fullLogTBody.appendTo($fullLogTable);
		$full.append($fullLogTable);

		//	For chart view
		$chartView.appendTo($chart);

		for (let i = histories.length - 1; i > 0; i--) {
			let prev = histories[i - 1],
				changedFiels = [],
				ignoreFieldsList = ["id", "created_at", "created_by", "updated_at", "updated_by", "agent"],
				$changeLogUl = $("<ul/>"),
				$changeLogRecord = $("<tr/>").addClass((user.id == histories[i].created_by) ? "found_by_myself" : "").append(
					$("<td/>").text(histories[i].created_at.match(/\d+\-\d+\-\d+/g)[0])
				),
				$changeLogRecordChangeContentField = $("<td/>").addClass("change-content"),
				$fullLogRecord = $("<tr/>").addClass((user.id == histories[i].created_by) ? "found_by_myself" : "").append(
					$("<td/>").text(histories[i].created_at)
				),
				$fullLogRecordChangeContentField = $("<td/>").addClass("change-content"),
				$fullLogUl = $("<ul/>");

			//	For change log
			$changeLogTbody.append($changeLogRecord);
			$changeLogRecord.append($changeLogRecordChangeContentField);
			$changeLogRecordChangeContentField.append($changeLogUl);

			//	For full log
			$fullLogTBody.append($fullLogRecord);
			$fullLogUl.appendTo($fullLogRecordChangeContentField);
			$fullLogRecordChangeContentField.appendTo($fullLogRecord);

			if (chartData.length == 0 || chartData[chartData.length - 1].y != histories[i].price.replace(/,/g, '').match(/(\d+).(\d+)/g)[0]) {
				chartData.push({
					x: new Date(histories[i].created_at),
					y: parseInt(histories[i].price.replace(/,/g, '').match(/(\d+).(\d+)/g)[0])
				});
			}

			for (let p in histories[i]) {
				if (ignoreFieldsList.indexOf(p) > -1) {
					continue;
				}

				if (histories[i][p] != prev[p]) {
					changedFiels.push(p);
					$changeLogUl.append(
						$("<li/>").append(
							$("<span/>").addClass("change-text").html(fieldCaptions[p] + " changed: from <strong>" + prev[p] + "</strong> to <strong>" + histories[i][p] + "</strong>"),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[i].created_by) ? "Myself" : "user00" + histories[i].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						)
					);

					$fullLogUl.append(
						$("<li/>").append(
							$("<span/>").text(fieldCaptions[p] + " changed: "),
							$("<span/>").addClass("prev-value").text(prev[p]),
							$("<span/>").addClass("cur-value").text(histories[i][p]),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[i].created_by) ? "Myself" : "user00" + histories[i].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						)
					);
				}
			}
		}

		let lastIndex = 0;
		$changeLogTbody.append(
			$("<tr/>").addClass((user.id == histories[lastIndex].created_by) ? "found_by_myself" : "").append(
				$("<td/>").addClass("change-date").text(histories[lastIndex].created_at.match(/\d+\-\d+\-\d+/g)[0]),
				$("<td/>").addClass("change-info").append(
					$("<ul/>").append(
						$("<li/>").append(
							$("<span/>").text("Initial Entry found."),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[lastIndex].created_by) ? "Myself" : "user00" + histories[lastIndex].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						)
					)
				)
			)
		);

		$fullLogTBody.append(
			$("<tr/>").addClass((user.id == histories[lastIndex].created_by) ? "found_by_myself" : "").append(
				$("<td/>").addClass("change-time").text(histories[lastIndex].created_at),
				$("<td/>").addClass("change-content").append(
					$("<ul/>").append(
						$("<li/>").append(
							$("<span/>").html("Description found : <strong>" + ((histories[lastIndex].description.length > 100) ? (histories[lastIndex].description.substr(0, 97) + "...") : histories[lastIndex].description) + "</strong>"),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[lastIndex].created_by) ? "Myself" : "user00" + histories[lastIndex].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						),
						$("<li/>").append(
							$("<span/>").html("Address found : <strong>" + histories[lastIndex]["address/subtitle"] + "</strong>"),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[lastIndex].created_by) ? "Myself" : "user00" + histories[lastIndex].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						),
						$("<li/>").append(
							$("<span/>").html("Title found : <strong>" + histories[lastIndex].title + "</strong>"),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[lastIndex].created_by) ? "Myself" : "user00" + histories[lastIndex].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						),
						$("<li/>").append(
							$("<span/>").html("Price found : <strong>" + histories[lastIndex].price + "</strong>"),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[lastIndex].created_by) ? "Myself" : "user00" + histories[lastIndex].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						),
						$("<li/>").append(
							$("<span/>").html("Features found : <strong>" + histories[lastIndex].features + "</strong>"),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[lastIndex].created_by) ? "Myself" : "user00" + histories[lastIndex].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						),
						$("<li/>").append(
							$("<span/>").html("Agent found : <strong>" + histories[lastIndex].agent.name + "</strong>"),
							$("<img/>").addClass("change-user-icon").attr({
								title: (user.id == histories[lastIndex].created_by) ? "Myself" : "user00" + histories[lastIndex].created_by,
								src: chrome.extension.getURL("assets/images/user_icon.jpg")
							})
						)
					)
				)
			)
		);

		chartData.push({
			x: new Date(histories[lastIndex].created_at),
			y: parseInt(histories[lastIndex].price.replace(/,/g, '').match(/(\d+).(\d+)/g)[0])
		});

		chartData = chartData.reverse();

		if (chartData[chartData.length - 1].x.toLocaleDateString() != (new Date()).toLocaleDateString()) {
			chartData.push({
				x: new Date(),
				y: parseInt(histories[chartData.length - 1].price.replace(/,/g, '').match(/(\d+).(\d+)/g)[0])
			});
		}

		$("#ppy-ext-chart-container").CanvasJSChart({
			title: {
				text: "Price change history"
			},
			axisY: {
				title: "Price",
				includeZero: false
			},
			axisX: {
				title: "timeline",
        		gridThickness: 2
			},
			creditText: "",
			creditHref: "",
			height: 300,
			width: 624,
			zoomEnabled: true,
			data: [
				{
					type: "line", //try changing to column, area
					toolTipContent: "{x} : £{y}",
					dataPoints: chartData
				}
			]
		});
	}

	const renderToMoveRight = (histories, user) => {
		let $detailTabBlock = $("div#detailsTabs").parents(".row.one-col"),
			$row = $("<div/>").addClass("row one-col"),
			$cell = $("<div/>").addClass("cell"),
			$module = $("<div/>").addClass("module"),
			$dataBlock = $("<div/>").attr("id", "ppy-trk-ext-block").addClass("tabbed-content"),
			$navigator = $("<ul/>").addClass("clearfix tabbed-content-nav print-hidden").append(
				$("<li/>").addClass("tabbed-content-nav-item active")
					.attr({
						"data-target": "changes-only"
					}).append($("<a/>").text("Changes")),
				$("<li/>").addClass("tabbed-content-nav-item")
					.attr({
						"data-target": "full-history"
					}).append($("<a/>").text("Full Log")),
				$("<li/>").addClass("tabbed-content-nav-item")
					.attr({
						"data-target": "chart-view"
					}).append($("<a/>").text("Chart View"))
			),
			$tabsContainer = $("<div/>").addClass("clearfix tabs"),
			$changesTab = $("<div/>").addClass("tabbed-content-tab clearfix active").attr({id: "changes-only"}),
			$fullLogTab = $("<div/>").addClass("tabbed-content-tab clearfix").attr({id: "full-history"}),
			$chartTab = $("<div/>").addClass("tabbed-content-tab clearfix").attr({id: "chart-view"});

		$dataBlock.append(
			$navigator,
			$tabsContainer.append($changesTab, $fullLogTab, $chartTab)
		);
		$row.append($cell.append($module.append($dataBlock)));
		$row.insertBefore($detailTabBlock);

		$("#ppy-trk-ext-block ul li.tabbed-content-nav-item").click((event) => {
			$("#ppy-trk-ext-block ul li.tabbed-content-nav-item.active").removeClass("active");
			$("#ppy-trk-ext-block div.tabbed-content-tab.active").removeClass("active");
			$(event.target).parent().addClass("active");
			$("#ppy-trk-ext-block #" + $(event.target).parent().attr("data-target")).addClass("active");
		});

		renderData($changesTab, $fullLogTab, $chartTab, histories);
	}

	const renderToZoopla = (histories, user) => {
		let $startPointBlock = ($("div#interested-1").length > 0) ? $("#interested-1") : $("div#images"),
			$row = $("<div/>").addClass("row one-col"),
			$cell = $("<div/>").addClass("cell"),
			$module = $("<div/>").addClass("module"),
			$dataBlock = $("<div/>").attr("id", "ppy-trk-ext-block").addClass("tabbed-content"),
			$navigator = $("<ul/>").addClass("clearfix tabbed-content-nav print-hidden").append(
				$("<li/>").addClass("tabbed-content-nav-item active")
					.attr({
						"data-target": "changes-only"
					}).append($("<a/>").text("Changes")),
				$("<li/>").addClass("tabbed-content-nav-item")
					.attr({
						"data-target": "full-history"
					}).append($("<a/>").text("Full Log")),
				$("<li/>").addClass("tabbed-content-nav-item")
					.attr({
						"data-target": "chart-view"
					}).append($("<a/>").text("Chart View"))
			),
			$tabsContainer = $("<div/>").addClass("clearfix tabs"),
			$changesTab = $("<div/>").addClass("tabbed-content-tab clearfix active").attr({id: "changes-only"}),
			$fullLogTab = $("<div/>").addClass("tabbed-content-tab clearfix").attr({id: "full-history"}),
			$chartTab = $("<div/>").addClass("tabbed-content-tab clearfix").attr({id: "chart-view"});

		$dataBlock.append(
			$navigator,
			$tabsContainer.append($changesTab, $fullLogTab, $chartTab)
		);
		$row.append($cell.append($module.append($dataBlock)));
		$row.insertAfter($startPointBlock);

		$("#ppy-trk-ext-block ul li.tabbed-content-nav-item").click((event) => {
			$("#ppy-trk-ext-block ul li.tabbed-content-nav-item.active").removeClass("active");
			$("#ppy-trk-ext-block div.tabbed-content-tab.active").removeClass("active");
			$(event.target).parent().addClass("active");
			$("#ppy-trk-ext-block #" + $(event.target).parent().attr("data-target")).addClass("active");
		});

		renderData($changesTab, $fullLogTab, $chartTab, histories);
	}

	const renderOntheMarket = (histories, user) => {
		let $startPointBlock = $("div#property-description"),
			$row = $("<div/>").addClass("row one-col"),
			$cell = $("<div/>").addClass("cell"),
			$module = $("<div/>").addClass("module"),
			$dataBlock = $("<div/>").attr("id", "ppy-trk-ext-block").addClass("tabbed-content"),
			$navigator = $("<ul/>").addClass("clearfix tabbed-content-nav print-hidden").append(
				$("<li/>").addClass("tabbed-content-nav-item active")
					.attr({
						"data-target": "changes-only"
					}).append($("<a/>").text("Changes")),
				$("<li/>").addClass("tabbed-content-nav-item")
					.attr({
						"data-target": "full-history"
					}).append($("<a/>").text("Full Log")),
				$("<li/>").addClass("tabbed-content-nav-item")
					.attr({
						"data-target": "chart-view"
					}).append($("<a/>").text("Chart View"))
			),
			$tabsContainer = $("<div/>").addClass("clearfix tabs"),
			$changesTab = $("<div/>").addClass("tabbed-content-tab clearfix active").attr({id: "changes-only"}),
			$fullLogTab = $("<div/>").addClass("tabbed-content-tab clearfix").attr({id: "full-history"}),
			$chartTab = $("<div/>").addClass("tabbed-content-tab clearfix").attr({id: "chart-view"});

		$dataBlock.append(
			$navigator,
			$tabsContainer.append($changesTab, $fullLogTab, $chartTab)
		);
		$row.append($cell.append($module.append($dataBlock)));
		$row.insertBefore($startPointBlock);

		$("#ppy-trk-ext-block ul li.tabbed-content-nav-item").click((event) => {
			$("#ppy-trk-ext-block ul li.tabbed-content-nav-item.active").removeClass("active");
			$("#ppy-trk-ext-block div.tabbed-content-tab.active").removeClass("active");
			$(event.target).parent().addClass("active");
			$("#ppy-trk-ext-block #" + $(event.target).parent().attr("data-target")).addClass("active");
		});

		renderData($changesTab, $fullLogTab, $chartTab, histories);
	}

	const renderHistoryBlock = (hostname, histories, user) => {
		user = user || _user;
		const renderFunctions = {
			"rightmove.co.uk": renderToMoveRight,
			"zoopla.co.uk": renderToZoopla,
			"onthemarket.com": renderOntheMarket
		};

		if (histories.length > 1) {
			renderFunctions[hostname](histories, user);
		}
	};

    const saveHistories = function(histories, imgUrl, callback) {
		if (histories.length > 0) {
			chrome.runtime.sendMessage({
				from: "cs",
				action: "save_histories",
				hostname: _hostname,
				number: _itemNum,
				imageUrl: imgUrl,
				histories: histories
			}, function(response) {
				if (typeof callback === "function") {
					callback(response);
				} else {
					console.log(response);
				}
			})
		}
	};

	const getHistory = function(params) {
		restAPI.getHistory(params, function(response) {
			if (response.status) {
				console.log(response.histories);
				saveHistories(response.histories, imgUrl);
				renderHistoryBlock(params.host, response.histories, response.user);
			} else {
				chrome.runtime.sendMessage({
					from: "cs",
					action: "expired"
				});
			}
		});
	};

	const isChanged = (prev, cur) => {
		const ignores = ["host", "number", "img"];
		for (let p in cur) {
			if (ignores.indexOf(p) > -1) {
				continue;
			}

			if (p == "agent") {
				if (prev[p].name != cur[p]) {
					return true;
				} else {
					continue;
				}
			}

			if (p == "agent_address") {
				if (prev.agent.address != cur[p]) {
					return true;
				} else {
					continue;
				}
			}

			if (p == "agent_phone") {
				if (prev.agent.phone != cur[p]) {
					return true;
				} else {
					continue;
				}
			}

			if (prev[p] != cur[p]) {
				return true;
			}
		}
		return false;
	};

	const viewHistory = (cur, histories) => {
		if (histories.length == 0 || isChanged(histories[histories.length - 1], cur)) {
			//	Ajax call
			chrome.runtime.sendMessage({
				from: "cs",
				action: "get_remote_histories",
				data: cur
			});
		} else {
			renderHistoryBlock(_hostname, histories, _user);
		}
	}

	const checkRightMove = (host, num, histories) => {
		let title = (($(".property-header-bedroom-and-price div.left h1") || {}).text() || "").trim(),
			address  = (($(".property-header-bedroom-and-price div.left address") || {}).text() || "").trim(),
			price = (($("#propertyHeaderPrice strong") || {}).text() || "").trim(),
			priceData = (($("#propertyHeaderPrice small") || {}).text() || "").trim(),
			currency = null,
			agent = (($("#aboutBranchLink strong") || {}).text() || "").trim(),
			agent_address = (($("#aboutBranchLink strong") || {}.siblings() || {}).text() || "").trim(),
			agent_phone = (($("#requestdetails strong").eq(0)).text() || "").trim(),
			features = $("div.key-features li"),
			description = ((features.parents(".key-features").next()).text() || "").trim(),
			img = ($(".gallery-main-img-wrap img") || [{}])[0].src,
			tempFeatures = [];

		for (let i = 0; i < features.length; i ++) {
			tempFeatures.push(features.eq(i).text().trim());
		}
		features = tempFeatures.join("\n");

		for (let sym in _currencies) {
			if (price.indexOf(sym) > -1) {
				currency = _currencies[sym];
				break;
			}
		}
		price = (price.match(/((\d+,)+)\d+/g).length > 0) ? price.match(/((\d+,)+)\d+/g)[0] : price;

		let info = {
			host,
			number: num,
			title,
			img,
			"address/subtitle": address,
			price,
			price_data: priceData,
			currency,
			agent,
			agent_address,
			agent_phone,
			features,
			description
		};

		viewHistory(info, histories);
	};

	const checkZoopla = (host, num, histories) => {
		let title = (($("#listing-details h2[itemprop='name']") || {}).text() || "").trim(),
			price = (($(".listing-details-price strong") || {}).text() || "").trim(),
			priceData = null,
			currency = null,
			address = (($("div.listing-details-address h2[itemprop='streetAddress']") || {}).text() || "").trim(),
			agent = (($("#listings-agent strong[itemprop='name']") || {}).text() || "").trim(),
			agent_address = (($("#listings-agent span[itemprop='address']") || {}).text() || "").trim(),
			agent_phone = (($("#listings-agent a[itemprop='telephone']") || {}).text() || "").trim(),
			features = $("#tab-details #images").next().next().find("ul li") || [],
			description = (($("#tab-details div[itemprop='description']") || {}).text() || "").trim(),
			img = ($("#images-thumbs a img") || [{}])[0].src,
			tempFeatures = [];

		for (let i = 0; i < features.length; i ++) {
			tempFeatures.push(features.eq(i).text().trim());
		}
		features = tempFeatures.join("\n");

		for (let sym in _currencies) {
			if (price.indexOf(sym) > -1) {
				currency = _currencies[sym];
				break;
			}
		}
		price = (price.match(/((\d+,)+)\d+/g).length > 0) ? price.match(/((\d+,)+)\d+/g)[0] : price;

		let info = {
			host,
			number: num,
			title,
			img,
			"address/subtitle": address,
			price,
			price_data: priceData,
			currency,
			agent,
			agent_address,
			agent_phone,
			features,
			description
		};
		viewHistory(info, histories);
	};

	const checkOnTheMarket = (host, num, histories) => {
		let title = (($(".details-heading h1").eq(0) || {}).text() || "").trim(),
			price = (($(".details-heading .price .price-data").eq(0) || {}).text() || "").trim(),
			priceData = null,
			currency = null,
			address = (($(".details-heading .price").eq(0).next().next() || {}).text() || "").trim(),
			agent = (($(".agent-name") || {}).text() || "").trim(),
			agent_address = (($(".agent-address") || {}).text() || "").trim(),
			agent_phone = (($(".agent-phone-link").eq(0) || {}).text() || "").trim(),
			features = $("ul.property-features li") || [],
			description = (($(".description").eq(1) || {}).text() || "").trim(),
			img = ($(".thumb-carousel .property-image img") || [{}])[0],
			tempFeatures = [];

		if (!img) {
			globalTimer = window.setTimeout(() => {
				checkOnTheMarket(host, num, histories);
			}, 500);
			return false;
		}

		clearTimeout(globalTimer);
		img = img.src;

		for (let i = 0; i < features.length; i ++) {
			tempFeatures.push(features.eq(i).text().trim());
		}
		features = tempFeatures.join("\n");

		for (let sym in _currencies) {
			if (price.indexOf(sym) > -1) {
				currency = _currencies[sym];
				break;
			}
		}
		price = (price.match(/((\d+,)+)\d+/g).length > 0) ? price.match(/((\d+,)+)\d+/g)[0] : price;

		let info = {
			host,
			number: num,
			title,
			img,
			"address/subtitle": address,
			price,
			price_data: priceData,
			currency,
			agent,
			agent_address,
			agent_phone,
			features,
			description
		};
		viewHistory(info, histories);
	};

	const checkPages = {
		"rightmove.co.uk": checkRightMove,
		"zoopla.co.uk": checkZoopla,
		"onthemarket.com": checkOnTheMarket
	};

	const init = function(num, hostname, histories, user) {
		_itemNum = num;
		_hostname = hostname;
		_user = user;

		checkPages[_hostname](hostname, _itemNum, histories);

		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			switch(request.from) {
				case "background":
					if (request.action == "feed_histories") {
						let histories = request.histories;
						renderHistoryBlock(hostname, histories, request.user);
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
		info: getProductInfo
	};
})();

(function(window, jQuery) {
	const domains = {
		"rightmove.co.uk": [/property-for-sale\/property\-(\d+){8,8}.html/g, /(\d+){8,8}/g], 
		"zoopla.co.uk": [/\/for-sale\/details\/(\d+){8,8}/g, /(\d+){8,8}/g],
		"onthemarket.com": [/\/details\/(\d+){7}/g, /(\d+){7,7}/g]
	};
	const isValidUrl = () => {
		let host = window.location.host.substr((window.location.host.indexOf("www.") == 0) ? "www.".length : 0),
			pat = domains[host];

		if (pat && typeof pat == "object") {
			let matches = window.location.pathname.match(pat[0]);

			if (matches && matches.length > 0) {
				let itemNums = window.location.pathname.match(pat[1]);
				return {
					host: host,
					num: itemNums[0]
				};
			} else {
				return false;
			}
		} else {
			return false;
		}
	};

	let isValid = isValidUrl();
	if (isValid && typeof isValid == "object") {
		chrome.runtime.sendMessage({
			from: "cs",
			action: "history",
			domain: isValid.host,
			number: isValid.num
		}, function(response) {
			ContentScript.init(isValid.num, isValid.host, response.histories, response.user);
		});
	}
})(window, $);