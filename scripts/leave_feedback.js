$(document).ready(function() {
	var dots;
	$('.leaveFeedback').ajaxForm({
		submitURL: 'http://www.nosarembo.com/df_youtube/submit_feedback.php',
		disableFormOnSuccess: true,
		disableFormOnSubmit: true,
		errorMessages: 'message',
		submitCallback: function($this)
		{
			var message = $this.find('.message');
			
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
		}
	});
});