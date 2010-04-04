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
				_baseModules: []
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
			for(var i=0; i<modules.length; i++) {
				_load(modules[i]);
			}
		}
		
		function _load(mod) {
			if(!raptor.config._loadedModules[mod]) {
				
				var script = document.createElement("script");
				script.src = raptor.config._moduleURI + mod.replace(/\./, "/") + ".js";
				script.type = "text/javascript";
				document.getElementsByTagName("head")[0].appendChild(script);
				
				script.onload = script.onreadystatechange = function() {
					// raptor.config._scriptReady[]
					if(raptor.config._scriptReady.indexOf(mod) > -1) {
						return true;
					} else {
						raptor.config._scriptReady.push(mod);
					}
				}
			}
		}
	}
	
})();