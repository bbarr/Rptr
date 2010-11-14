(function() {
	
	// private
	var _util, _animation_stack;
		
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
		* @param {String} Interval name for this animation
		*/
		animate : function (el, prop, start, end, each, speed, pixel, interval) {
			
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
			
			// Get a unique id for this aniamtion
			_animation_stack._auid++;
			
			var _id = _animation_stack._auid;
			
			var _animate = function () {
				start = _increment();
				
				if ( _complete() ) {
					el.style[prop] = (pixel) ? start + 'px' : start;
				}
				else {
					el.style[prop] = (pixel) ? end + 'px' : end;
					api.dequeue_animation(interval, _id);
				}
				
			};
			
			api.queue_animation(interval, speed, _animate, _id);
		}
		
	};
	
	/**
	* Internal animation stack to efficiently make use of timeouts on a page
	*/
	_animation_stack = {
		
		// Internal animation unique identifiers
		_auid : 0,
		
		// Collection of intervals to work with on the stack
		intervals : {},
		
		// Collection of interval callbacks to execute on interval iteration
		interval_callbacks : {},
		
		/**
		* Attempts to create an interval with the name provided in the collection
		* if one does not already exist
		* 
		* @param {String} The name of the interval
		* @param {Integer} Time delay for interval
		*/
		create_interval : function (name, interval) {
			if (this.intervals[name]) return;
			
			this.intervals[name] = setInterval(function () {
				var queue = _animation_stack.interval_callbacks[name];
				if (queue && !raptor.obj_empty(queue)) {
					for (var fn in queue) queue[fn].call();
				}
				else {
					clearInterval(_animation_stack.intervals[name]);
					delete _animation_stack.intervals[name];
				}
				
			}, interval);
		},
		
		/**
		* Pushes a function to the queue for a specified named interval
		*
		* @param {String} Interval to work with
		* @param {Function} The callback to add to the queue
		* @param {String} Identifier for the function in the queue
		*/
		push_to_queue : function (interval, fn, id) {
			if (!this.interval_callbacks[interval]) this.interval_callbacks[interval] = {};
			this.interval_callbacks[interval][id] = fn;
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
		* @param {String} Specify an interval to use for this aniamtion, otherwise, raptor will group similar speeds
		*/
		slide : function (el, start, end, each, speed, prop, interval) {
			
			each = each || 0.10;
			speed = speed || 10;
			prop = prop || 'left'
			interval = interval || speed;
			
			_util.animate(el, prop, start, end, each, speed, true, interval);
		},
				
		/**
		* Add a callback to an interval for animation purposes
		* Allows user to define a named interval to manually group together
		* intervals as desired into a single stack.
		*
		* A user's callback is responsible for removing itself from the queue
		*
		* @param {String} Interval name
		* @param {Integer} Time delay for interval
		* @param {Function} Function to add to the queue
		* @param {String} Identifier for the callback in the queue
		*/ 
		queue_animation : function (interval, delay, fn, id) {
			_animation_stack.push_to_queue(interval, fn, id);
			_animation_stack.create_interval(interval, delay);
		},
		
		/**
		* Removes a method from specified interval's queue
		*
		* @param {String} Interval name
		* @param {String|Integer} Id of method to remove
		*/
		dequeue_animation : function (interval, id) {
			delete _animation_stack.interval_callbacks[interval][id];
		}
	}
	
	if (raptor) raptor.extend(api);
})();