/**
 * 
 */

raptor.canopy = (function() {
	
	var _overlays = {};
	
	var _html = {
		'templates' : {
			'standard' : raptor.pack.birth('div', {'class' : 'overlay standard-overlay hide'}, raptor.pack.birth('a', {'href' : '#', 'class' : 'close-overlay'}))
		}
	};
	
	var _util = {
		
		'toggleObtrusive' : function() {
			
			var body = document.body;
			
			if (!document.getElementById('obtrusive-backdrop')) {
				var backdrop = raptor.pack.birth('div', {'id' : 'obtrusive-backdrop'});
				body.appendChild(backdrop);
			}
			
			if (raptor.pack.hasClass('obtrusive', body)) raptor.pack.removeClass('obtrusive', body);
			else raptor.pack.addClass('obtrusive', body);
		},
		
		'buildFrame' : function(overlay) {
			overlay.el = (overlay.template) ? _html.templates[overlay.template].cloneNode(true) : _html.templates.standard.cloneNode(true);
			raptor.pack.append(overlay.el, document.body);
		},
	}
	
	var Overlay = function(config) {
		this.type = config.type || 'unobtrusive';
		this.el = document.getElementById(config.id);
		this.prepared = (this.preCall) ? false : true;
		this.cache = config.cache || true;
	}
	
	Overlay.prototype = {
		'show' : function(e) {
			e = e || {};
			
			if (!this.el) this.buildFrame();
			if (!this.prepared) this.preCall(this);
			if (this.type === 'obtrusive') _util.toggleObtrusive();
			
			this.setPosition(e);
			raptor.pack.removeClass('hide', this.el);
		},
		'hide' : function() {
		
			raptor.pack.addClass('hide', this.el);
			
			if (this.type === 'obtrusive') this.toggleObtrusive();
			
			if (!this.cache) {
				this.prepared = false;
			}
		},
		'setPosition' : function(e) {
			if (this.type === 'tooltip') {
				
			}
			else {
				
			}
		}
	}
	
	return {
		init : function(config) {
			return _overlays[config.id] = new Overlay(config);
		},
		overlays : _overlays
	}
})();
