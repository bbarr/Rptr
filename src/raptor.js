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
		loaded_scripts: [],
		scriptReady: [], // temp fix for opera using both onload and onreadystatechange
		baseModules: [] // Array of modules loaded as part of raptor's core
	};
 
	_init = function() {
		
		//  Determine where the core file is located, and store the URI prefix
		var scripts = document.getElementsByTagName("script");
		for(var s=0; s<scripts.length; s++) {				
			if(scripts[s].src.match(/raptor\.js/)) {
				var script_path = scripts[s].src.replace(/RaptorJS.+$/, "");	
				s = scripts.length;
			}
		}
		
		_config.script_path = script_path;			
		
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
				
				_start : function() {
					if (!api.util.profiler.active) {
						api.util.profiler.active = true;
						console.profile();
					}
				},
				
				_stop : function() {
					if (api.util.profiler.active) {
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
							api.util.profiler._start();
							var result = method.apply(_this, arguments);
							api.util.profiler._stop();
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
		* Dynamic JavaScript loader
		* 
		* @dependency raptor.events.js
		*
		* @param {Array|String} Scripts to load
		* @param {Function} Callback to execute after loading modules
		*/
		
		require : function(modules, callback) {
	
		    var _cache = {};
		    
            var _util = {
                
                /**
                * Create a new script tag for this module
                *
                * @param {String} Module Path
                */
                create_script : function(module) {
                
                    var script = document.createElement('script');
                    script.setAttribute('type', 'text/javascript');                                       
                    script.setAttribute('src', _config.script_path + module + '.js');                    
                    
                    _config.loaded_scripts.push(module);

                    return script;
                },
                
                /**
                * Monitor load completion of a script
                * attaches either an onreadystatechange or onload method
                * to the script depending on browser support
                *
                * Once a script is loaded the script_loaded method will
                * be called
                *
                * @param {HTMLElement} Script we're loading onto the page
                */
                monitor_completion : function() {
                    return (document.createElement('script').readyState)
                    ? 
                        function(script) {
                            script.onreadystatechange = function() {
                                if (script.readyState == 'complete') {
                                    _util.script_loaded();
                                }
                            }
                        }
                    : 
                        function(script) {
                            script.onload = function() {
                                _util.script_loaded();
                            }
                        };
                }(),
                
                /**
                * Method called once a script is finished loading to
                * handle callback and queueing if necessary
                */
                script_loaded : function() {
                    
                    // If we're loading many scripts we need to fire off the script_loaded method
                    // in order to handle the queue and execute the callback for the queue once
                    // all modules have been loaded
                    if (_cache.loading_many) {
                        _util.script_loaded = function() { raptor.events.fire('script_loaded') };
                        _util.script_loaded();
                    }
                    // Otherwise just run the callback now that the single script is ready
                    else callback();
                }
                
            };

            /**
            * Load in a single module
            *
            * @param {String} Module Path
            */
		    var _load_single = function(module) {
		    
		        // Check and ensure that a module was not already loaded before
		        // if it was, make sure to run the script_loaded event
		        // to properly continue the queue progress and leave
		        if (_config.loaded_scripts.indexOf(module) > -1) {
                    raptor.events.fire('script_loaded');
		            return;
		        }                
                
                // Create the script for this module
		        var script = _util.create_script(module);
		        
		        // Setup the load monitoring method and append the script to the page
                _util.monitor_completion(script);
                
				var head = _cache.head;
				if (!head) head = _cache.head = document.getElementsByTagName('head')[0];
                head.appendChild(script);
		    }
            
            /**
            * Handle loading many modules at once, creating a 
            * queue to run through and load each one individually
            * executing the callback once ALL modules are ready
            *
            * @param {Array} Modules to load
            */
		    var _load_many = function(modules) {
                
		        var loading_many = _cache.loading_many = true;
		        var modules_length = modules.length;
		        
		        // Event to fire the callback once we're sure all
		        // modules in the array have been loaded
		        raptor.events.add('script_loaded', function(e) {
		            callback(e);
		            raptor.events.remove('script_loaded');
		        }, modules_length);
		        
		        // Loop through and load modules one at a time
		        for(var i=0; i < modules_length; i++) _load_single(modules[i]);
		    }
		    
		    if (typeof modules === 'string') _load_single(modules);
		    else {
		        if (!raptor.events) api.require('RaptorJS/src/raptor.events', function() { api.require(modules, callback) });
		        else _load_many(modules);
		    }
		}
	};
	
	// Ready? Go!
	_init();
	
	return api;
	
})();

if (typeof $ === 'undefined') {
	$ = raptor;
	$u = raptor.util;
}