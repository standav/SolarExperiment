'use strict';

/* App Module */

var toolbox = angular.module('toolbox', [ 'ngCookies', 'ngRoute', 'ngAnimate',
		'gloria.locale', 'gloria.view', 'gloria', 'ui.bootstrap' ]);

toolbox.filter('utc', [ function() {
	return function(date) {
		if (angular.isNumber(date)) {
			date = new Date(date);
		}
		return new Date(date.getUTCFullYear(), date.getUTCMonth(), date
				.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date
				.getUTCSeconds());
	};
} ]);

toolbox.directive('jtooltip', function() {
	return {
		// Restrict it to be an attribute in this case
		restrict : 'A',
		// responsible for registering DOM listeners as well as updating the DOM
		link : function(scope, element, attrs) {
			$(element).popover(scope.$eval(attrs.jtooltip));
			$(element).popover('show');
		}
	};
});
