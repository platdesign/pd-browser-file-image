'use strict';

module.exports = BrowserFileImage;

var BrowserFile = require('pd-browser-file');


function BrowserFileImage(rawFile) {

	var self = this;


	// Create BrowserFile instance from given rawFile
	var file = new BrowserFile(rawFile);

	// Create processing queues
	var configQueue = new Queue();
	var renderQueue = new Queue();


	var props = {};
	var targetProps = {
		format: file.raw.type
	};



	var canvas = document.createElement('canvas');
	var img = new Image();


	var ctx;


	// load proportions
	configQueue.add(function(){
		return file.toDataUrl()

			.then(function(dataUrl) {


				return new Promise(function(resolve, reject) {
					img.onload = function() {
						props.width = img.width;
						props.height = img.height;
						resolve();
					};

					img.src = dataUrl;
				});

		});
	});

	renderQueue.add(function(){

		targetProps.width = targetProps.width || props.width;
		targetProps.height = targetProps.height || props.height;


		canvas.width = targetProps.width;
		canvas.height = targetProps.height;
		ctx = canvas.getContext('2d');
	});



	/**
	 * Resize image with given parameters
	 * @param  {Number} width
	 * @param  {Number} height
	 * @param  {Boolean} ignoreRatio If set to true the ratio of given image will be ignored.
	 * @return {Object}              self for method chaining
	 */
	this.resize = function(width, height, ignoreRatio) {

		configQueue.add(function() {

			// read width from arguments
			if((width && !height) || (width && ignoreRatio)) {
				targetProps.width = width;
			}

			// read height from arguments
			if((height && !width) || (height && ignoreRatio))  {
				targetProps.height = height;
			}

			// calculate target width
			if(targetProps.height && !targetProps.width && !ignoreRatio) {
				targetProps.width = (props.width / props.height) * targetProps.height;
			}

			// calculate target height
			if(targetProps.width && !targetProps.height && !ignoreRatio) {
				targetProps.height = (props.height / props.width) * targetProps.width;
			}

		});

		return this;
	};




	/**
	 * Set image format
	 * @param  {String} format jpg|png
	 * @return {Object}        self for method chaining
	 */
	this.format = function(format) {
		var formats = {
			'jpg': 'image/jpeg',
			'png': 'image/png'
		};
		configQueue.add(function() {
			targetProps.format = formats[format.toLowerCase()];
		});
		return this;
	};



	/**
	 * Execute config-, and renderQueue
	 * @return {Promise} resolves when image is processed
	 */
	this.exec = function() {

		renderQueue.add(function() {
			ctx.drawImage(img, 0, 0, targetProps.width, targetProps.height);
		});

		return configQueue.exec()
			.then(function(){
				return renderQueue.exec();
			})
			.then(function() {
				return self;
			});
	};



	/**
	 * Execute image processing and return the dataUrl of processed image
	 * @return {String} dataUrl
	 */
	this.toDataUrl = function() {

		return this.exec()
			.then(function() {

				// return dataUrl
				return canvas.toDataURL(targetProps.format);
			});
	};

}





/**
 * Simple promise queue
 */
function Queue() {
	var batch = [];

	/**
	 * Add a handler to queue
	 * @param {Function} handler
	 */
	this.add = function(handler) {
		batch.push(handler);
	};

	/**
	 * Executes queue
	 * @return {Promise}
	 */
	this.exec = function() {
		var promise = Promise.resolve();

		batch.forEach(function(handler){
			promise = promise.then(handler);
		});

		return promise;
	};

}
