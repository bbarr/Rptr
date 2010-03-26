/**
* Raptor JetPacks - Because raptors need to fly too!
*
* Raptor HTTP
* Provides automatic queueing of ajax requests
*
* @author Damian Galarza (dglrza@gmail.com)
*/

// Silently create raptor namespace
if(typeof raptor === 'undefined') {
	var raptor = {};
}

raptor.jetpack = (function () {
	
	var jetpack = null;
	
	// Hold our status here (are we currently sending any requests already?)
	var inProgress = false;
	
	// Store the current request that's being sent out
	var currentRequest = null;
	
	// Hold our queue
	var requestQueue = new Array();
	
	// Hold a timeout
	var queueTimeout = null;
	
	/**
	* Create a jetpack request object which we can popuplate
	* for queueing requests
	*
	* @param {Object} Configuration
	*
	* uri : Request URI
	* method (Optional) : GET|POST (Defaults to get)
	* data (Optional) : Object or array of data to send with the request
	* errorHandler (Optional) : Callback for errors
	* throbber (Optional) : Callback for throbber
	* success (Optional) : Callback for successful transmission
	* async (Optional) : {Bool}
	*  
	*/
	var jetpackRequest = function (cfg) {
		
		// Set the URI for our ajax request; this is required
		
		try {
			if(cfg.uri) {
				this.uri = cfg.uri;
			}
			else {
				throw 'No URI Specified for the AJAX Request';
				return;
			}
		}
		
		catch(ex) {};
		
		this.method = cfg.method || 'GET';
		
		// If we're given some data to send; prepare it
		if(cfg.data) {
			this.data = _this.prepareQueryString(cfg.data);
		} else {
			this.data = '';
		}
		
		this.errorHandler = cfg.errorHandler || null;
		this.throbber = cfg.data || null;
		this.success = cfg.success || null;
		this.async = cfg.async || true;
		
		/**
		* Now that we have our configuration set up, we can send this now; or push it to the queue
		*/
		if(!inProgress) {
			inProgress = true;
			
			currentRequest = this;
			_this.send(this);
		}
		else {
			requestQueue.push(this);
		}
		
	};
	
	var _this = {
			
		/**
		* Internal method for creating an XHR object
		*/
		_create : function () {
			if(window.XMLHttpRequest) {
				jetpack = new XMLHttpRequest;
			}
			else if(window.ActiveXObject) {
				var xhr, axo, ex, objects, success = false;
				objects = ['Microsoft', 'Msxml2', 'Msxml3'];
				
				for(var i=0; i<objects.length; i++) {
					axo = objects[i] + '.XMLHTTP';
					
					try {
						xhr = new ActiveXObject(axo);
						jetpack = xhr;
						success = true;
					}
					
					catch(ex) {};
				}
				
				if(!success) {
					throw 'Unable to create XHR object.';
					return;
				}
			}
			else {
				throw "XMLHttp is not supported.";
				return;
			}
			
			jetpack.onreadystatechange = _this._onreadystatechange;
		},
		
		/**
		* Internal method for handling XHR ready state change
		*/
		_onreadystatechange : function () {
			if(jetpack.readyState == 4) {
				// Finished request		
				if(jetpack.status === 200) {
					if(currentRequest.success) {
						// Execute user provided callback for successful transmission
						var response = jetpack.responseXML || jetpack.responseText;
						currentRequest.success(response);
					}
					
					_this.finishRequest();
				}
				// Error
				else {
					if(currentRequest.errorHandler) {
						// Execute user provided callback for error
						currentRequest.errorHandler();
					}
					
					_this.finishRequest();
				}
			}
		},
		
		/**
		* Takes data  and generates a query string to send in our
		* Ajax request
		*
		* @param {Object}
		*/
		prepareQueryString : function (data) {
			return '';
		},
		
		/**
		* Send out a request with the provided
		* Jetpack Request object
		*
		* @param {Object} Jetpack Request
		*/
		send : function (jetpackRequest) {
			jetpack.open(jetpackRequest.method, jetpackRequest.uri, jetpackRequest.async);

			// Run the user specified throbber function
			if(currentRequest.throbber) {
				currentRequest.throbber();
			}

			jetpack.send(jetpackRequest.data);
		},
		
		/**
		* Finish up the request
		*/
		finishRequest : function () {
			// Reset the current Request
			currentRequest = null;
			
			//If we have another request queued up, fire it
			if(requestQueue.length > 0) {
				currentRequest = requestQueue[0];
				requestQueue = requestQueue.slice(1);
				
				// Force a delay before executing the next request in queue
				setTimeout(function() { _this.send(currentRequest); }, 500);
			}
			else {
				console.log('done');
				// Reset the in progress flag if we're done
				inProgress = false;
			}
		}
	};
	
	return {
		
		/**
		* Enage the jetpack!
		* Send out a request
		* 
		* @param {Object} Configuration for the request 
		* See jetpackRequest
		*/
		engage : function (cfg) {
			
			// If no XHR was created earlier, we'll need to make one
			if(!jetpack) {
				_this._create();
			}
			
			var _request = new jetpackRequest(cfg);
		}
	}
		
})();