$(document).ready(function() {
	var dots;
	var auth = btoa('api:6dbfa8939ac738e5ce9599cfd9c1890c-7caa9475-1a99c1c4');
	function set_auth_header(req) {
		req.setRequestHeader('Authorization', 'Basic ' + auth);
	}

	$('#forceFeedback').on('click', function() {
		$(this).hide();
		$('#tips').hide();
		$('#content').show();
	});

	$('.leaveFeedback').ajaxForm({
		submitURL: 'https://api.mailgun.net/v3/sandbox0ecdb49815e848c8877c0ba9d378fa5d.mailgun.org/messages',
		beforeSend: set_auth_header,
		disableFormOnSuccess: true,
		disableFormOnSubmit: true,
		errorMessages: 'message',
		extraData: function($this)
		{
			var name = $this.find('#name')[0].value;
			var email = $this.find('#email')[0].value;
			var from = (name != '' ? name : 'DF Tube User (Chrome)') + (email != '' ? (' <' + email + '>') : ' <noreply@dftube.com>');

			return {
				from: from,
				to: 'calkuta@gmail.com',
				subject: 'DF Tube (Chrome) Feedback',
				text: $this.find('#messageContent')[0].value + (email != '' ? "\n\nreply to " + email : '')
			};
		},
		submitCallback: function($this, data)
		{
			var message = $this.find('.message');
			console.log(data);
			var text = $this.find('#messageContent')[0].value;
			if (text.length < 4) {
				message.addClass('is-error');
				message.html('Please enter your comments');
				return false;
			}

			message.html('Sending...');
			dots = setInterval(function() {
				message.append('.');
			}, 1000);
		},
		completeCallback: function($this, response)
		{
			clearInterval(dots);
		},
		successCallback: function($this, response)
		{
			clearInterval(dots);
			$this.find('.message').html('Thank you for the feedback!');
		},
		failCallback: function($this, xhr) {
			if (xhr.responseText.indexOf('valid address') >= 0) {
				var message = $this.find('.message');
				message.addClass('is-error');
				message.html('Invalid email address');
			}
		}
	});
});