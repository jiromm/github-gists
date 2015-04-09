$(function() {
	var login = localStorage.getItem('login'),
		$loginSubmit = $('.login-submit'),
		$loginField = $('.login-field'),
		$loginErrorMessage = $('.login-error-message'),

		getProfileUrl = function(login) {
			return 'https://api.github.com/users/:login'.replace(':login', login);
		},
		getGistsUrl = function(login) {
			return 'https://api.github.com/users/:login/gists'.replace(':login', login);
		},

		freezeButton = function(button, text) {
			button.attr('disabled', true).text(
				text == undefined ? 'Wait' : text
			);
		},
		unfreezeButton = function(button, text) {
			button.attr('disabled', false).text(text);
		}
		;

	$loginSubmit.on('click', function(e) {
		e.preventDefault();

		var $self = $(this),
			login = $loginField.val();

		if (login.trim() == '') {
			$loginField.trigger('invalid');
		} else {
			freezeButton($self);

			$.getJSON(getProfileUrl(login))
				.done(function(json) {
					console.log(json);
				})
				.fail(function(jqxhr, textStatus, error) {
					var message = '';

					if (jqxhr.status == '404') {
						message = 'User not found.';
					} else {
						message = 'Something went wrong.';
					}

					$loginField.trigger('invalid', [message]);
				})
				.always(function() {
					unfreezeButton($self, 'Submit');
				});
		}
	});

	$loginField.on('valid', function() {
		$(this).parent().removeClass('has-error');
		$loginErrorMessage.addClass('hide');
	});

	$loginField.on('invalid', function(e, message) {
		if (message == undefined) {
			message = 'Make sure everithing is okay!';
		};

		$(this).parent().addClass('has-error');
		$loginErrorMessage.text(message).removeClass('hide');
	});

	$loginField.on('input', function() {
		$(this).trigger('valid');
	});
});
