var links = {
		nodes: [],
		hrefs: []
	},
	options;

chrome.runtime.sendMessage({query: 'get options'}, function(response) {
	options = response.options;
	initiate();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.query === 'update view')
	{
		options = request.options;
		initiate();
	}

	else if (request.query === 'page updated')
	{
		options = request.options;
		initiate(true);
	}
});

function initiate(pageUpdated)
{
	pageUpdated = typeof pageUpdated === 'undefined' ? false : pageUpdated;

	var timeInterval = 500,
		time = 0,
		body = document.querySelector('body');

	setTimeout(function() {
		checkReady = setInterval(function() {
			if (document.readyState === 'complete' &&
				body.className.search('page-loaded') >= 0 ||
				time > 3000
			)
			{
				console.log('starting up');
				clearInterval(checkReady);
				df_youtube(pageUpdated);
			}
			else
			{
				time += timeInterval;
			}
		}, timeInterval);
	}, timeInterval);
}

function df_youtube(pageUpdated)
{
	if (options.active)
	{
		add_css('df_youtube.css');
		set_hide_feed(options.visibility.hideFeed);
		set_hide_sidebar(options.visibility.hideSidebar, options.visibility.hidePlaylist);
		set_hide_related(options.visibility.hideRelated);
		set_background(document.URL === "https://www.youtube.com/");
	}
	else
	{
		remove_css('df_youtube.css');
		set_hide_feed(false);
		set_hide_sidebar(false, false);
		set_hide_related(false);
	}
	
	var content = document.querySelector('#watch7-container'),
		footer = document.querySelector('#footer-container'),
		theaterButton = document.querySelector('div[aria-label="Theater mode"]');

	if (content)
	{
		content.style.setProperty('display', 'block', 'important');
		footer.style.setProperty('display', 'block', 'important');

		setTimeout(function() {
			content.style.opacity = '1.0';
			footer.style.opacity = '1.0';
		}, 100);
	}
	else
	{
		footer.style.setProperty('display', 'block', 'important');
	}

	if (theaterButton && options.active)
	{
		setTimeout(function() {
			fire_event(theaterButton, 'click');
		}, 2000);
	}

	// PLAYLISTS
	if (options.disablePlaylists && options.active)
	{
		if (links.nodes.length === 0 || pageUpdated)
		{
			links.nodes = document.querySelectorAll('a');
			links.hrefs = [];
			links.hrefs[links.nodes.length - 1] = '';

			for (var i = 0; i < links.nodes.length; i++)
			{
				links.hrefs[i] = links.nodes[i].href;
				links.nodes[i].href = strip_playlist(links.nodes[i].href);
			}
		}
	}
	else
	{
		if (links.nodes.length > 0)
		{
			for (var i = 0; i < links.nodes.length; i++)
			{
				links.nodes[i].href = links.hrefs[i];
			}

			links = {
				nodes: [],
				hrefs: []
			};
		}
	}
}

function set_background(show)
{
	if (show)
	{
		add_css('background.css');
	}
	else
	{
		remove_css('background.css');
	}
}
function set_hide_feed(hide)
{
	//HIDE IN DF_YOUTUBE_COMMON.CSS TO PREVENT FLASHING
	if (hide)
	{
		remove_css('show_feed.css');
		// feed.style.setProperty('display', 'none', 'important');
	}
	
	else
	{
		add_css('show_feed.css');
		console.log('should expose feed');
		// feed.style.setProperty('display', 'block', 'important');
	}
}

function set_hide_sidebar(hide, hidePlaylist)
{
	if (hide)
	{
		add_css('hide_sidebar_contents.css');
	}
	else
	{
		remove_css('hide_sidebar_contents.css');
	}

	if (document.URL.search('watch\\?v=') > 0 && hide && (hidePlaylist || document.URL.search('list=') === -1))
	{
		add_css('expand_content.css');
	}
	else
	{
		remove_css('expand_content.css');
	}
}

function set_hide_related(hide)
{
	if (hide)
	{
		add_css('hide_related_videos.css');
	}
	else
	{
		remove_css('hide_related_videos.css');
	}
}

function add_css(file)
{
	var checkLink = document.querySelector('link[href="' + chrome.extension.getURL("css/" + file) + '"]'),
		link;

	if (checkLink === null)
	{
		link = document.createElement( "link" );
		link.href = chrome.extension.getURL("css/" + file);
		link.type = "text/css";
		link.rel = "stylesheet";
		link.media = "screen,print";
		document.getElementsByTagName( "head" )[0].appendChild( link );
	}

}

function remove_css(file)
{
	var link = document.querySelectorAll('link[href="' + chrome.extension.getURL("css/" + file) + '"]');

	if (link.length > 0)
	{
		for (var i = 0; i < link.length; i++)
		{
			link[i].parentNode.removeChild(link[i]);
		}
	}
}

function disable_playlists()
{
	var links = document.querySelectorAll('a');

	for (var i = 0; i < links.length; i++)
	{
		links[i].href = strip_playlist(links[i].href);
	}
}

function strip_playlist(href)
{
	listPos = href.search('&list=');

	if (listPos >= 0 && href.search('watch\\?v=') >= 0)
	{
		href = href.slice(0, listPos);
	}

	return href;
}

function fire_event(node, eventName) {
	// Make sure we use the ownerDocument from the provided node to avoid cross-window problems
	var doc;
	if (node.ownerDocument) {
		doc = node.ownerDocument;
	} else if (node.nodeType == 9){
		// the node may be the document itself, nodeType 9 = DOCUMENT_NODE
		doc = node;
	} else {
		throw new Error("Invalid node passed to fireEvent: " + node.id);
	}

	 if (node.dispatchEvent) {
		// Gecko-style approach (now the standard) takes more work
		var eventClass = "";

		// Different events have different event classes.
		// If this switch statement can't map an eventName to an eventClass,
		// the event firing is going to fail.
		switch (eventName) {
			case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
			case "mousedown":
			case "mouseup":
				eventClass = "MouseEvents";
				break;

			case "focus":
			case "change":
			case "blur":
			case "select":
				eventClass = "HTMLEvents";
				break;

			default:
				throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
				break;
		}
		var event = doc.createEvent(eventClass);

		var bubbles = eventName == "change" ? false : true;
		event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

		event.synthetic = true; // allow detection of synthetic events
		// The second parameter says go ahead with the default action
		node.dispatchEvent(event, true);
	} else  if (node.fireEvent) {
		// IE-old school style
		var event = doc.createEventObject();
		event.synthetic = true; // allow detection of synthetic events
		node.fireEvent("on" + eventName, event);
	}
};