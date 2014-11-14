// gm (GraphicsMagick) - For image manipulation: https://github.com/aheckmann/gm
var gm = require('gm');

/**
 * Uploader constructor.
 */
var Uploader = function(options){

	this.options = options;

};

/**
 * Validate file type and return boolean of validity.
 * @param {string} id - Used to uniquely identify file. Required.
 * @param {array} types - Array of string file content types (example: ['image/jpeg', 'image/gif', 'image/png']). Required.
 */
Uploader.prototype.validateType = function(file, types){

  var valid = false;
  
  var contentType = file.headers['content-type'];
  for(var i in types) {
    if(types[i] === contentType) {
      valid = true;
      break;
    }
  }

  return valid;

};

/**
 * Validate image file size.
 * @param {object} options - Configuration object. Required.
 * @param {function} successCallback - Callback function. Receives one argument - {object} status object. Required.
 * @param {function} errorCallback - Callback function. Receives one argument - {object} error stack trace. Required.
 */
Uploader.prototype.validateImageFileSize = function(options, successCallback, errorCallback){

  gm(options.source).filesize(function(err, fileSize){

    var validate_ = function(size){
      if(options.maxFileSize < size) {
        var message = 'File is larger than the allowed size of ' + options.maxFileSize + ' mb.';
        errorCallback.call(this, message);
      } else {
        successCallback.call(this);
      }
    };

    if(err){

      errorCallback.call(this, err);

    } else {

      if(fileSize.indexOf('M') !== -1) {
        var fileSize = fileSize.replace('M', '');
        validate_(fileSize);
      } else if(fileSize.indexOf('K') !== -1){
        var fileSize = fileSize.replace('K', '');
        fileSize = parseFloat(fileSize/1024).toFixed(2);
        validate_(fileSize);
      } else if(fileSize.indexOf('G') !== -1){
        var fileSize = fileSize.replace('G', '');
        fileSize = parseFloat(fileSize*1024).toFixed(2);
        validate_(fileSize);
      } else {
        successCallback.call(this);
      }

    }

  });

};

/**
 * Get the dimensions.
 * @param {string} source - Path of image. Required.
 * @param {function} callback - Callback that receives argument of false or data object. Required.
 */
Uploader.prototype.imageSize = function(source, callback){

  gm(source).size(function(err, value){
    callback.call(this, err, value);
  });

};

/**
 * Write image to directory.
 * @param {object} img - Image object. Required.
 * @param {object} options - Configuration object. Required.
 * @param {function} successCallback - Callback function. Receives one argument - {object} status object. Required.
 * @param {function} errorCallback - Callback function. Receives one argument - {object} error stack trace. Required.
 */
Uploader.prototype.writeImage = function(img, options, successCallback, errorCallback){

  img.write(options.destination, function(uploadErr){
    if(!uploadErr) successCallback.call(img, options.url);
    else errorCallback.call(img, uploadErr);
  });

};

/**
 * Get the Exif data of a file.
 * @param {string} source - Path of image. Required.
 * @param {function} callback - Callback that receives argument of false or data object. Required.
 */
Uploader.prototype.getExifData = function(source, callback){

  gm(source)
    .identify(function (dataErr, data) {
      if (!dataErr) {
        callback.call(this, data);
      } else { // no exif data
        callback.call(this, false);
      }
    });

};

/**
 * Resize the image
 * @param {object} options - Configuration object. Required.
 * @param {object} size - Holds properties - 'width', 'height'. Required.
 * @param {function} successCallback - Callback function. Receives one argument - {object} status object. Required.
 * @param {function} errorCallback - Callback function. Receives one argument - {object} error stack trace. Required.
 */
Uploader.prototype.resize = function(options, size, successCallback, errorCallback){

	var self = this;
  var img = gm(options.source);
  var newWidth = options.width;
  var newHeight = options.height;

  // if width or height dimension is unspecified
  if(options.width === 'auto' || options.height === 'auto') {

    if(options.width === 'auto') newWidth = null;
    if(options.height === 'auto') newHeight = null;

    img.resize(newWidth, newHeight);

  } else if(options.square && options.width === options.height) { // if this needs to be square

    // if we have size info
    if(typeof size !== 'undefined') {
      // if the width is more than height we make it null so that
      // we pass the height to be used by gm, so the outcome
      // is an image with a height set to the max
      // and the width is the aspect ratio adjusted... but will be bigger,
      // and then the gm crop method trims off the width overage.
      // the same would occur in vice versa if height is bigger than width.
      if(size.width >= size.height) newWidth = null;
      else newHeight = null;
    }

    img
      .resize(newWidth, newHeight)
      .gravity('Center')
      .crop(options.width, options.height, 0, 0)
      .quality(options.quality);

  } else { // else it doesn't need to be square

    // if we have size info
    if(typeof size !== 'undefined') {
      // if the the image width is larger than height... else height is larger
      if(size.width >= size.height){
        // if new height is less than options.height - we're good and we use options.width
        // as the max value pass to the gm resize function...
        if((size.height / size.width) * options.width <= options.height) newHeight = null;
        // ...else we use options.height as the max value to pass into the gm resize
        else newWidth = null
      } else {
        // same logic as if block... just reversed
        if((size.width / size.height) * options.height <= options.width) newWidth = null;
        else newHeight = null
      }
    }

    img.resize(newWidth, newHeight);

  }

  img
    .quality(options.quality)
    .autoOrient();

  if(options.noProfile) img.noProfile();

  self.writeImage(img, options, successCallback, errorCallback);

};

// Respond with JSON
var jsonResponse_ = function(res, status, msg, url){
	var url = (typeof url !== 'undefined') ? url : false;
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
  res.end(JSON.stringify({ 'status' : status, 'message' : msg, 'url' : url }));
};

// routes
exports.setup = function(app) {

	app.post('/upload/message', function(req, res, next){ 
		
		var dateString = new Date().getTime();
		var file = req.files.message_upload;
		var imgName = dateString + '_' + (file.name).replace(/[^a-z0-9.]/gi, '_').toLowerCase(); // replaces non letters, numbers, periods

		var options = {
      width : 600,
      height : 'auto',
      source : (typeof file !== 'undefined')
      	? file.path
      	: false,
	    maxFileSize : 5,
	    destination : './public/images/uploads/messages/' + imgName,
	  	url : '/images/uploads/messages/' + imgName
	  };

		var uploader = new Uploader(options);

		var isValidType = uploader.validateType(file, ['image/jpeg', 'image/gif', 'image/png', 'image/tiff']);

		// resize it
		if(isValidType && file) {

			uploader.validateImageFileSize(options, function(){
				uploader.imageSize(options.source, function(err, size) {
					if(!err) {
						uploader.resize(options, size, function(){
					    console.log('resize success');
					    jsonResponse_(res, 'success', 'Upload success!', options.url);
					  }, function(err){
					    console.error('unable to resize: ', err);
					    jsonResponse_(res, 'err', err);
					  });
					} else {
						jsonResponse_(res, 'error', err);
					}
				});
			}, function(err){
				jsonResponse_(res, 'error', err);
			});

		} else {
			jsonResponse_(res, 'error', 'File is not a valid type.');
		}

	});
	
};