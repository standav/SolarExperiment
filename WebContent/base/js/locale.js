'use strict';

var locale = angular.module('gloria.locale', []);

function LocaleController($scope, $sce, $gloriaLocale, $window, gloriaView) {
	
	$scope.languages = $gloriaLocale.getLanguages();
	$scope.language = $gloriaLocale.getPreferredLanguage();

	// alert($scope.language);
	// var languageParts = $scope.language.split("-");
	// var currentLanguage = languageParts[0];

	// $gloriaLocale.setLanguage(currentLanguage);

	$scope.setLanguage = function(index) {
		$gloriaLocale.setPreferredLanguage($scope.languages[index]);
		$window.location.reload();
	};
}

locale.service('$gloriaLocale',
		function($locale, $http, $window, $cookieStore) {

			var languages = [ 'en', 'es', 'it', 'pl', 'cz', 'ru' ];

			$locale.dictionary = {};
			var preferredLang = $cookieStore.get('preferredLang');
			if (preferredLang == undefined) {
				preferredLang = $window.navigator.userLanguage
						|| $window.navigator.language || 'en-UK';
				
				 var languageParts = preferredLang.split("-");
				 preferredLang = languageParts[0];
			}

			var resourcesLoaded = [];

			var gLocale = {

				getLanguages : function() {
					return languages;
				},
				getDictionary : function() {
					return $locale.dictionary;
				},
				getLocale : function() {
					return $locale;
				},				
				getLanguage : function() {
					return $locale.id;
				},
				loadResource : function(path, name) {
					var url = path + '/lang_' + name + '_' + $locale.id
							+ '.json';
					$http({
						method : "GET",
						url : url,
						cache : false
					}).success(function(data) {
						$locale.dictionary[name] = data;
					}).error(function() {
						var url = path + '/lang_' + name + '_en.json';
						$http({
							method : "GET",
							url : url,
							cache : false
						}).success(function(data) {
							$locale.dictionary[name] = data;
						}).error(function() {
							alert("Locale resource problem!");
						});

					});

					/*if (resourcesLoaded.indexOf(name) < 0) {
						resourcesLoaded.push(name);
					}*/
				},
				loadCore : function(path, lang, post) {
					var url = path + '/lang_core_' + lang + '.json';
					$http({
						method : "GET",
						url : url,
						cache : false
					}).success(function(data) {
						$locale.DATETIME_FORMATS = data.DATETIME_FORMATS;
						$locale.NUMBER_FORMATS = data.NUMBER_FORMATS;
						$locale.id = data.id;
						$locale.dictionary = {};
						if (post != undefined) {
							post();
						}
					}).error(function() {
						var url = path + '/lang_core_en.json';
						$http({
							method : "GET",
							url : url,
							cache : false
						}).success(function(data) {
							$locale.DATETIME_FORMATS = data.DATETIME_FORMATS;
							$locale.NUMBER_FORMATS = data.NUMBER_FORMATS;
							$locale.id = data.id;
							$locale.dictionary = {};
							if (post != undefined) {
								post();
							}
						}).error(function() {
							alert("Locale core problem!");
						});

					});
				},
				getPreferredLanguage : function() {
					return preferredLang;
				},
				setPreferredLanguage : function(lang) {
					preferredLang = lang;
					$cookieStore.put('preferredLang', lang);
				}
			};

			gLocale.loadCore('base/lang', preferredLang, function() {
				gLocale.loadResource('base/lang', 'base');
			});

			return gLocale;
		});

locale.filter('i18n', function($gloriaLocale) {
	return function(key, p) {

		var dictionary = $gloriaLocale.getDictionary();

		var keyParts = key.split('.');
		var value = undefined;
		keyParts.forEach(function(key) {
			if (value == undefined) {
				value = dictionary[key];
			} else {
				value = value[key];
			}
		});

		if (typeof value != 'undefined' && value != '') {

			var result = (typeof p === "undefined") ? value : value.replace(
					'@{}@', p);
			return result;
		}
	};
});
