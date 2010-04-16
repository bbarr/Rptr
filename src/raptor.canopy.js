/**
 * 
 */

raptor.canopy = (function() {
	
	var _config = {};
	var _html = {};
	var $ = raptor.pack;
	
	var _showBackdrop = function() {
		
		_frame.backdrop = $.birth('div', {'id' : 'overlay-backdrop'});
		document.body.appendChild(_frame.backdrop);
		
		return function() {
			$.removeClass(_frame.backdrop, 'hide');
		}
	}
	
	var _hideBackdrop = function() {
		$.addClass(_frame.backdrop, 'hide');
	}
	
	var _setPosition = function(x, y) {
		if (x) _html.x = x;
		else {
			// waht the hell am i doing?!
		}
	}
	
	return {
		'init' : function(config) {
			
			_config = config;
			
			if (_config.tooltip) {
				
			}
		},
		'show' : function() {
			
			if (_config.obtrusive) _showBackdrop();
			
		},
		'hide' : function() {
			
			if (_config.obtrusive) _hideBackdrop();
		}
	}
});
