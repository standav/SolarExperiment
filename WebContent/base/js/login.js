'use strict';

function LoginController($scope, $location, Login, gloriaView) {

	$scope.loaded = false;
	$scope.login = {};
	$scope.login.user = null;
	$scope.verified = false;

	Login.verifyToken(function() {
		$scope.login.user = Login.getUser();
		$scope.verified = true;
	}, function() {
		$scope.verified = true;
	});
	
	$scope.gotoMain = function() {
		$location.path(gloriaView.getMainView().path);		
	};

	$scope.login.connect = function() {

		console.log("Connected!");
		if ($scope.login.email != null && $scope.login.password != null) {
			Login.authenticate($scope.login.email, $scope.login.password).then(
					function() {
						$scope.login.user = $scope.login.email;
						$scope.gotoMain();
					}, function() {
						$scope.login.user = null;
						$scope.login.email = null;
						$scope.login.password = null;
					});
		}
	};

	$scope.login.disconnect = function() {
		console.log("Disconnected!");
		Login.disconnect();
		$scope.login.user = null;
		$scope.login.email = null;
		$scope.login.password = null;
		document.execCommand("ClearAuthenticationCache");
		$scope.gotoMain();
	};

	$scope.$on('unauthorized', function() {
		console.log("unauthorized event received!");
		$scope.login.disconnect();
	});

	$scope.$on('server down', function() {
		console.log("server down event received!");
		$scope.login.disconnect();
	});
}