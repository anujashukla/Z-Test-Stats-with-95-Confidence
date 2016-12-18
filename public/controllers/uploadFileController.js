//Controller for the homepage
var app = angular.module('myApp', []);
app.controller('uploadFileController',['$scope', '$http', '$window', '$location', function($scope,$http,$window,$location) {
	// Default sufficiency condition is none
	$scope.condition = 'none';

	// Process the uploded file and fetch the data from it
	$scope.process = function () {
		$http.get('/fetchData/').success(function(response) {
			if(response == 'error in file format') {
				// error in uploded file
				alert('wrong file format');
			} else {
				// Got the data and now need to process it for the results
		    	$window.processData(response, $scope.condition);
			}
		});
	}

	// Go to the stastistics page
	$scope.goToCalculationPage = function () {
		$window.location.href = 'calculations.html';
	}

	// Go to the home page
	$scope.goToHome = function() {
		console.log('here');
		$window.location.href = 'index.html';
	}
}]);

