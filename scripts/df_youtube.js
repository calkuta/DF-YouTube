/*
	Differences vs. Firefox - refreshFeed commented out
*/

var links = {
		nodes: [],
		hrefs: []
	},
	options,
	expandContent = false,
	expandContentTimeout = null,
	refreshFeed = false;
	
console.log('DF Tube script');
chrome.runtime.sendMessage({query: 'get options'}, function(response) {
	options = response.options;
	refreshFeed = options.active && options.visibility.hideFeed;
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
		initiate();
	}
});

function initiate() {
	console.log('initiating DF Tube')
	document.getElementsByTagName("html")[0].style.display = "";
	if (options.active) {
		set_process_page_timer();
		activate_df_youtube();
	} else {
		deactivate_df_youtube();
	}

	window.addEventListener('resize', function() {
		expand_content();
	});
}

function set_process_page_timer() {
	pageUpdated = typeof pageUpdated === 'undefined' ? false : pageUpdated;
	var timeInterval = 250;
	setTimeout(function() {
		if (options.hideFeed)
			add_css('hide_browse.css');

		if (options.visibility.hideFeed) {
			if (document.URL === 'https://www.youtube.com/') {
				set_hide_feed(true, true);
			}
		}
		
		var progress = document.querySelector('yt-page-navigation-progress #progress');
		var test1 = (document.readyState === 'complete' && // old youtube
				document.body.className.search('page-loaded') > -1 &&
				progress === null);
		var test2 = (document.readyState === 'complete' && // new youtube
				progress !== null && 
				(progress.style.transform === 'scaleX(1)' || 
					progress.style.transform === ''));
		if (test1) {
			remove_css('hide_browse');
			process_page(pageUpdated);
		} else if (test2) {
			remove_css('hide_browse');
			process_page(pageUpdated);
		} else {
			initiate();
		}
	}, timeInterval);
}

function process_page(pageUpdated) {
	if (options.active)
	{
		// remove video ads
		var ads = document.querySelectorAll('#video-masthead');
		for (var i=0; i<ads.length; i++)
		{
			ads[i].parentElement.removeChild(ads[i]);
		}

		if (options.disableAutoplay)
			disable_autoplay();

		playlists();
		expand_content();
	}
	else {
		deactivate_df_youtube();
	}
}

function deactivate_df_youtube() {
	remove_css('df_youtube_common.css');
	remove_css('df_youtube.css');
	set_hide_feed(false, false);
	set_hide_sidebar(false, false, false);
	set_hide_subbar(false);
	set_hide_comments(false);
	set_hide_related(false);
	set_hide_trending(false);
	set_hide_merch(false);
	set_hide_notification_bell(false);
	set_hide_non_lists(false);
}

function activate_df_youtube() {
	add_css('df_youtube_common.css');
	add_css('df_youtube.css');
	set_hide_feed(
		options.visibility.hideFeed,
		document.URL === 'https://www.youtube.com/' && options.visibility.hideRecommended);
	set_hide_sidebar(options.visibility.hideSidebar, options.visibility.hidePlaylist,
		options.visibility.hideLiveChat);
	set_hide_subbar(options.visibility.hideSubBar);
	set_hide_comments(options.visibility.hideComments);
	set_hide_trending(options.visibility.hideTrending);
	set_hide_related(options.visibility.hideRelated);
	set_hide_merch(options.visibility.hideMerch);
	set_hide_notification_bell(options.visibility.hideNotificationBell);
	set_hide_non_lists(options.visibility.hideNonLists);
}

function playlists() {
	if (options.disablePlaylists && options.active)
	{
		setTimeout(function() {
			if (links.nodes.length === 0 || pageUpdated)
			{
				links.nodes = document.querySelectorAll('a');
				links.hrefs = [];
				links.hrefs[links.nodes.length - 1] = '';

				for (var i = 0; i < links.nodes.length; i++)
				{
					links.hrefs[i] = links.nodes[i].href;
					if (links.hrefs[i] !== "") {
						links.nodes[i].href = strip_playlist(links.nodes[i].href);
					}
				}
			}
		}, 1500);
	}
	else
	{
		if (links.nodes.length > 0)
		{
			for (var i = 0; i < links.nodes.length; i++)
			{
				if (links.hrefs[i] !== "")
					links.nodes[i].href = links.hrefs[i];
			}

			links = {
				nodes: [],
				hrefs: []
			};
		}
	}
}

function disable_autoplay() {
	setTimeout(function() {
		var autoplay = document.getElementById('toggle');
		if (autoplay == null)
			autoplay = document.getElementById('improved-toggle');

		if (autoplay != null) {
			if (autoplay.getAttribute('active') !== null) {
				autoplay.click();
			}
		}
	}, 5000);
}

function set_hide_trending(hide) {
	if (hide)
	{
		add_css('trending.css');
	}
	else
	{
		remove_css('trending.css');
	}
}

