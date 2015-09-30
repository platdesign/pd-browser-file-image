'use strict';

var angular = require('angular');
var FileImage = require('./browser-file-image.js');

var mod = module.exports = angular.module('pd.browser-file-image', []);

mod.value('FileImage', FileImage);
