// confirm the hs namespace
if (typeof hs === 'undefined') var hs = {};

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
hs.ApplicationError = function(message, script_location, line) {
	
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

hs.ApplicationError.prototype = {
	
	// Sends error message via AJAX
	send : function() {
		console.log('sending error:');
		console.log(this);
		console.log(this.to_params());
		//$.ajax('/messages/create_feedback', this.to_params())
	},
	
	// Build and return a param string for sending feedback
	to_params : function() {
		return {
			email : 'email@domain.com',
			subject : 'Uncaught javascript exception at ' + this.url,
			message : 'An error: "' + this.message + '" of type: "' + this.type + '" at line: ' + this.line + ' in the script file: "' + this.script_location + '", with the stack: ' + this.stack
		}
	}
}

// implement sitewide onerror event
window.onerror = function(message, url, line) {
	new hs.ApplicationError(message, url, line);
	
	// suppress browser's native "breaking"
	// return true;
};