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
	};
 
	_init = function() {
		
		//  Determine where the core file is located, and store the URI prefix
		var scripts = document.getElementsByTagName("script");
		for(var s=0; s<scripts.length; s++) {				
			if(scripts[s].src.match(/raptor\.js/)) {
				var baseURI = scripts[s].src.replace(/RaptorJS.+$/, "");	
				s = scripts.length;
			}
		}
		
		_config.baseURI = baseURI;
		_config.moduleURI = baseURI;			
		
		_extendPrototypes();	
	};
	
	_extendPrototypes = function() {
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
	};
 
	api = {
		
				
		/**
		* Set up the shortcut to raptor.ready from
		* raptor.events
		*
		* @param {Function} Ready callback
		*/
		ready : function(fn) {						
						
			if (raptor.events) {
				api.ready = raptor.events.ready;
				api.ready(fn);
			}
			// If events wasn't loaded yet, we'll go ahead and load it now
			else {				
				api.require('RaptorJS/src/raptor.events', function () {					
					api.ready = raptor.events.ready;
					api.ready(fn);
				});
			}
		},
		
		/**
		* Various utility functions
		*/
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
			},
			
			profiler : {
				
				objects : [],
				
				active : false,
				
				add : function(obj) {
					var profiled_object = api.util.profiler._create_instance(obj);
					api.util.profiler.objects.push(profiled_object);
					return profiled_object;
				},
				
				start : function() {
					if (!api.util.profiler.active) {
						console.log('start timing');
						api.util.profiler.active = true;
						console.profile();
					}
				},
				
				stop : function() {
					if (api.util.profiler.active) {
						console.log('stop timing');
						api.util.profiler.active = false;
						console.profileEnd();
					}
				},
				
				_create_instance : function(obj) {
				
					var new_class = function() {};
					var new_object = new new_class();
					
					var create_method = function(_this, method, name) {
						return function() {
							console.log('profiling ' + name);
							api.util.profiler.start();
							var result = method.apply(_this, arguments);
							api.util.profiler.stop();
							return result;
						}
					}
					
					for (var key in obj) {
						var prop = obj[key];
						if (typeof prop === 'function') new_class.prototype[key] = create_method(new_object, prop, key);
						else new_object[key] = prop;
					}
					
					return new_object;
				}
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
			function load (mod) {
				if (!_config.loadedModules[mod]) {

					var script = document.createElement("script");
					script.src = _config.moduleURI + mod + ".js";
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
								if (callback) {					
									
									// Ensure all modules in this require were loaded otherwise wait for them
									var verifyLoad = function () {																			
										var isLoaded = true;
										var _thisModule;
										
										if (typeof modules === 'string') modules = [modules];
										
										for (var i = 0; i < modules.length && isLoaded; i++) {
											
											_thisModule = modules[i];											
																							
											if (typeof raptor[_thisModule] === 'undefined') {
												isLoaded = false;				
												//setTimeout(verifyLoad, 500);
											}
										}	
										isLoaded = true;
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
		}
	};
	
	// Ready? Go!
	_init();
	
	return api;
	
 })();
