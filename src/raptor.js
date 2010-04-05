/*
* RaptorJS
* 
* The raptor Library follows a first come, first serve policy of loading
* Any previously loaded version of the raptor.js file is the 
* 
* TODO: 
* raptor.require
* raptor.setModulePath
* raptor.build // DOM Builder
* raptor.xhr
* 
* 
*/



(function(){

	/*  Determine where the core file is located, and store the URI prefix
	*/
	var scripts = document.getElementsByTagName("script");
	for(var s=0; s<scripts.length; s++) {
		if(scripts[s].src.match(/raptor\.js/)) {
			var baseURI = scripts[s].src.replace(/raptor\.js/, "");
			s = scripts.length;
		}
	}

	if(typeof(raptor) === 'undefined') {
		this.raptor = {
			version: '0.01a',
			config: {
				_baseURI: baseURI,
				// raptor assumes modules are located within the base directory unless
				// otherwise specified via raptor.setModulePath();
				_moduleURI: baseURI,
				_loadedModules: [],
				_scriptReady: [], // temp fix for opera using both onload and onreadystatechange
				// Array of modules loaded as part of raptor's core
				_baseModules: ['util']
			}
		};
	}
	
	/* Function parameter augmentation
	** Andre Lewis
	** http://earthcode.com/blog/2006/01/optional_args.html
	*/
	raptor.augment = function(oSelf, oOther) {
		if (oSelf == null) {
			oSelf = {};
		}
		for (var i = 1; i < arguments.length; i++) {
			var o = arguments[i];
			if (typeof(o) != 'undefined' && o != null) {
				for (var j in o) {
					oSelf[j] = o[j];
				}
			}
		}
		return oSelf;
	}
	
	/* Module and dependency loading mechanism
	** 
	** Usage Examples:
	** raptor.require('path/to/module', { callback: 'someFunc()' });
	** raptor.require(['path/moduleA', 'path/moduleB'], { callback: 'someFunc()' });
	*/
	raptor.require = function(modules, options) {
		// available options to be passed are listed below
		var options = raptor.augment({
			callback: null
		}, options);
		
		// modules can be either a string or array
		if(typeof(modules) == "string") {
			_load(modules);
		} else if(modules.length) {
			// Hold an internal queue status of what we're requiring
			var _internalQueue = new Array();
			for(var i=0; i<modules.length; i++) {
				_load(modules[i]);
			}
		}
		
		function _queueHandler (mod) {
			_internalQueue.push(mod);
			raptor.config._scriptReady.push(mod);
		};
		
		/**
		* Internal module loader
		*
		* @param{String} Module we're loading
		*/
		function _load (mod) {
			if(!raptor.config._loadedModules[mod]) {
				
				var script = document.createElement("script");
				script.src = raptor.config._moduleURI + mod + ".js";
				script.type = "text/javascript";
				document.getElementsByTagName("head")[0].appendChild(script);
				
				script.onload = script.onreadystatechange = function() {
					// raptor.config._scriptReady[]
					if(raptor.config._scriptReady.indexOf(mod) > -1) {
						return true;
					} else {
						//raptor.config._scriptReady.push(mod);
						_queueHandler(mod);
					}
				}
			}
		};
	}
	
	/**
	* Extend an object's properties, recursively
	* handling an array of objects
	*
	* @param {Object} Target object to extend into
	* @param {Object|Array} 
	*/
	raptor.extend = function(target, src) {
		
		// Extend the target by all the src
		if(src.length) {
			var _length = src.length;
			for(var i=0; i<_length; i++) {
				target = raptor.extend(target, src[i]);
			}
		}
		// Extend the source properties into the target
		else {
			for(var name in src) {
				target[name] = src[name];
			}
		}
				
		return target;
	}
	
	/**
	* Document ready state handler for raptor
	*/
	var _ready = {
		
		// Hold the ready queue
		_readyQueue : [],
		
		// Hold the ready state
		_isReady : false,
		
		/**
		* Handle appending a callback to the ready queue
		*/
		append : function (fn) {
			// Handle listeners
			_ready.handleReady();
			
			// If the document is already ready, just execute the callback
			if(_ready._isReady) {
				fn();
			}
			// Otherwise push to the queue
			else {
				_ready._readyQueue.push(fn);
			}
			
		},
		
		/**
		* Handle the ready queue
		*/
		ready : function () {
			if(_ready._readyQueue.length > 0) {
				var _length = _ready._readyQueue.length;
				for(var i=0; i<_length; i++) {
					_ready._readyQueue[i]();
				}
			}
		},
		
		handleReady : function () {
			
			if ( document.readyState === "complete" ) {
				_ready._isReady = true;
				return _ready.ready();
			}
			
			/**
			* Attach event handlers for the ready state of the page
			*/
			if ( document.addEventListener ) {
				//document.addEventListener( "DOMContentLoaded", _ready.ready, false );
				window.addEventListener( "load", _ready.ready, false );
			}
			else if( document.attachEvent) {
				window.attachEvent( "onload", _ready.ready );
			}
		}
	};
	
	// Extend the raptor object for ready
	raptor.extend(raptor, {
		'ready' : _ready.append
	});
	
	// Set up base modules found in the config
	raptor.ready(function () {
		var baseModules = raptor.config._baseModules;
		if(baseModules.length > 0) {
			raptor.require(baseModules);
		}
	});
	
})();