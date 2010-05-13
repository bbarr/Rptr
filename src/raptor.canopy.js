/**
 * 
 */

raptor.canopy = (function() {
	
	var _overlays = {};
	
	var overlay = function(config) {
		
		this.defaults = {}
		this.config = raptor.util.extend(this.defaults, config);
		
		this.hasNeeds = (this.preCall) ? true : false;
	}
	
	overlay.prototype = {
		'show' : function() {
			
			if (this.hasNeeds) this.preCall();
			if (this.obtrusive) this.disablePage();
			
			this.setPosition();
		}
	}
	
	return {
		init : function(config) {
			
			return _overlays[config.name] = new Overlay(config);
		}
	}
});
