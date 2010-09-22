/**
 *	This is a global exception handler.  It is automatically set to the window's onerror event
 *  for gecko/IE browsers, and can be used in any browser within a try catch (passing in the error object
 *  as the first argument), or anywhere (passing in any arguments manually)
 *
 *	@author Brendan Barr (brendan@homestars.com)
 *	@constructor
 *
 *	@param {String|Object} error message
 *  @param {String} url at which the error occured (optional)
 *  @param {String} line number
 *	@param {Boolean} auto-send on instantiation (optional - just set false as the last argument to disable auto-send)
 */

raptor.Exception = function(message, script_location, line) {
	
	// requires at least 1 argument
	if (!message) return;
	
	// setup container for a try catch exception
	var caught_exception = {};
	
	// if message isn't a string, it should be an object, a la the one recieved from a catch
	if (typeof message !== 'string') {
		caught_exception = message;
		message = message.message;
	}
	
	// assign properties gracefully
	this.message = message || 'An act of God';
	this.script_location = script_location || caught_exception.fileName || '';
	this.line = line || caught_exception.lineNumber || '';
	this.url = window.location.href || '';
	this.stack = caught_exception.stack || 'empty';
	this.type = caught_exception.name || 'unknown'

	// unless the last argument is false, send automatically
	if (arguments[arguments.length - 1] !== false) this.send();
}

raptor.Exception.prototype = {
	
	// Sends error message via AJAX and logs it
	send : function() {
		raptor.log('sending error:');
		raptor.log(this);
	},
}

// implement sitewide onerror event
window.onerror = function(message, url, line) {
	new raptor.Exception(message, url, line);
};