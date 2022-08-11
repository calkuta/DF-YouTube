//listen for exclude domain addition
window.devMode = false;

var thumbs = true;
var excludeDomains;
var webritoUserData = {};
var userDataIsComplete = false;
var userDataFields = ['user_id', 'user_key', 'nickname', 'sessionID'];
var pageTimers = {};

chrome.storage.sync.get('webritoUserData', function(data) {
	if (typeof data.webritoUserData !== 'undefined')
	{
		webritoUserData = data.webritoUserData;

		verify_user_data();

		if (userDataIsComplete)
		{
			get_exclude_domains();
		}
	}
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	if (typeof pageTimers[tabId] !== 'undefined')
	{
		clearInterval(pageTimers[tabId].timer);
		delete pageTimers[tabId];
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {

	if (userDataIsComplete && typeof changeInfo.url !== 'undefined' && changeInfo.url.indexOf('http') !== -1 && changeInfo.url != "https://www.google.com/_/chrome/newtab?espv=2&ie=UTF-8")
	{
		chrome.tabs.sendMessage(tabId, {query: "getRating"});

		if (typeof pageTimers[tabId] === 'object')
		{
			clearInterval(pageTimers[tabId].timer);
		}
		else
		{
			pageTimers[tabId] = {};
			pageTimers[tabId].loaded = false;
		}
		
		if (pageTimers[tabId].loaded === false)
		{
			pageTimers[tabId].text = "   ";
			pageTimers[tabId].timer = setInterval(function() {
				show_loading(tabId);
			}, 750);

			setTimeout(function() {
				if (typeof pageTimers[tabId] !== 'undefined')
				{
					clearInterval(pageTimers[tabId].timer);

					chrome.browserAction.setBadgeText({
						text: "",
						tabId: tabId
					});
				}
			}, 7000);
		}
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (window.devMode)
	{
		//console.log(request.query);
		//console.log(request);
	}

	if (request.query == "getUserData")
	{
		sendResponse({webritoUserData: webritoUserData, isLoggedIn: userDataIsComplete});
	}

	else if (request.query == "ratingLoaded")
	{
		if (typeof pageTimers[sender.tab.id] !== 'undefined')
		{
			pageTimers[sender.tab.id].loaded = true;
			clearInterval(pageTimers[sender.tab.id].timer);
			chrome.browserAction.setBadgeText({
				text: "",
				tabId: sender.tab.id
			});
		}
		else
		{
			pageTimers[sender.tab.id] = {};
		}
	}

	else if (request.query == "clearUserData")
	{
		chrome.storage.sync.remove('webritoUserData');
		chrome.storage.sync.remove('webritoExcludeDomains');
		userDataIsComplete = false;
		webritoUserData = {};
	}

	else if (request.query == "setRating")
	{
		set_rating(request.tabId, request.rating, sender);
	}

	else if (request.query == "logIn")
	{
		webritoUserData = request.webritoUserData;
		verify_user_data();
		if (userDataIsComplete)
		{
			chrome.storage.sync.set({webritoUserData: webritoUserData});
			get_exclude_domains();
			
			chrome.tabs.query({}, function(tabs) {
				for (var i = 0; i < tabs.length; i++)
				{
					chrome.tabs.sendMessage(tabs[i].id, {query: 'logIn', webritoUserData: webritoUserData});
				}
			});
		}
	}

	else if (request.query == "logOut")
	{
		webritoUserData = {};
		excludeDomains = undefined;
		userDataIsComplete = false;
		chrome.storage.sync.remove('webritoUserData');
		log_out_tabs();

		reset_icons();
	}

	else if (request.query == 'checkDomain')
	{
		if (typeof excludeDomains === 'undefined')
		{
			sendResponse({isExcluded: false});
		}
		else
		{
			check_domain(request.url, sendResponse);
		}

		return true;
	}

	else if (request.query == 'excludeDomain')
	{
		if (typeof excludeDomains !== 'undefined' && typeof webritoUserData.nickname !== 'undefined')
		{
			exclude_domain(request.url, sendResponse);
		}

		return true;
	}

	else if (request.query == 'permitDomain')
	{
		if (typeof excludeDomains !== 'undefined' && typeof webritoUserData.nickname !== 'undefined')
		{
			permit_domain(request.url, sendResponse);
		}

		return true;
	}
});

function reset_icons()
{
	chrome.tabs.query({}, function(tabs) {
		for (var i = 0; i < tabs.length; i++)
		{
			chrome.browserAction.setIcon({
				path: "images/burrito_rating_32.png",
				tabId: tabs[i].id
			});

			chrome.browserAction.setBadgeText({
				text: "",
				tabId: tabs[i].id
			});
		}
	});
}

function set_rating(tabId, rating, sender)
{

	var ratedTabId = tabId !== null ? tabId : sender.tab.id;

	if (rating > 0)
	{
		if (thumbs)
		{
			if (rating > 3)
			{
				chrome.browserAction.setIcon({
					path: "images/burrito_upvote_32.png",
					tabId: ratedTabId
				});
			}

			else if (rating > 0)
			{
				chrome.browserAction.setIcon({
					path: "images/burrito_downvote_32.png",
					tabId: ratedTabId
				});
			}
		}

		else
		{
			chrome.browserAction.setIcon({
				path: "images/burrito_rating_32.png",
				tabId: ratedTabId
			});
			chrome.browserAction.setBadgeBackgroundColor({
				color: [255, 168, 0, 255],
				tabId: ratedTabId
			});
			chrome.browserAction.setBadgeText({
				text: rating,
				tabId: ratedTabId
			});
		}
	}
}

function check_domain(url, sendResponse)
{
	var response = {isExcluded: false};
	for (var i = 0; i < excludeDomains[webritoUserData.nickname].length; i++)
	{
		if (url.indexOf(excludeDomains[webritoUserData.nickname][i]) !== -1)
		{
			response.isExcluded = true;
			break;
		}
	}

	sendResponse(response);
}

function permit_domain(url, sendResponse)
{
	var i = 0;
	while (i < excludeDomains[webritoUserData.nickname].length)
	{
		if (url.indexOf(excludeDomains[webritoUserData.nickname][i]) !== -1)
		{
			excludeDomains[webritoUserData.nickname].splice(i, 1);
		}
		else 
		{
			i++;
		}
	}

	chrome.storage.sync.set({webritoExcludeDomains: excludeDomains}, function() {});
	sendResponse({excludeDomains: excludeDomains[webritoUserData.nickname]});

	var thisDomain = url.match("https?://([^/]+)")[1];

	chrome.tabs.query({}, function(tabs) {
		for (var i = 0; i < tabs.length; i++)
		{
			if (tabs[i].url.indexOf(thisDomain) !== -1)
			{
				chrome.tabs.sendMessage(tabs[i].id, {query: 'showStarBar'});
			}
		}
	});
}

function exclude_domain(url, sendResponse)
{
	var thisDomain = url.match("https?://([^/]+)")[1];
	excludeDomains[webritoUserData.nickname].push(thisDomain);

	chrome.storage.sync.set({webritoExcludeDomains: excludeDomains}, function() {});
	sendResponse({excludeDomains: excludeDomains[webritoUserData.nickname]});

	chrome.tabs.query({}, function(tabs) {
		for (var i = 0; i < tabs.length; i++)
		{
			if (tabs[i].url.indexOf(thisDomain) !== -1)
			{
				chrome.tabs.sendMessage(tabs[i].id, {query: 'hideStarBar'});
			}
		}
	});
}

function log_out_tabs()
{
	chrome.tabs.query({}, function(tabs) {
		for (var i = 0; i < tabs.length; i++)
		{
			chrome.tabs.sendMessage(tabs[i].id, {query: 'logOut'});
		}
	});
}

function show_loading(tabId)
{
	switch (pageTimers[tabId].text) {
		case "   ":
			pageTimers[tabId].text = ".  ";
			break;
		case ".  ":
			pageTimers[tabId].text = ".. ";
			break;
		case ".. ":
			pageTimers[tabId].text = "...";
			break;
		case "...":
			pageTimers[tabId].text = ".  ";
			break;
		default:
			break;
	}

	chrome.browserAction.setBadgeBackgroundColor({
		color: [0, 0, 0, 255],
		tabId: tabId
	});

	chrome.browserAction.setBadgeText({
		text: pageTimers[tabId].text,
		tabId: tabId
	});
}

function verify_user_data()
{
	for (var i = 0; i < userDataFields.length; i++)
	{
		userDataIsComplete = typeof webritoUserData[userDataFields[i]] !== 'undefined';
		if (!userDataIsComplete)
		{
			break;
		}
	}
}

function get_exclude_domains()
{
	chrome.storage.sync.get('webritoExcludeDomains', function(data) {
		if (typeof data.webritoExcludeDomains === 'undefined')
		{
			excludeDomains = {};
			excludeDomains[webritoUserData.nickname] = [];
		}
		else
		{
			excludeDomains = data.webritoExcludeDomains;

			if (typeof excludeDomains[webritoUserData.nickname] === 'undefined')
			{
				excludeDomains[webritoUserData.nickname] = [];
			}
		}
	});
}