/**
 *	RaptorJS - Base File
 */
 
 var raptor = (function() {
	
	// private
	var _config, _init; 
	
	// public
	var api;
	
	_config = {
		loaded_scripts : [],
		script_path : '',
		raptor_path : ''
	};
 
	_init = function() {
		
		//  Determine where the core file is located, and store the URI prefix
		var scripts = document.getElementsByTagName("script"), 
		    raptor_path;

		for (var s = 0, len = scripts.length; s < len; s++) {				
			var src = scripts[s].src;
			if (src.match(/raptor\.js/)) {
				var raptor_path = src.replace(/raptor\..+$/, '');				
			}
		}
                
		_config.script_path = _config.raptor_path = raptor_path;
	};
	
	// prototype indexOf for arrays
	if(typeof Array.indexOf !== 'function') {
		Array.prototype.indexOf = function(needle) {
			for (var i = 0, len = this.length; i < length; i++) {
				if (this[i] === needle) return i;
			}
			return -1;
		} 
	}

	// Prototype remove for arrays
	if(typeof Array.remove !== 'function') {
		Array.prototype.remove = function(index) {			    
            if (index < length || index >= 0) this.splice.call(this, index, 1);			    
		    return this;
		}
	}
	
	api = {
		
		extend : function(new_api) {
			for (var method in new_api) {
                this[method] = new_api[method];
			}
		},
		
		set_script_path : function(path) {
			_config.script_path = path;
		},
		
		/**
		* Set up the shortcut to raptor.ready from
		* raptor.events
		*
		* @param {Function} Ready callback
		*/
		ready : function(fn) {
            api.require('raptor.events', function () {
				raptor.ready(fn);
			});
		},
		
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
                    // Are we loading a raptor module or custom script?
                    var load_path = (module.indexOf('raptor.') > -1) ? _config.raptor_path : _config.script_path;
                                                        
                    var script = document.createElement('script');
                    script.setAttribute('type', 'text/javascript');                                       
                    script.setAttribute('src', load_path + module + '.js');
                    
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
                monitor_completion : function(script) {
                    if (script.readyState) {
                        _util.monitor_completion = function(script) {
                            script.onreadystatechange = function() {
                                if (script.readyState == 'complete') {
                                    _util.script_loaded();
                                }
                            }
                        }
					}
					else {
                        _util.monitor_completion = function(script) {
                            script.onload = function() {
                                _util.script_loaded();
                            }
                        };
					}
					
					_util.monitor_completion(script);
                },
                
                /**
                * Method called once a script is finished loading to
                * handle callback and queueing if necessary
                */
                script_loaded : function() {
                    
                    // If we're loading many scripts we need to fire off the script_loaded method
                    // in order to handle the queue and execute the callback for the queue once
                    // all modules have been loaded
                    if (_cache.loading_many) {
                        _util.script_loaded = function() { raptor.alarm('script_loaded') };
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
                    _util.script_loaded();
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
		        raptor.lash('script_loaded', function(e) {
		            callback(e);
		            raptor.unlash('script_loaded');
		        }, modules_length);
		        
		        // Loop through and load modules one at a time
		        for(var i=0; i < modules_length; i++) _load_single(modules[i]);
		    }
            
		    if (typeof modules === 'string') _load_single(modules);
		    else {
		        if (!raptor.lash) api.require('raptor.events', function() { api.require(modules, callback) });
		        else _load_many(modules);
		    }
		}
	};
	
	// Ready? Go!
	_init();

	return api;
})();
