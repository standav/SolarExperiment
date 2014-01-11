'use strict';

function SetMountStatus($gloriaAPI, scope, status) {
	return $gloriaAPI.setParameterTreeValue(scope.rid, 'mount', 'saved_status',
			status, function(data) {
				scope.status.context = status;
			});
}

function GetMountStatus($gloriaAPI, scope) {
	return $gloriaAPI.getParameterTreeValue(scope.rid, 'mount', 'saved_status',
			function(data) {

				if (data == null || data == "") {
					SetMountStatus($gloriaAPI, scope, 'INIT');
					scope.status.context = 'INIT';
				} else {
					scope.status.context = data;
				}

				return scope.status.context;
			}, function(error) {
				scope.status.context = 'INIT';
				SetMountStatus($gloriaAPI, scope, 'INIT');
			});
}

function SetTargetName($gloriaAPI, scope) {

	SetRates($gloriaAPI, scope);

	return $gloriaAPI.setParameterTreeValue(scope.rid, 'mount', 'target.object',
			'sun', function(data) {
				scope.targetMessage = scope.messages.requestPoint;
				scope.targetReady = true;
				scope.pointingEnabled = true;
				scope.sunIconStyle.opacity = 1.0;
				scope.$parent.targetSettingsLoaded = true;
				SetMountStatus($gloriaAPI, scope, 'TARGET_SET');
			});
}

function SetRates($gloriaAPI, scope) {
	scope.sequence.execute(function() {
		return $gloriaAPI.setParameterTreeValue(scope.rid, 'mount',
				'rates.tracking', 'DRIVE_SOLAR', function(data) {
				});
	});

	scope.sequence.execute(function() {
		return $gloriaAPI.setParameterTreeValue(scope.rid, 'mount',
				'rates.slew', 'CENTER', function(data) {
				});
	});

	scope.sequence.execute(function() {
		return $gloriaAPI.executeOperation(scope.rid, 'set_tracking_rate',
				function(data) {
				});
	});

	scope.sequence.execute(function() {
		return $gloriaAPI.executeOperation(scope.rid, 'set_slew_rate', function(
				data) {
		});
	});
}

function PointToTarget($gloriaAPI, scope) {
	scope.pointDone = false;
	scope.pointingEnabled = false;
	scope.sunIconStyle.opacity = 0.3;
	scope.targetMessage = scope.messages.pointing;
	scope.inAction = true;
	scope.$parent.arrowsEnabled = false;

	return $gloriaAPI.executeOperation(scope.rid, 'point_to_object', function(
			data) {
		scope.inAction = false;
		scope.pointDone = true;
		scope.targetMessage = scope.messages.pointed;
		SetMountStatus($gloriaAPI, scope, 'POINTED');
	}, function(error) {
		scope.inAction = false;
		alert(error);
	});
}

function MoveMount($gloriaAPI, scope, direction) {

	var operation = '';

	if (direction == 'WEST') {
		scope.targetMessage = scope.messages.movingWest;
		operation = 'move_west';
	} else if (direction == 'EAST') {
		scope.targetMessage = scope.messages.movingEast;
		operation = 'move_east';
	} else if (direction == 'NORTH') {
		scope.targetMessage = scope.messages.movingNorth;
		operation = 'move_north';
	} else if (direction == 'SOUTH') {
		scope.targetMessage = scope.messages.movingSouth;
		operation = 'move_south';
	}

	scope.inAction = true;
	scope.$parent.arrowsEnabled = false;
	return $gloriaAPI.executeOperation(scope.rid, operation, function(data) {
		scope.targetMessage = scope.messages.movementDone;
	}, function(error) {
		scope.targetMessage = scope.messages.movementError;
	});
}

function SetTargetMessage(scope) {
	if (scope.status.context == 'INIT') {
		scope.targetMessage = scope.messages.settingTarget;
	} else if (scope.status.context == 'TARGET_SET') {
		scope.targetMessage = scope.messages.requestPoint;
	} else if (scope.status.context == 'POINTED') {
		scope.targetMessage = scope.messages.pointed;
	}
}

function SolarMountCtrl($gloriaAPI, $sequenceFactory, $scope, $timeout) {

	$scope.sequence = $sequenceFactory.getSequence();
	$scope.targetReady = false;
	$scope.pointDone = true;
	$scope.pointingEnabled = false;
	$scope.targetMessage = "";
	$scope.sunIconStyle = {
		opacity : 0.3
	};

	$scope.messages = {
		init : "Loading.",
		settingTarget : "Setting up the target.",
		pointing : "Asking TADs to point to the Sun.",
		requestPoint : "Just click on the Sun to start pointing.",
		pointed : "Once the Sun is visible, you can use the finder arrows to center.",
		movingEast : "Moving to the east.",
		movingWest : "Moving to the west.",
		movingNorth : "Moving to the north.",
		movingSouth : "Moving to the south.",
		movementDone : "Done.",
		movementError : "Sorry, an error has occured."
	};

	$scope.targetMessage = $scope.messages.init;

	$scope.status = {
		time : {},
		context : null
	};

	$scope.$watch('movementRequested', function() {
		if ($scope.$parent.movementRequested
				&& $scope.$parent.movementDirection != null
				&& $scope.$parent.movementDirection != undefined) {
			MoveMount($gloriaAPI, $scope, $scope.$parent.movementDirection)
					.then(
							function() {
								$scope.status.time.messageTimer = $timeout(
										$scope.status.time.refreshMessages,
										3000);
							});
		}
	});

	$scope.$watch('ccdImagesLoaded', function() {
		if ($scope.rid > 0) {

			console.log("mount controller started!");
			$scope.sequence.execute(function() {
				return GetMountStatus($gloriaAPI, $scope);
			}).then(function() {

				SetTargetMessage($scope);

				if ($scope.status.context == 'INIT') {
					SetTargetName($gloriaAPI, $scope);
				} else if ($scope.status.context == 'TARGET_SET') {
					$scope.targetReady = true;
					$scope.pointingEnabled = true;
					$scope.sunIconStyle.opacity = 1.0;
					$scope.$parent.targetSettingsLoaded = true;
				} else if ($scope.status.context == 'POINTED') {
					$scope.targetReady = true;
					$scope.pointDone = true;
					$scope.pointingEnabled = true;
					$scope.sunIconStyle.opacity = 1.0;
					$scope.$parent.targetSettingsLoaded = true;
					$scope.$parent.arrowsEnabled = true;
				}
			});
		}
	});

	$scope.pointToTarget = function() {
		if ($scope.pointingEnabled && $scope.targetReady) {
			PointToTarget($gloriaAPI, $scope).then(
					function() {
						$scope.status.time.pointingTimer = $timeout(
								$scope.status.time.reenablePointing, 30000);
					});
		}
	};

	$scope.status.time.refreshMessages = function() {
		SetTargetMessage($scope);
		$scope.inAction = false;
		$scope.$parent.arrowsEnabled = true;
		$scope.$parent.movementRequested = false;
	};

	$scope.status.time.reenablePointing = function() {
		$scope.pointingEnabled = true;
		$scope.sunIconStyle.opacity = 1.0;
		$scope.$parent.arrowsEnabled = true;
	};

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.status.time.messageTimer);
		$timeout.cancel($scope.status.time.pointingTimer);
	});
}