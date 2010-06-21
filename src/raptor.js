/**
 *	RaptorJS - Base File
 */
 
 var raptor = (function() {
	
	// private
	var _config, _init, _extendPrototypes; 
	
	// public
	var api;
	
	_config = {
		baseURI: '', // raptor assumes modules are located within the base directory unless otherwise specified via raptor.setModulePath();
		moduleURI: '',
		loadedModules: [],
		scriptReady: [], // temp fix for opera using both onload and onreadystatechange
		baseModules: [] // Array of modules loaded as part of raptor's core
	}
 
	_init = function() {
		
		//  Determine where the core file is located, and store the URI prefix
		var scripts = document.getElementsByTagName("script");
		for(var s=0; s<scripts.length; s++) {				
			if(scripts[s].src.match(/raptor\.js/)) {
				var baseURI = scripts[s].src.replace(/raptor\.js*.+$/, "");					
				s = scripts.length;
			}
		}
		
		_config.baseURI = baseURI;
		_config.moduleURI = baseURI;			
		
		_extendPrototypes();	
	}
	
	_extendPrototypes = function() {
	
	}
 
	api = {
		
		ready : function(fun) {
			if (!raptor.events) {
				raptor.require('events', {callback : function () {
					api.ready = raptor.events.ready;
					api.ready(fun);
				}});
			}
		},
		
		util : {
			
			/**
			 * Tests for data type by constructor name
			 * 
			 * @param {Array|String} types
			 * @param {*} data
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
		},
		
		/**
		 * Module and dependency loading mechanism
		 * 
		 * Usage Examples:
		 * raptor.require('path/to/module', { callback: someFunction });
		 * raptor.require(['path/moduleA', 'path/moduleB'], { callback: someFunction });
		 *
		 * @param {Array|String} modules
		 * @param {Function} callback
		 */
		require : function (modules, callback) {
			
			var toLoad = 0;
			var loadCount = 0;
			
			// modules can be either a string or array
			if (typeof modules === 'string') {
				toLoad = 1;
				load(modules);
			} 
			else if (modules.length) {
				toLoad = modules.length;
				for (var i = 0; i < toLoad; i++) load(modules[i]);
			}
			
			/**
			* Internal module loader
			*
			* @param {String} Module we're loading
			*/
			var load = function(mod) {
				if (!_config.loadedModules[mod]) {

					var script = document.createElement("script");
					script.src = config._moduleURI + 'raptor.' + mod + ".js";
					script.type = "text/javascript";
					
					document.getElementsByTagName("head")[0].appendChild(script);

					script.onload = script.onreadystatechange = function() {					
						
						// raptor.config._scriptReady[]
						if (_config.scriptReady.indexOf(mod) > -1) return true;
						else {
							_config.scriptReady.push(mod);
							loadCount++;												
							
							// Once all the modules for this require call are filled run callback
							if(loadCount === toLoad) {														
								
								if (options.callback) {								
									
									// Ensure all modules in this require were loaded otherwise wait for them
									var verifyLoad = function () {									
										
										var isLoaded = true;
										var _thisModule;
										
										for (var i = 0; i < modules.length && isLoaded; i++) {
											
											_thisModule = modules[i];
																							
											if (typeof raptor[_thisModule] === 'undefined') {
												isLoaded = false;				
												setTimeout(verifyLoad, 500);
											}
										}	
										
										// Run the callback if everything is loaded
										if (isLoaded) callback();
									};
									
									verifyLoad();																									
								}
							}
						}
					}
				}
			};	
		},
		
		/**
		* 
		*/
		ready : {

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
		}
	}
 
	return api;
 })();