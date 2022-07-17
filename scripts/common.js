window.devMode = false;
//ajax form
(function( $ ) { //operates on a form

	$.fn.ajaxForm = function(options) {
		var $this = this;

		if (this.length > 1)
		{
			throw "ajaxForm requires a single element";
		}
		
		var message = $('.message', $this)
		
		//optional argument defaults
		var defaults = {
			submitURL: null,                 //REQUIRED - url to submit form to

			submitClass: 'submit',           //optional - class of submit button(s)
			extraFields: [],                 //optional - additional selectors to serialize
			extraData:                       //optional - function that provides additional data appended to request
				function($this){return {};},
			submitCallback:                  //optional - function to call when submitting form
				function($this){return true;},
			completeCallback:                //optional - function to call when submission is complete
				function($this, response){},
			successCallback:                 //optional - function to call when submission has no error
				function($this, response){},
			failCallback:                    //optional - function to call when response parse fails
				function($this, xhr){
					message.addClass(args.errorClass);
					message.html('Error - please try again.');
				},
			method: 'POST',                  //optional - POST or GET
			submitImmediately: false,        //optional - immediately submit form as is
			dataType: 'text',                //optional - response data type
			timeout: 10000,                  //optional - ajax timeout
			messageTimeoutOnSuccess: false,  //optional - number of seconds after which to erase message
			submitOnEnterKey: true,          //optional - submit form when enter is pressed from an input
			disableFormOnSubmit: false,      //optional - disable entire form on submit
			disableFormOnSuccess: false,     //optional - disable entire form on success
			disable_submit: true,             //optional - disable submit button while submitting
			disableSubmitOnSuccess: false,   //optional - disable submit permanently on success
			errorMessages: 'labels',         //optional - 'message' to show errors in message div, 
											 //           'labels' to append a span to labels,
											 //           'none' to show no errors
			showErrorFields: false,          //optional - add error class to bad fields
			errorClass: 'is-error',          //optional - class to add to error messages/fields
			errorOverrideMessage: false,     //optional - generic message to override error messages
			showMessage: true,               //optional - show whatever message is returned upon completion
			errorsNewLine: false,            //optional - insert <br> in labels before error
			clearPassword: true,             //optional - clear out password fields
			clearErrorsOnChange: true,       //optional - clear error class on inputs when they are changed
			clearFormOnSuccess: false,       //optional - clear form inputs on success
			appendIsLegit: true,             //optional - append isLegit variable to submission
			beforeSend: function(req) {}
		};

		//GET FIELDS AND ATTRIBUTES
		var pwField = $('input[type=password]', $this),
			formFields = $('input, textarea', $this),
			formData,
			submitButton = $this.find('.' + defaults.submitClass),
			submitEnabled = true,
			inputs = $this.find('input[type=text], input[type=password], textarea');

		construct();

		function construct()
		{
			//check input arguments
			for (var argument in options)
			{
				if (typeof defaults[argument] === 'undefined' && window.devMode)
				{
					console.log('Incorrect argument to ajaxForm: ' + argument);
				}
			}

			args = $.extend(defaults, options);

			//stop normal form submission
			$this.submit(function(e) {
				e.preventDefault();
				submit_form();
			});
			$this.attr('onsubmit', 'return false;');

			//submit on click
			submitButton.on('click', function(e) {
				submit_form();
			});

			//submit on enter
			$('input[type=text], input[type=password]', $this).keypress(function(e) {
				if (e.which == 13) {
					e.stopPropagation();
					e.preventDefault();
					e.returnValue = false;
					e.cancelBubble = true;
					submit_form();
					return false;
				}
			});

			$('.clearForm', $this).on('click', function() {
				$('span.' + args.errorClass, $this).remove();
				$('.' + args.errorClass, $this).removeClass(args.errorClass);
				message.html('');
			});

			//clear error on change
			formFields.on('keyup keypress change', function() {
				var thisField = $(this);
				thisField.removeClass(args.errorClass);

				thisField.prev('label').children().remove('.is-error');
			});

			if (args.submitImmediately)
			{
				submit_form();
			}
		}

		//actual submit
		function submit_form()
		{
			if (!submitEnabled )
			{
				return false;
			}

			message.html('');

			if (start_submit() === false) {
				return;
			}
			
			//clear password
			if (args.clearPassword) {
				pwField.val('');
			}

			var ajaxArgs = {
				url: args.submitURL,
				data: formData,
				type: "",
				dataType: args.dataType,
				timeout: args.timeout,
				success: function(response) {
					on_complete(response);
				},
				error: function(xhr, textStatus, errorThrown) {
					console.log(textStatus + " | " + errorThrown);
					console.log(xhr.responseText);
					on_fail(xhr);
				},
				beforeSend: args.beforeSend,
				method: args.method
			};

			$.ajax(ajaxArgs);
		}

		//on start
		function start_submit() {
			var extraData = args.extraData($this);
			formData = $this.find(':input').serialize() + '&' +
				$(args.extraFields).serialize() + '&' +
				typeof extraData === 'string' ? extraData : $.param(extraData) + '&' +
				'&isLegit=1';

			if (args.disableSubmit)
			{
				disable_submit();
			}
			if (args.disableFormOnSubmit)
			{
				disable_form();
			}

			hide_errors();
			
			if (args.submitCallback($this, formData) === false)
			{
				enable_form();
				enable_submit();
				return false;
			}
			else
			{
				if (window.devMode)
				{
					console.log(formData);
				}
				return true;
			}
		}

		//on completion
		function on_complete(response) {
			response = typeof response === 'undefined' ? "no response" : response;

			//console log
			if (window.devMode) {console.log(response);}

			message.html('');
			var ajaxFailure;

			try {
				response = JSON.parse(response);
				ajaxFailure = false;
			}
			catch(err) {
				if (window.devMode) {console.log('could not parse');}
				ajaxFailure = true;
			}

			if (!ajaxFailure) //received proper response
			{

				if (response.errorFlag) //was an error in input
				{
					show_errors(response);
					enable_submit();
					enable_form();

					//show message if not showing errors in message
					if (!args.errorOverrideMessage && (args.errorMessages != 'message') && args.showMessage)
					{
						message.addClass(args.errorClass);
						message.html(response.message);
					}

					args.completeCallback($this, response);
				}
				else //submission successful
				{
					message.html(response.message);

					//disable form
					if (args.disableFormOnSuccess)
					{
						disable_form();
						disable_submit();
					}
					else
					{
						enable_form();
					}

					//disable submit
					if(args.disableSubmitOnSuccess)
					{
						disable_submit();
					}
					else if (!args.disableFormOnSuccess)
					{
						enable_submit();
					}

					//clear message timeout
					if (args.messageTimeoutOnSuccess !== false && $.isNumeric(args.messageTimeoutOnSuccess))
					{
						window.setTimeout(function() {
							message.html('');
						}, args.messageTimeoutOnSuccess * 1000);
					}

					args.completeCallback($this, response);
					
					if (args.clearFormOnSuccess)
					{
						clear_form();
					}

					//success callback
					args.successCallback($this, response);
				}
			}
			else
			{
				args.completeCallback($this);
				args.failCallback($this, response);
				enable_form();
				enable_submit();
				message.addClass(args.errorClass);
				message.html('Error - please try again');
			}
		}

		//on failure
		function on_fail(xhr) {
			args.failCallback($this, xhr);
			
			enable_submit();
			enable_form();
		}

		//show error messages
		function show_errors(data) {
			if (args.showErrorFields) {
				for (var thisField in data.badFields) {
					$('input[name=' + thisField + '], textarea[name=' + thisField + ']', $this).addClass(args.errorClass);
				}
			}

			//show unexpected errors
			if (data.unexpectedError) {
				message.addClass(args.errorClass);
				message.html(data.message);
			}
			else if (args.errorOverrideMessage) {
				message.addClass(args.errorClass);
				message.html(args.errorOverrideMessage);
			}

			//data contains badFields, message
			switch (args.errorMessages) {
				case 'message':
					message.addClass(args.errorClass);
					message.html(args.errorOverrideMessage ? args.errorOverrideMessage : data.message);
					break;
				case 'labels':
					//set newline
					var errorPrepend = args.errorsNewLine ? '<br>' : '&nbsp;&nbsp;';
					for (var thisField in data.badFields) {
						$('input[name=' + thisField + '], textarea[name=' + thisField + ']', $this).prevAll('label').first().append('<span class="addedError ' + args.errorClass + '">' + errorPrepend + data.badFields[thisField] + '</span>');
					}
					break;
				default:
					break;
			}
		}

		function clear_form()
		{
			inputs.val('');
		}

		function hide_errors() {
			$('.addedError', $this).remove();
			formFields.removeClass(args.errorClass);
			message.removeClass(args.errorClass);
			message.html('');
		}

		//enable submission
		function enable_submit() {
			submitButton.removeAttr('disabled');
			submitEnabled  = true;
		}

		//disable form
		function disable_submit() {
			submitEnabled  = false;
			submitButton.attr('disabled', true);
		}

		function disable_form() {
			inputs.attr('disabled', true);
			$this.attr('disabled', true);
			submitButton.attr('disabled', true);
		}

		function enable_form() {
			$this.removeAttr('disabled');
			inputs.removeAttr('disabled');
			message.removeClass('disabled');
			submitButton.removeAttr('disabled');
		}

		return this;
	};
}(jQuery));