(function() {
	
	var _overlays = {};
	
	var _html = {	
		'templates' : {
			'standard' : function () {
			    return raptor.birth('div', {'class' : 'overlay standard-overlay hide'},
				    [
					    raptor.birth('a', {'href' : '#', 'class' : 'close-overlay'}, 'close this miguel!!!???'),
    					raptor.birth('div', {'class' : 'content loading'}, 'loading..')
	    			]
                )
    		}
		}
	};
	
	var _util = {
		
		'toggleObtrusive' : function() {
			
			var body = document.body;
			
			if (!document.getElementById('obtrusive-backdrop')) {
				var backdrop = raptor.birth('div', {'id' : 'obtrusive-backdrop'});
				body.appendChild(backdrop);
			}
			
			if (raptor.has_class('obtrusive', body)) raptor.remove_class('obtrusive', body);
			else raptor.add_class('obtrusive', body);
		},
		
		'buildFrame' : function(overlay) {
			overlay.el = (overlay.template) ? _html.templates[overlay.template]().cloneNode(true) : _html.templates.standard().cloneNode(true);
			overlay.el.setAttribute('id', overlay.id);
			raptor.append(overlay.el, document.body, true);
		}
	}
	
	var Overlay = function(config) {
	    
		this.id = config.id;
		this.type = config.type || 'unobtrusive';
		this.el = document.getElementById(this.id);
		
		// Are we following the mouse around on move
		this.follow = config.follow;
		
		// Offset for positioning
		this.offset = config.offset || { x: 0, y:0 };
		
		this.template = config.template;
				
		// if overlay doens't exist in the document, generate from collection of templates
		if (!this.el) _util.buildFrame(this);
		
		var content = raptor.hunt('.content', this.el);
		this.contentArea = (content[0]) ? content[0] : this.el;
		
		if (config.callback) this.callback = config.callback;
		this.cache = (config.cache == false) ? false : true;
	}
	
	Overlay.prototype = {
		
		'show' : function(e) {
									
			// if element exists and is showing, don't try show/build it again
			if (this.el && !raptor.has_class('hide', this.el)) return false;
			
			// preserve event if there is one
			this.triggerEvent = e || {};
			
			// show backdrop for obtrusive overlays
			if (this.type === 'obtrusive') _util.toggleObtrusive();
			
			raptor.remove_class('hide', this.el);	
			
			// position it dynamically based on content size, or click location for tooltips
			this.position();
			
			// if there is a callback, execute it, so it can populate the overlay or whatever else it wants to do
			if (this.callback) {
				this.callback(this, e);
				
				// finally, if cache is set to true, destroy the callback as it won't be used again
				if (this.cache) this.callback = null;
			}
			
			//if (this.follow) $e.add(window, 'mousemove', this.position);
		},
		
		'hide' : function() {
			raptor.add_class('hide', this.el);
			if (this.type === 'obtrusive') _util.toggleObtrusive();
			
			//if (this.follow) $e.remove(document.body, 'mousemove', this.position);
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
					style.left = (event.x + this.offset.x) + 'px';
					style.top = (event.y + this.offset.y) + 'px';
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
			
			var showing = 1;
			for (var o in _overlays) {
				var overlay = _overlays[o].el;
				if (!raptor.has_class('hide', overlay)) {
					var z = overlay.style.zIndex;
					if (z >= showing) showing = ++z;
				}
			}
			style['z-index'] = showing;
			
			raptor.set_style(style, el);
		}
	}
	
	var init = function() {
		raptor.lash('.close-overlay', 'click', function(e) {
			e.preventDefault();
			var overlayID = e.target.parentNode.getAttribute('id');
			_overlays[overlayID].hide();
		});
	}
	
	var api = {
		init : function(config) {
			return _overlays[config.id] = new Overlay(config);
		},
		
		/**
		* Provides a public method for adding templates to the canopy
		* templates collection for later use
		*
		* @param {String} Template Name
		* @param {HTMLElement} Element which makes up the template
		*/
		add_template : function (name, el) {
            _html.templates[name] = el;
		},
		
		overlays : _overlays
	}
	
	if (raptor) {
		raptor.extend(api);
		raptor.ready(init);
	}
})();