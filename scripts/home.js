var content,
	setActive;

$(document).ready(function() {
	content = $('#content');
	setActive = $('.setActive');

	chrome.runtime.sendMessage({query: 'get options'}, function(response) {
		options = response.options;
		display_home(response.options);
		if (options.alert)
			$('.options').removeClass('hidden');
		else
			$('.boxed').removeClass('boxed');
	});

	chrome.runtime.sendMessage({
		query: 'set alert',
		alert: false
	});

	set_listeners();
});

function display_home(options)
{
	if (options.active)
	{
		$('.activate', setActive).hide();
	}
	else
	{
		$('.deactivate', setActive).hide();
	}

	for (var prop in options.visibility)
	{
		if (options.visibility.hasOwnProperty(prop))
		{
			if (!options.visibility[prop])
			{
				$('.option[data-option=' + prop + ']').removeClass('checked');
			}
		}
	}

	for (var prop in options)
	{
		if (options.hasOwnProperty(prop))
		{
			if (options[prop] === false)
			{
				$('.option[data-option=' + prop + ']').removeClass('checked');
			}
		}
	}

	// if (!options.applyInstantly)
	// {
	// 	$('.option[data-option=applyInstantly]').removeClass('checked');
	// }

	// if (!options.disablePlaylists)
	// {
	// 	$('.option[data-option=disablePlaylists]').removeClass('checked');
	// }

	content.show();
}

function set_listeners()
{
	$('.setActive .activate span').on('click', function() {
		set_active(true);
	});

	$('.setActive .deactivate span').on('click', function() {
		set_active(false);
	});

	$('.option.visibility').on('click', function() {
		var $this = $(this);

		set_visibility($this.attr('data-option'), !$this.hasClass('checked'));
		$this.toggleClass('checked');
	});
	
	$('.option[data-option=hideRelated]').on('click', function() {
		$this = $(this);
		set_option($this);
		$this.toggleClass('checked');
	});

	$('.option[data-option=applyInstantly]').on('click', function() {
		set_option($(this));

		if (value)
		{
			refresh.hide();
		}
		else
		{
			refresh.show();
		}
	});

	$('.option[data-option=disablePlaylists]').on('click', function() {
		set_option($(this));
	});

	$('.option[data-option=disableAutoplay]').on('click', function() {
		set_option($(this));
	});

	$('.subOption').on('click', function(e) {
		e.stopPropagation();
	});

	var options = $('.options'),
		optionsPlus = $('.toggleOptions span');

	$('.toggleOptions').on('click', function() {
		if (options.hasClass('hidden'))
		{
			optionsPlus.html('-');
		}
		else
		{
			optionsPlus.html('+');
		}

		options.toggleClass('hidden');
	});
}

function set_visibility(component, value)
{
	chrome.runtime.sendMessage({
		query: 'set visibility',
		component: component,
		value: value
	});
}

function set_active(active)
{
	chrome.runtime.sendMessage({
		query: 'set active',
		active: active
	});

	if (active)
	{
		$('.activate', setActive).hide();
		$('.deactivate', setActive).show();
	}
	else
	{
		$('.activate', setActive).show();
		$('.deactivate', setActive).hide();	
	}
}

function set_option($this)
{
	var value = !$this.hasClass('checked');

	chrome.runtime.sendMessage({
		query: 'set option',
		option: $this.attr('data-option'),
		value: value
	});

	$this.toggleClass('checked');
}