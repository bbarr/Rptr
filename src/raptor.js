/**
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

raptor = (function () {
	
	/**
	* Raptor Configuration
	*/
	var config = {
		_baseURI: '',
		// raptor assumes modules are located within the base directory unless
		// otherwise specified via raptor.setModulePath();
		_moduleURI: '',
		_loadedModules: [],
		_scriptReady: [], // temp fix for opera using both onload and onreadystatechange
		// Array of modules loaded as part of raptor's core
		_baseModules: []
	};

	/**
	* PUBLIC UTILS
	*/
	var util = {
		/**
		 * Tests for data type by constructor name
		 * 
		 * @param {Array|String} types
		 * @param {Array|Boolean|Date|Math|Number|String|RegExp|Object|HTMLElement} data
		 */
		type : function(types, data) {
			var match = false;
			var test = function(type) {
				switch(type) {
					case 'Object':
						if (typeof data === 'object' && data.length == undefined && data != null) match = true;
					case 'HTMLElement':
						if (data.tagName) match = true;
					default:
						if (data.constructor && data.constructor.toString().indexOf(type) !== -1) match = true;		
				}
			}
			if (typeof types === 'string') test(types);
			else for (var i = 0; i < types.length && !match; i++) test(types[i]);
			return match;
		}
	};

	/*
	** Raptor.require
	** Module and dependency loading mechanism
	** 
	** Usage Examples:
	** raptor.require('path/to/module', { callback: 'someFunc()' });
	** raptor.require(['path/moduleA', 'path/moduleB'], { callback: 'someFunc()' });
	*/
	var require = function (modules, options) {
		// available options to be passed are listed below
		var options = raptor.augment({
			callback: null,
			loadCount : 0,	// How many modules are we loading in this require
			toLoad : 0	// How many modules have we loaded so far
		}, options);
		
		// modules can be either a string or array
		if(typeof(modules) == "string") {
			_load(modules);
			options.toLoad = 1;
		} else if(modules.length) {
			options.toLoad = modules.length;
			for(var i=0; i<modules.length; i++) {
				_load(modules[i]);
			}
		}
		
		/**
		* Internal module loader
		*
		* @param{String} Module we're loading
		*/
		function _load (mod) {
			if(!config._loadedModules[mod]) {

				var script = document.createElement("script");
				script.src = config._moduleURI + 'raptor.' + mod + ".js";
				script.type = "text/javascript";
				
				document.getElementsByTagName("head")[0].appendChild(script);

				script.onload = script.onreadystatechange = function() {					
					// raptor.config._scriptReady[]
					if(config._scriptReady.indexOf(mod) > -1) {
						return true;
					} else {
						config._scriptReady.push(mod);
						options.loadCount++;
						
						// Once all the modules for this require call are filled run callback
						if(options.loadCount === options.toLoad) {
							if(options.callback) options.callback();
						}
					}
				}
			}
		};	
	};

	/**
	* Raptor.ready
	*/
	var ready = {

		// Hold our ready queue
		_readyQueue : [],

		// Cache whether the DOM is ready
		_isReady : false,

		// Flag to ensure we only attach ready listeners once
		_readyInitialized : false,

		/**
		* Push a callback to the ready queue
		*
		* @param {Function} Callback
		*/
		push : function (cb) {

			if(! ready._readyInitialized) ready.initReady();
						
			if(ready._isReady) {
				cb();
				return;
			} else {
				ready._readyQueue.push(cb);
			}
			
		},

		/**
		* Attach event listeners for ready
		*/
		initReady : function () {

			if(ready._readyInitialized) return;
			
			ready._readyInitialized = true;

			if ( document.readyState === "complete" ) {
				_ready._isReady = true;
				return _ready.ready();
			}
			
			/**
			* Attach event handlers for the ready state of the page
			*/
			if ( document.addEventListener ) {
				document.addEventListener( "DOMContentLoaded", ready.processReady, false );
				window.addEventListener( "load", ready.processReady, false );
			}
			else if( document.attachEvent) {
				window.attachEvent('DOMContentLoaded', ready.processReady);
				window.attachEvent( "onload", ready.processReady);
			}		
			
		},

		/**
		* Our readystate callback
		*/
		processReady : function () {
			// Cleanup functions for the document ready method
			if ( document.addEventListener ) {
				document.removeEventListener( "DOMContentLoaded", ready.processReady, false );
				ready.runQueue();
			} else if ( document.attachEvent ) {
				// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
				if ( document.readyState === "complete" ) {
					document.detachEvent( "onreadystatechange", ready.processReady );
					ready.runQueue();
				}
			}
		},

		/**
		* Go ahead and execute functions that are in the ready queue
		*/
		runQueue : function () {
			var q = ready._readyQueue;
			var _length = q.length;

			if(q === 0) return;
			
			var _thisQ;
			for(var i=0; i<_length; i++) {
				_thisQ = q[i];

				if(typeof _thisQ === 'function') {
					_thisQ();
				}
			}
			
			ready._readyQueue = [];
		}
	};
	
	var _this = {

		// Initialize Raptor
		init : function () {
			/*  Determine where the core file is located, and store the URI prefix
			*/
			var scripts = document.getElementsByTagName("script");
			for(var s=0; s<scripts.length; s++) {				
				if(scripts[s].src.match(/raptor\.js/)) {
					var baseURI = scripts[s].src.replace(/raptor\.js*.+$/, "");					
					s = scripts.length;
				}
			}
			
			config._baseURI = baseURI;
			config._moduleURI = baseURI;			
			_this.extendPrototypes();
		},

		/*
		* We'll use this as a place to extend prototypes up front
		* Replaces deprecated raptor.util file
		*/
		extendPrototypes : function () {
			var indexOf = function (needle) {
				var length = this.length;
		
				for(var i=0; i<length; i++) {
					if(this[i] === needle) return i;
				}
		
				return -1;
			}

			// Let's prototype the indexOf for arrays
			if(typeof Array.indexOf !== 'function') {
				Array.prototype.indexOf = indexOf; 
			}
			
			// Prototype the remove function for Arrays
			if(typeof Array.remove !== 'function') {
	
				/*
				* @param {Int} Index
				*/
				Array.prototype.remove = function(index) {
		
					if(index + 1 > this.length || index < 0) return this;
		
					var left, right;
		
					if(index > 0) left = this.slice(0, index);
					else return this.slice(1, this.length);				
		
					if(index < this.length) right = this.slice(index+1, this.length) 
					else return left;
														
					return left.concat(right);										
		
				}
			}		
		}
		
	};

	var raptor = {
			
		/* Function parameter augmentation
		** Andre Lewis
		** http://earthcode.com/blog/2006/01/optional_args.html
		*/
		augment : function (oSelf, oOther) {
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
	};

	_this.init();

	// Set up base modules before leaving
	ready.push(function () {
		var baseModules = config._baseModules;
		if(baseModules.length > 0) {
			raptor.require(baseModules);
		}
	});
	
	return {

		ready : ready.push,
		require : require,
		util : util,
		
		augment : raptor.augment
	}
	
})();
