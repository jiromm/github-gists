$(function() {
	var $auth = $('.identify'),
		$gistContainer = $('.gist-container'),

		$loginSubmit = $('.login-submit'),
		$loginField = $('.login-field'),
		$loginErrorMessage = $('.login-error-message'),
		$login = $('.login'),
		$avatar = $('.avatar'),
		$gists = $('.gists'),
		$gist = $('.gist'),
		$description = $('.description'),
		$files = $('.files'),
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

		_o = function(property) {
			return localStorage.removeItem(property);
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
		},

		getListTemplate = function(id, label, files) {
			var labels = '',
				step = 0,
				max = 2;

			for (var filename in files) {
				if (files.hasOwnProperty(filename)) {
					if (!files[filename].language) {
						continue;
					}

					if (step < max) {
						step++;
					} else {
						labels += '<span>...</span>';

						break;
					}

					labels += '<span>' + files[filename].language + '</span>';
				}
			}

			return '<li data-id="' + id + '">' + label + '<span class="gist-labels">' + labels +'</span></li>';
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
			$gist.addClass('hide');
			$gists.addClass('hide');
			$errorMessage.removeClass('hide');
			$errorMessage.find('p').html(message);
		});

		$(this).on('loadGists', function() {
			$errorMessage.addClass('hide');
			$gists.removeClass('hide');

			var haveGists = o('haveGists'),
				json = JSON.parse(o('gists'));

			if (haveGists) {
				if (json.length) {
					$gists.find('ul').html('');

					for (var gist in json) {
						if (json.hasOwnProperty(gist)) {
							var label = json[gist].description;

							if (!label) {
								for (label in json[gist].files) break;
							}

							$gists.find('ul').append(getListTemplate(json[gist].id, label, json[gist].files));
						}
					}
				} else {
					haveGists = false;
				}
			} else {
				haveGists = false;
			}

			if (!haveGists) {
				$self.trigger('showError', ['You have no gists. <a href="' + getOnlineGistsUrl(login) + '" target="_blank"><strong>Add First One</strong></a>.']);
			}
		});

		$(this).on('downloadGists', function(e, callback) {
			$self.trigger('loadingStart');

			$.getJSON(getGistsUrl(login))
				.done(function(json) {
					var gists = [];

					if (json.length) {
						for (var gist in json) {
							if (json.hasOwnProperty(gist)) {
								gists.push({
									'url': json[gist].url,
									'id': json[gist].id,
									'html_url': json[gist].html_url,
									'files': json[gist].files,
									'public': json[gist].public,
									'description': json[gist].description,
									'comments': json[gist].comments
								});
							}
						}
					}

					o('haveGists', true);
					o('gists', JSON.stringify(gists));
				})
				.fail(function(jqxhr, textStatus, error) {
					$self.trigger('showError', ['Something went wrong']);
				})
				.always(function() {
					$self.trigger('loadingStop');

					if (callback instanceof Function) {
						callback();
					}
				});
		});

		$(this).on('loadingStart', function() {
			$gist.addClass('hide');
			$gists.addClass('hide');
			$errorMessage.addClass('hide');
			$loading.removeClass('hide');
		});

		$(this).on('loadingStop', function() {
			$loading.addClass('hide');
		});

		$fnChangeAccount.on('click', function(e) {
			e.preventDefault();

			_o('isIdentified');
			_o('login');
			_o('avatar');
			_o('profileJSON');
			_o('haveGists');
			_o('gists');

			setTimeout(window.location.reload, 100);
		});

		$fnRefreshList.on('click', function(e) {
			e.preventDefault();

			$(this).trigger('downloadGists', [function() {
				$self.trigger('loadGists');
			}]);
		});

		$gist.on('drawGist', function(e, gistId) {
			var json = JSON.parse(o('gists'));

			console.log(json);
			console.log(gistId);

			for (var gist in json) {
				if (json.hasOwnProperty(gist)) {
					if (json[gist].id == gistId) {
						$description.text(json[gist].description);

						break;
					}
				}
			}
		});

		$gists.on('click', 'li', function() {
			var id = $(this).attr('data-id');

			$gists.addClass('hide');
			$gist.removeClass('hide');

			$gist.trigger('drawGist', [id]);
		});

		// Entry Point if Identified
		if (o('haveGists')) {
			$(this).trigger('loadGists');
		} else {
			$(this).trigger('downloadGists', [function() {
				$self.trigger('loadGists');
			}]);
		}
	});

	// Entry Point
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