function set_hide_feed(hideFeed, hideRecommended) {
	//HIDE IN DF_YOUTUBE_COMMON.CSS TO PREVENT FLASHING
	if (hideFeed)
	{
		remove_css('show_feed.css');
		add_css('hide_feed.css');
		// feed.style.setProperty('display', 'none', 'important');
	}
	
	else
	{
		if (hideRecommended) {
			document.querySelectorAll('span#title').forEach(function(item) {
				var found = false
				if (!found && item.innerHTML == 'Recommended') {
					var contentNode = find_parent_by_class(item, 'ytd-item-section-renderer');

					if (contentNode.className.search('dfyoutube_hidden') == -1)
						contentNode.className += ' dfyoutube_hidden ';
				}
			});
			// add_css('hide_recommended.css');
		}
		else {
			document.querySelectorAll('.ytd-item-section-renderer').forEach(function(item) {
				item.className = item.className.replace('dfyoutube_hidden', '');
			});
			// remove_css('hide_recommended.css');
		}

		// if (refreshFeed && document.URL == "https://www.youtube.com/") {
		// 	window.location = window.location;
		// 	return;
		// }

		remove_css('prehide_feed.css');
		remove_css('hide_feed.css');
		add_css('show_feed.css');
	}
}

function set_hide_sidebar(hide, hidePlaylists, hideLiveChat) {
	if (hide)
	{
		add_css('hide_sidebar_contents.css');
	}
	else
	{
		remove_css('hide_sidebar_contents.css');
	}

	if ((hidePlaylists || document.URL.search('list=') === -1) &&
		(hideLiveChat || document.querySelector("ytd-live-chat-frame") == null))
	{
		add_css('hide_chat.css');
		expandContent = true;
	}
	else
	{
		expandContent = false;
		remove_css('hide_chat.css');
	}
}

function expand_content(timeout) {
	return;
	if (typeof timeout === 'undefined')
		timeout = 250;

	try {
		clearTimeout(expandContentTimeout);
	} catch (err) {

	}
	var theaterMode = document.querySelector("#player-theater-container").innerHTML != "";
	if (expandContent && !theaterMode) {
		expandContentTimeout = setTimeout(function() {
			var resizeElems = [
				document.querySelector(".html5-main-video"),
				document.querySelector(".ad-container")
			];

			var container = document.querySelector("#movie_player");
			width = container.offsetWidth + "px";
			height = container.offsetHeight + "px";

			resizeElems.forEach(function(item) {
				item.style.width = width;
				item.style.height = height;
			});

			var controls = document.querySelector('.ytp-chrome-bottom');
			var controlsWidth;
			if (document.querySelector("#movie_player").attributes.class.nodeValue.search('ytp-fullscreen') > -1)
				controlsWidth = container.offsetWidth - 48;
			else
				controlsWidth = container.offsetWidth - 24;

			controls.style.width = controlsWidth + "px";
			console.log("resizing controls to " + controlsWidth + "px");

			if (timeout < 1000)
				expand_content(1000);
		}, timeout);
	}
}

function set_hide_subbar(hide) {
	if (hide)
	{
		add_css('hide_subbar.css');
	}
	else
	{
		remove_css('hide_subbar.css');
	}
}

function set_hide_comments(hide) {
	if (hide)
	{
		add_css('hide_comments.css');
	}
	else
	{
		remove_css('hide_comments.css');
	}
}

function set_hide_related(hide) {
	if (hide)
		add_css('hide_related_videos.css');
	else
		remove_css('hide_related_videos.css');
}

function set_hide_merch(hide) {
	if (hide)
		add_css('hide_merch.css');
	else
		remove_css('hide_merch.css');
}

function set_hide_notification_bell(hide) {
	if (hide) {
		document.title = document.title.replace(/ *\([0-9]+\)/, '');
		add_css('hide_notification_bell.css');
	}
	else
		remove_css('hide_notification_bell.css');
}

function set_hide_non_lists(hide) {
	if (hide)
		add_css("hide_non_lists.css");
	else
		remove_css("hide_non_lists.css");
}

function add_css(file) {
	var checkLink = document.querySelector('link[href="' + chrome.extension.getURL("css/" + file) + '"]'),
		link;
	
	if (checkLink === null)
	{
		link = document.createElement("link");
		link.href = chrome.extension.getURL("css/" + file);
		link.type = "text/css";
		link.rel = "stylesheet";
		link.media = "screen,print";
		document.getElementsByTagName("head")[0].appendChild(link);
	}
}

function remove_css(file) {
	var link = document.querySelectorAll('link[href="' + chrome.extension.getURL("css/" + file) + '"]');

	if (link.length > 0)
	{
		for (var i = 0; i < link.length; i++)
		{
			link[i].parentNode.removeChild(link[i]);
		}
	}
}

function disable_playlists() {
	var links = document.querySelectorAll('a');
	
	setTimeout(function() {
		console.log('hello');
		for (var i = 0; i < links.length; i++)
		{
			links[i].href = strip_playlist(links[i].href);
		}
	}, 2500);
}

function strip_playlist(href) {
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

function find_parent_by_class(node, className) {
	var parent = node.parentNode;
	while (parent != document) {
		if (parent.className.search(className) >= 0)
			return parent;
		parent = parent.parentNode;
	}

	return undefined;
}