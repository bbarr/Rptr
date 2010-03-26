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
	
	var xhr = null;
	
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
			this.data = jetpack.prepareQueryString(cfg.data);
		} else {
			this.data = '';
		}
		
		// Set up the headers
		if(this.method === 'POST') {
			this.headers = new Array();
			this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			this.headers['Content-length'] = this.data.length;
		} 
		else {
			this.uri += '?' + this.data;
		}
		
		this.errorHandler = cfg.errorHandler || null;
		this.throbber = cfg.throbber || null;
		this.success = cfg.success || null;
		this.async = cfg.async || true;
		
		/**
		* Now that we have our configuration set up, we can send this now; or push it to the queue
		*/
		if(!inProgress) {
			inProgress = true;
			
			currentRequest = this;
			jetpack.send(this);
		}
		else {
			requestQueue.push(this);
		}
		
	};
	
	var jetpack = {
			
		/**
		* Internal method for creating an XHR object
		*/
		_createXHR : function () {
			if(window.XMLHttpRequest) {
				xhr = new XMLHttpRequest;
			}
			else if(window.ActiveXObject) {
				var _xhr, axo, ex, objects, success = false;
				objects = ['Microsoft', 'Msxml2', 'Msxml3'];
				
				for(var i=0; i<objects.length; i++) {
					axo = objects[i] + '.XMLHTTP';
					
					try {
						_xhr = new ActiveXObject(axo);
						xhr = _xhr;
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
			
			xhr.onreadystatechange = jetpack._onreadystatechange;
		},
		
		/**
		* Internal method for handling XHR ready state change
		*/
		_onreadystatechange : function () {
			if(xhr.readyState == 4) {
				// Finished request		
				if(xhr.status === 200) {
					if(currentRequest.success) {
						// Execute user provided callback for successful transmission
						var response = xhr.responseXML || xhr.responseText;
						currentRequest.success(response);
					}
					
					jetpack.finishRequest();
				}
				// Error
				else {
					if(currentRequest.errorHandler) {
						// Execute user provided callback for error
						currentRequest.errorHandler();
					}
					
					jetpack.finishRequest();
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
			var qString = '', i=0;
			for(var name in data) {								
				
				if(i>0) qString += '&'
				
				qString += name + '=' + data[name];
				
				i++;
			}
			
			return qString;
		},
		
		/**
		* Send out a request with the provided
		* Jetpack Request object
		*
		* @param {Object} Jetpack Request
		*/
		send : function (jetpackRequest) {
			xhr.open(jetpackRequest.method, jetpackRequest.uri, jetpackRequest.async);

			// Run the user specified throbber function
			if(jetpackRequest.throbber) {
				jetpackRequest.throbber();
			}
			
			if(jetpackRequest.method === 'POST') {
				data = jetpackRequest.data;
			}
			else {
				data = '';
			}
			
			xhr.send(data);
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
				setTimeout(function() { jetpack.send(currentRequest); }, 500);
			}
			else {
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
			if(!xhr) {
				jetpack._createXHR();
			}
			
			var _request = new jetpackRequest(cfg);
		}
	};
		
})();