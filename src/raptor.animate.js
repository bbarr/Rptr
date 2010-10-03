(function() {
	
	// private
	var _util;
		
	// public
	var api;
	
	_util = {
		
		/**
		* Reuseable animation function for animatin
		* CSS properties
		*
		* @param {HTMLElement} Element to animate
		* @param {String} Property to animate
		* @param {Integer} Start Value
		* @param {Integer} End Value
		* @param {Integer} Rate to change value
		* @param {Integer} Speed to animate
		* @param {Boolean} Pixel based animation?
		*/
		animate : function (el, prop, start, end, each, speed, pixel) {
			
			// Setup increment and completion checking methods up front
			var _increment, _complete;
			
			if (start < end) {
				_increment = function () { return start + each; };
				_complete = function () { return start <= end; };
			}
			else {
				_increment = function () { return start - each; };
				_complete = function () { return start >= end; };
			}
			
			var _animate = function () {
				start = _increment();
				
				if ( _complete() ) {
					el.style[prop] = (pixel) ? start + 'px' : start;
				}
				else {
					el.style[prop] = (pixel) ? end + 'px' : end;
					clearInterval(_interval);
				}
				
			};
			
			var _interval = setInterval(_animate, speed);
		}
		
	};
	
	api = {
		
		resize : function(el, prop, start, end, each, speed) {
			
			each = each || 10;
			speed = speed || 10;
			
			var _increment;
			
			if (start < end) {
				_increment = function() {
					start = start + each;
					if (start <= end) {
						el.style[prop] = start + 'px';
					}
					else {
						el.style[prop] = end + 'px';
						clearInterval(interval);
					}
				}
			}
			else {
				_increment = function() {
					start = start - each;
					if (start >= end) {
						el.style[prop] = start + 'px';
					}
					else {
						el.style[prop] = end + 'px';
						clearInterval(interval);
					}
				}
			}
			
			var interval = setInterval(_increment, speed);
		},
		
		fade : function(el, start, end, each, speed) {
		  
			each = each || .05;
			speed = speed || 10;
			
			if (start < end) {
				_increment = function() {
					start = start + each;
					if (start <= end) {
						el.style.opacity = start;
					}
					else {
						el.style.opacity = end;
						clearInterval(interval);
					}
				}
			}
			else {
				_increment = function() {
					start = start - each;
					if (start >= end) {
						el.style.opacity = start;
					}
					else {
						el.style.opacity = end;
						clearInterval(interval);
					}
				}
			}
			
			var interval = setInterval(_increment, speed);
		},
		
		/**
		* Slide animation
		* @param {HTMLElement} The element to slide
		* @param {Integer} The starting position
		* @param {Integer} End position for slide
		* @param {Integer} Rate of change
		* @param {Integer} Speed to execute at
		* @param {String} Direction for animation (CSS property) (top, right, bottom, left)
		*/
		slide : function (el, start, end, each, speed, prop) {
			
			each = each || 0.10;
			speed = speed || 10;
			prop = prop || 'left'
			
			_util.animate(el, prop, start, end, each, speed, true);
		}
		
	}
	
	if (raptor) raptor.extend(api);
})();