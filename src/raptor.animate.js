raptor.animate = (function() {
	
	var api;
	
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
		}
		
	}
	
	return api;
})();