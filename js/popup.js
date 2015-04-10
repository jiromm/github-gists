$(function() {
	var $auth = $('.identify'),
		$gistContainer = $('.gist-container'),

		$loginSubmit = $('.login-submit'),
		$loginField = $('.login-field'),
		$loginErrorMessage = $('.login-error-message'),
		$login = $('.login'),
		$avatar = $('.avatar'),
		$gists = $('.gists'),
		$loading = $('.loading'),
		$errorMessage = $('.error-message'),

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
		var $self = $(this),
			login = o('login');

		$gistContainer.removeClass('hide');
		$auth.addClass('hide');
		$login.text(login);
		$avatar.attr('src', o('avatar'));
		$fnOpenGists.attr('href', getOnlineGistsUrl(login));

		$(this).on('showError', function(e, message) {
			$gists.addClass('hide');
			$errorMessage.removeClass('hide');
			$errorMessage.find('p').html(message);
		});

		$(this).on('downloadGists', function(e, callback) {
			$self.trigger('loadingStart');

			$.getJSON(getGistsUrl(login))
				.done(function(json) {
					if (json.length) {
						$gists.find('ul').html('');

						for (var gist in json) {
							if (json.hasOwnProperty(gist)) {
								$gists.find('ul').append('<li>' + json[gist].description + '</li>')
							}
						}
					} else {
						$self.trigger('showError', ['You have no gists. <a href="' + getOnlineGistsUrl(login) + '" target="_blank">Add First One</a>.']);
					}
				})
				.fail(function(jqxhr, textStatus, error) {
					$self.trigger('showError', ['Something went wrong']);
				})
				.always(function() {
					$self.trigger('loadingStop');
				});

			if (callback instanceof Function) {
				callback();
			}
		});

		$(this).on('loadingStart', function() {
			$gists.addClass('hide');
			$errorMessage.addClass('hide');
			$loading.removeClass('hide');
		});

		$(this).on('loadingStop', function() {
			$loading.addClass('hide');
		});

		$(this).on('loadGists', function() {
			$errorMessage.addClass('hide');
			$gists.removeClass('hide');
		});

		if (o('haveGists')) {
			$(this).trigger('loadGists');
		} else {
			$(this).trigger('downloadGists', [function() {
				$self.trigger('loadGists');
			}]);
		}
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
