'use strict';

function LoadMyImages($gloriaAPI, scope) {
	scope.images = [];

	return $gloriaAPI.getImagesByContext(scope.rid, function(data) {
		var i = 0;

		data.forEach(function(element) {
			scope.images.push({
				order : i,
				jpg : element.jpg,
				fits : element.fits,
				date : element.creationDate,
				target : element.target
			});
			i++;
		});
	});

}

function SolarImagesCtrl($gloriaAPI, $sequenceFactory, $scope, $timeout, $modal, $log) {

	$scope.sequence = $sequenceFactory.getSequence();
	$scope.images = [];
	$scope.currentIndex = 0;
	$scope.thumbsReady = true;	

	$scope.items = [ 'item1', 'item2', 'item3' ];

	$scope.sliderStyle = {
		left : "0px"
	};

	$scope.$watch('rid', function() {
		if ($scope.rid > 0) {
			LoadMyImages($gloriaAPI, $scope);
			$scope.sliderStyle.left = "0px";
		}
	});
	
	$scope.latencyTimeout = function() {
		$scope.thumbsReady = true;
	};

	$scope.$watch('imageTaken', function() {
		if ($scope.rid > 0 && $scope.$parent.imageTaken) {			
			LoadMyImages($gloriaAPI, $scope).then(function() {
				$scope.thumbsReady = false;	
				$scope.currentIndex = Math.max(0, $scope.images.length - 6);
				$scope.latencyTimer = $timeout($scope.latencyTimeout, 1000);
			});
		}
	});

	$scope.nextRight = function() {
		if ($scope.currentIndex + 6 < $scope.images.length) {
			$scope.currentIndex++;
		}
	};

	$scope.nextLeft = function() {
		if ($scope.currentIndex > 0) {
			$scope.currentIndex--;
		}
	};

	$scope.filterFn = function(element) {
		return element.order >= $scope.currentIndex
				&& element.order < $scope.currentIndex + 6;
	};

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.latencyTimer);
	});

	$scope.open = function(image) {

		var modalInstance = $modal.open({
			templateUrl : 'myModalContent.html',
			controller : ModalInstanceCtrl,
			resolve : {
				image : function() {
					return image;
				}
			},
			windowClass : "image-modal"
		});

		modalInstance.result.then(function(selectedItem) {
			$scope.selected = selectedItem;
		}, function() {
			$log.info('Modal dismissed at: ' + new Date());
		});
	};

}

var ModalInstanceCtrl = function($scope, $modalInstance, $location, image) {

	$scope.image = image;
	/*
	 * $scope.selected = { item : $scope.items[0] };
	 */

	$scope.ok = function() {
		$modalInstance.close($scope.url);
	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};

	$scope.downloadJpg = function() {

	};
};