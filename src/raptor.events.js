/**
 * RAPTOR EVENTS - 'cause raptors do stuff
 * 
 * Supports custom events.
 * 
 * Example:
 *   
 *   - Subscriber - 
 *   raptor.events.add(module, 'paperlessAccepted', function(data) {
 *     // do stuff with the data object
 *   });
 *   
 *   - Publisher -
 *   // fires on all paperlessAccepted bound targets
 *   raptor.events.fire('paperlessAccepted');
 *   
 *   OR
 *   
 *   // fires on all paperlessAccepted bound targets with additional data
 *   raptor.events.fire({
 *     type : 'paperlessAccepted',
 *     foo : 'some data'
 *   });
 *   
 *   OR
 *   
 *   // fires only on target
 *   raptor.events.fire({
 *     type : 'paperlessAccepted',
 *     target : module,
 *     // for multiple targets
 *     // targets : [module, div]
 *   });
 * 
 */

raptor.events = (function() {
	
	var _events = {};
	var _targets = [];
	
	var _registerEvent = function(target, type, cb) {
		
		var targetId = _targets.indexOf(target);
		
		if (targetId < 0) {
			targetId = _targets.push(target) - 1
			_events[targetId] = {};
		}

		(_events[targetId][type]) ? _events[targetId][type].push(cb) : _events[targetId][type] = [cb] ;
	}
	
	var _unregisterEvent = function(target, type, cb) {
		
		var targetId = _targets.indexOf(target);
		
		if (cb) {
			_events[targetId][type].splice(_events[targetId][type].indexOf(cb), 1);
		}
		else if (type) {
			_events[targetId][type] = null;
		}
		else if (target) {
			_targets.splice(_targets.indexOf(target), 1);
			_events[targetId] = null;
		}
	}
	
	return {
		
		/**
		 * Binds an event/callback to a specific target.
		 * 
		 * @param {HTMLElement|Object|Array|Function} target
		 * @param {String} type
		 * @param {Function} cb
		 */
		'add' : function(target, type, cb) {
			type = 'on' + type;
			_registerEvent(target, type, cb);
			target[type] = this.fire;
		},
		
		/**
		 * Removes by callback or event or target
		 * 
		 * @param {Object} target
		 * @param {Object} type
		 * @param {Object} cb
		 */
		'remove' : function(target, type, cb) {
			if (type) type = 'on' + type;
			_unregisterEvent(target, type || null, cb || null);
		},
		
		/**
		 * Fires event(s)
		 * 
		 * Event param gets passed to all subscriber callbacks
		 * 
		 * @param {Object} event
		 */
		'fire' : function(event) {

			// event will either be served by the browser, or manually. window.event for IE.
			event = event || window.event;
			var type = (raptor.util.type('String', event)) ? 'on' + event : 'on' + event.type;
			
			// gather target(s) into an array
			var targets = [];
			if (event.targets || event.target) {
				targets = (event.targets) ? event.targets : [event.target];	
			}
			
			for (var i = 0; i < targets.length; i++) {
				var targetId = _targets.indexOf(targets[i]);
				
				if (targetId >= 0) {
					var events = _events[targetId][type];
					for (var x = 0; x < events.length; x++) events[x](event);	
				}
			}
		},
		
		'cleanse' : function() {
			for (var targetId in _events) {
				var target = _targets[targetId] || [];
				if (raptor.util.type('HTMLElement', target)) {
					var elements = document.getElementsByTagName(target.tagName);
					var match = false;
					for (var i = 0; i < elements.length; i++) {
						if (elements[i]) match = true;
					}
					if (!match) _unregisterEvent(target);
				}
			}
		}
	}
})();