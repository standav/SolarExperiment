'use strict';

function LoadWeatherValues(GloriaAPI, scope) {
	return scope.sequence.execute(function() {
		return GloriaAPI.executeOperation(scope.rid, 'load_weather_values',
				function(data) {
				}, function(error) {
					// alert(error);
				});
	});
}

function LoadWeatherContent(GloriaAPI, scope) {
	return scope.sequence.execute(function() {
		return GloriaAPI.getParameterValue(scope.rid, 'weather',
				function(data) {
					scope.wind.value = data.wind.value;
					scope.wind.high = scope.wind.value > 7;
					scope.rh.value = data.rh.value;
					scope.rh.high = scope.rh.value > 80;
					scope.valuesLoaded = true;
					scope.$parent.$parent.weatherLoaded = true;

					scope.$parent.$parent.weatherAlarm = scope.rh.high
							|| scope.wind.high;

				}, function(error) {

				});
	});
}

function SolarWeatherCtrl(GloriaAPI, $sequenceFactory, $scope, $timeout) {

	$scope.sequence = $sequenceFactory.getSequence();
	$scope.wind = {
		value : 0,
		high : false,
		style : {}
	};
	$scope.rh = {
		value : 0,
		high : false,
		style : {}
	};
	$scope.valuesLoaded = false;

	$scope.status = {
		time : {}
	};

	$scope.$watch('elapsedTimeLoaded', function() {
		if ($scope.rid > 0) {
			$scope.status.time.timer = $timeout($scope.status.time.onTimeout,
					1000, 1000);
		}
	});

	$scope.status.time.onTimeout = function() {

		LoadWeatherValues(GloriaAPI, $scope);
		LoadWeatherContent(GloriaAPI, $scope).then(
				function() {
					$scope.status.time.timer = $timeout(
							$scope.status.time.onTimeout, 10000, 0);
				}, function() {
					$timeout.cancel($scope.status.time.timer);
				});
	};

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.status.time.timer);
	});
}