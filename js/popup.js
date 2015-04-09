$(function() {
	var $auth = $('.identify'),
		$gistContainer = $('.gist-container'),

		$loginSubmit = $('.login-submit'),
		$loginField = $('.login-field'),
		$loginErrorMessage = $('.login-error-message'),
		$login = $('.login'),
		$avatar = $('.avatar'),

		$fnOpenGists = $('.fn-open-gists'),
		$fnRefreshList = $('.fn-refresh-list'),
		$fnChangeAccount = $('.fn-change-account'),

		o = function(property, value) {
			if (value == undefined) {
				return localStorage.getItem(property);
			}

			return localStorage.setItem(property, value);
		},

		getProfileUrl = function(login) {
			return 'https://api.github.com/users/:login'.replace(':login', login);
		},
		getGistsUrl = function(login) {
			return 'https://api.github.com/users/:login/gists'.replace(':login', login);
		},
		getOnlineGistsUrl = function(login) {
			return 'https://gist.github.com/:login'.replace(':login', login);
		},

		freezeButton = function(button, text) {
			button.attr('disabled', true).text(
				text == undefined ? 'Wait' : text
			);
		},
		unfreezeButton = function(button, text) {
			button.attr('disabled', false).text(text);
		};

	$gistContainer.on('isIdentified', function() {
		var login = o('login');

		$gistContainer.removeClass('hide');
		$auth.addClass('hide');
		$login.text(login);
		$avatar.attr('src', o('avatar'));
		$fnOpenGists.attr('href', getOnlineGistsUrl(login));

		if (o('haveGists')) {
			$(this).trigger('loadGists');
		} else {
			$(this).trigger('downloadGists', [function() {
				$(this).trigger('loadGists');
			}]);
		}

		$(this).on('loadGists', function() {

		});

		$(this).on('downloadGists', function(e, callback) {

			if (callback instanceof Function) {
				callback();
			}
		});
	});

	if (o('isIdentified')) {
		$gistContainer.trigger('isIdentified');
	} else {
		$loginField.focus();

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
						o('isIdentified', true);
						o('login', login);
						o('avatar', json.avatar_url);
						o('profileJSON', JSON.stringify(json));

						$gistContainer.trigger('isIdentified');
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
	}
});
