/**
 * 
 */

raptor.canopy = (function() {
	
	var _overlays = {};
	var _html = {
		'templates' : {
			'standard' : raptor.pack.birth('div', {'class' : 'hide'}, raptor.pack.birth('a', {'href' : '#', 'class' : 'close-overlay'}))
		}
	};
	
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
			if (this.type === 'obtrusive') this.toggleObtrusive();
			
			this.setPosition(e);
			raptor.pack.removeClass('hide', this.el);
		},
		'hide' : function() {
			
			raptor.pack.addClass('hide', this.el);
			if (this.obtrusive) this.toggleObtrusive();
			
			if (!this.cache) {
				this.prepared = false;
			}
		},
		'buildFrame' : function() {
			this.el = (this.template) ? _html.templates[this.template].cloneNode(true) : _html.templates.standard.cloneNode(true);
			raptor.pack.append(this.el, document.body);
		},
		'setPosition' : function(e) {
			if (this.type === 'tooltip') {
				
			}
			else {
				
			}
		},
		'toggleObtrusive' : function() {
			var body = document.body;
			body.appendChild(raptor.pack.birth('div', {'id' : 'obtrusive-backdrop'}));
			return function() {
				console.log(raptor.pack.hasClass('obtrusive', body))
				if (!raptor.pack.hasClass('obtrusive', body)) raptor.pack.addClass('obtrusive', body);
				else raptor.pack.removeClass('obtrusive', body);
			}();
		}
	}
	
	return {
		init : function(config) {
			return _overlays[config.id] = new Overlay(config);
		}
	}
})();
