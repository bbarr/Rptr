raptor.canopy = (function() {
	
	var _overlays = {};
	
	var _html = {
		'templates' : {
			'standard' : raptor.pack.birth('div', {'class' : 'overlay standard-overlay hide'}, 
				[
					raptor.pack.birth('a', {'href' : '#', 'class' : 'close-overlay'}, 'close'),
					raptor.pack.birth('div', {'class' : 'content loading'}, 'loading..')
				]
			)
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
			overlay.el.setAttribute('id', overlay.id);
			
			raptor.pack.append(overlay.el, document.body, true);
		}
	}
	
	var Overlay = function(config) {
		this.id = config.id;
		this.type = config.type || 'unobtrusive';
		this.el = document.getElementById(this.id);
		
		// if overlay doens't exist in the document, generate from collection of templates
		if (!this.el) _util.buildFrame(this);

		if (config.callback) this.callback = config.callback;
		this.cache = config.cache || true;
	}
	
	Overlay.prototype = {
		
		'show' : function(e) {
			
			// if element exists and is showing, don't try show/build it again
			if (this.el && !raptor.pack.hasClass('hide', this.el)) return false;
			
			// preserve event if there is one
			this.triggerEvent = e || {};
			
			// show backdrop for obtrusive overlays
			if (this.type === 'obtrusive') _util.toggleObtrusive();
			
			raptor.pack.removeClass('hide', this.el);
			
			
			// position it dynamically based on content size, or click location for tooltips
			this.position();
			
			// if there is a callback, execute it, so it can populate the overlay or whatever else it wants to do
			if (this.callback) {
				this.callback(this);
				
				// finally, if cache is set to true, destroy the callback as it won't be used again
				if (this.cache) this.callback = null; 
			}
		},
		
		'hide' : function() {
			raptor.pack.addClass('hide', this.el);
			if (this.type === 'obtrusive') _util.toggleObtrusive();
		},
		
		'position' : function() {
			
			var el = this.el;
			var event = this.triggerEvent;
			var style = {};
			var width = el.scrollWidth;
			var height = el.scrollHeight;
			var clientHeight = document.documentElement.clientHeight;
			var clientWidth = document.documentElement.clientWidth;

			if (this.type === 'tooltip') {
				if (event.x && event.y) {
					style.left = event.x + 'px';
					style.top = event.y + 'px';
				}
			}
			else {
				style.left = '50%';
				style['margin-left'] = '-' + Math.floor(width / 2) + 'px';
				
				if (clientHeight > height) {
					style.top = ((clientHeight - height) / 2) + 'px';
				}
				else {
					style.top = '0px';
				}
			}

			raptor.pack.setStyle(style, el);
		}
	}
	
	var init = function() {
		raptor.events.add('.close-overlay', 'click', function(e) {
			e.preventDefault();
			var overlayID = e.target.parentNode.getAttribute('id');
			_overlays[overlayID].hide();
		});
	}
	
	raptor.ready(init);
	
	return {
		init : function(config) {
			return _overlays[config.id] = new Overlay(config);
		},
		overlays : _overlays
	}
})();