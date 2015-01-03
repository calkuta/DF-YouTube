var defaultOptions = {
		active: true,
		visibility: {
			hideFeed: true,
			hideSidebar: true,
			hideRelated: true,
			hideComments: false,
			hidePlaylist: false,
		},
		disablePlaylists: false,
		applyInstantly: true
	},
	options,
	optionsLoaded = false,
	devMode = false;

load_options();

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
	console.log(changeInfo);
	if (typeof changeInfo.url !== 'undefined')
	{
		chrome.tabs.sendMessage(tabId, {
			query: 'page updated',
			options: options,
			url: changeInfo.url
		});
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	if (request.query === 'get options')
	{
		if (optionsLoaded)
		{
			sendResponse({options: options});
		}
		else
		{
			load_options(function(options) {
				sendResponse({options: options});
			});

			return true;
		}
	}

	else if (request.query === 'set active')
	{
		options.active = request.active;
		set_icon(request.active);
		broadcast_options();
		save_options();
	}

	else if (request.query === 'set visibility')
	{
		options.visibility[request.component] = request.value;
		broadcast_options();
		save_options();
	}

	else if (request.query === 'set option')
	{
		options[request.option] = request.value;
		broadcast_options();
		save_options();
	}
});

function load_options(callback)
{
	if (typeof callback === 'undefined')
	{
		callback = function() {};
	}

	chrome.storage.sync.get('dfYoutubeOptions', function(data) {
		
		optionsLoaded = true;

		if (typeof data.dfYoutubeOptions === 'undefined')
		{
			options = defaultOptions;

			save_options();
		}
		else
		{
			options = align_objects(defaultOptions, data.dfYoutubeOptions);
		}

		set_icon(options.active);

		callback(options);
	});
}

function align_objects(defaultObject, comparisonObject, useTrim)
{
	// method - use 'combine' to add missing properties or 'reset' to reset to the defaultObject
	// useTrim - whether to delete any extra properties

	useTrim = typeof useTrim === 'undefined' ? true : useTrim;

	var prop;

	for (prop in defaultObject)
	{
		if (defaultObject.hasOwnProperty(prop))
		{
		 	if (!comparisonObject.hasOwnProperty(prop))
		 	{
				if (window.devMode)
				{
					console.log('comparee prop ' + prop + ' not found');
				}

				comparisonObject[prop] = defaultObject[prop];
			}

			if (typeof defaultObject[prop] === 'object')
			{
				align_objects(defaultObject[prop], comparisonObject[prop], 'combine', true);
			}
		}
	}

	if (useTrim)
	{
		for (prop in comparisonObject)
		{
			if (comparisonObject.hasOwnProperty(prop))
			{
				if (!defaultObject.hasOwnProperty(prop))
				{
					delete comparisonObject[prop];
				}
			}
		}
	}

	return comparisonObject;
}

function broadcast_options(tabID)
{
	if (typeof tabID !== 'undefined')
	{
		order_update_view(tabID);
	}
	else //send to all
	{
		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++)
			{
				order_update_view(tabs[i].id);
			}
		});
	}

	function order_update_view(tabID)
	{
		chrome.tabs.sendMessage(tabID, {
			query: 'update view',
			options: options
		});
	}
}

function save_options()
{
	chrome.storage.sync.set({dfYoutubeOptions: options});
}

function set_icon(isActive)
{
	if (isActive)
	{
		chrome.browserAction.setIcon({
			path: "images/df_youtube_icon_active_32.png",
		});
	}
	else
	{
		chrome.browserAction.setIcon({
			path: "images/df_youtube_icon_inactive_32.png",
		});
	}
}