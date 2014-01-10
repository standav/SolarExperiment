'use strict';

var $routeProviderReference;

var v = angular.module('gloria.view', []);

function loadDependencies($q, $rootScope, $location, gloriaView) {
	var deferred = $q.defer();

	gloriaView.init(function() {
		var view = gloriaView.getViewInfoByPath($location.path());

		if (view != undefined && view.js.length > 0) {
			$script(view.js, function() {
				$rootScope.$apply(function() {
					deferred.resolve();
				});
			});
		} else {
			deferred.resolve();
		}
	});

	return deferred.promise;
}

function BasicViewCtrl($scope, $route, $location, gloriaView) {

	var view = gloriaView.getViewInfoByPath($location.path());

	if (view != undefined) {
		$scope.templateUrl = view.html;
	} else {
		$location.path(gloriaView.getWrongPathView().path);
	}
}

function MainViewCtrl($scope, $route, $location, gloriaView) {

	var view = gloriaView.getViewInfoByPath($location.path());

	if (view != undefined) {
		$scope.templateUrl = view.html;
	} else {
		$location.path(gloriaView.getWrongPathView().path);
	}

	var views = gloriaView.getViews();

	$scope.views = [];

	var i = 0;
	for ( var key in views) {
		$scope.views.push(views[key]);
		$scope.views[i].name = key;
		i++;
	}

	$scope.gotoView = function(name) {
		$location.path(name);
	};
}

v.service('gloriaView', function($http) {

	var views = null;

	var gView = {

		init : function(then) {
			if (views == null) {
				var url = 'conf/views.json';
				return $http({
					method : "GET",
					url : url,
					cache : false
				}).success(function(data) {
					views = data;
					if (then != undefined) {
						then();
					}
				}).error(function() {
					alert("View resource problem!");
				});
			} else {
				if (then != undefined) {
					then();
				}
			}
		},
		getViewInfoByName : function(name) {
			return views[name];
		},
		getViewInfoByPath : function(path) {
			for ( var key in views) {
				if (views[key].path == path) {
					return views[key];
				}
			}

			return undefined;
		},
		getWrongPathView : function(path) {
			for ( var key in views) {
				if (views[key].type == 'wrong-path') {
					return views[key];
				}
			}

			return '/';
		},
		getMainView : function(path) {
			for ( var key in views) {
				if (views[key].type == 'main') {
					return views[key];
				}
			}

			return '/';
		},
		getViews : function() {
			return views;
		}
	};

	return gView;
});

v.config(function($routeProvider, $locationProvider) {
	$routeProviderReference = $routeProvider;
});

v.run(function($rootScope, $http, $route, gloriaView) {
	gloriaView.init(function() {
		var views = gloriaView.getViews();

		for ( var key in views) {

			var type = views[key].type;
			var reqController = BasicViewCtrl;

			if (type == 'main') {
				reqController = MainViewCtrl;
			}

			$routeProviderReference.when(views[key].path, {
				template : '<div ng-include src="templateUrl"></div>',
				controller : reqController,
				resolve : {
					deps : function($q, $rootScope, $location, gloriaView) {
						return loadDependencies($q, $rootScope, $location,
								gloriaView);
					}
				}
			});
		}

		$routeProviderReference.otherwise({
			redirectTo : gloriaView.getWrongPathView().path,
		});

		$route.reload();
	});
});
