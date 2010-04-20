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
	var _targets = {};
	var _guid = 0;
	
	/**
	 * Registers event
	 * 
	 * @param {HTMLElement|Object|Array|Function} target
	 * @param {String} type
	 * @param {Function} cb
	 */
	var _registerEvent = function(target, type, cb) {
		
		var targetId =_getTargetId(target);
		
		if (targetId < 0) {
			targetId = _guid++;
			_targets[targetId] = target;
			_events[targetId] = {};
		}
		
		(_events[targetId][type]) ? _events[targetId][type].push(cb) : _events[targetId][type] = [cb] ;
	}
	
	/**
	 * Unregisters targets, or target->type, or target->type->callback
	 * 
	 * @param {HTMLElement|Object|Array|Function} target
	 * @param {String} type
	 * @param {Function} cb
	 */
	var _unregisterEvent = function(target, type, cb) {
		
		var targetId = _getTargetId(target);
		
		if (cb) {
			_events[targetId][type].splice(_events[targetId][type].indexOf(cb), 1);
		}
		else if (type) {
			delete _events[targetId][type];
		}
		else if (target) {
			delete _targets[targetId];
			for (var i in _events) if (i == targetId) delete _events[i];
		}
	}
	
	/**
	 * Retreives the unique ID for a target
	 * 
	 * @param {HTMLElement|Object|Array|Function} target
	 */
	var _getTargetId = function(target) {
		for (var i in _targets) {
			if (_targets[i] == target) return i;
		}
		return -1;
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
			
			if (arguments.length == 2) {				
				cb = arguments[1];
				type = arguments[0];
				target = '*';
			}
			
			type = 'on' + type;
			_registerEvent(target, type, cb);
			target[type] = this.fire;
		},
		
		/**
		 * Removes by callback or event or target
		 * 
		 * @param {HTMLElement|Object|Array|Function} target
		 * @param {String} type
		 * @param {Function} cb
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
			if (event.targets || event.target) targets = (event.targets) ? event.targets : [event.target];	
			else for (var target in _targets) targets.push(_targets[target]);
			
			for (var i = 0; i < targets.length; i++) {
				var targetId = _getTargetId(targets[i]);
				
				if (targetId >= 0) {
					var events = _events[targetId][type];
					console.log(_events[targetId])
					if (events) for (var x = 0; x < events.length; x++) events[x](event);	
				}
			}
		},
		
		/**
		 * Cleans up event registry by detecting and removing
		 * events for missing HTMLElements
		 */
		'cleanse' : function() {
			for (var targetId in _events) {
				var target = _targets[targetId];
				if (raptor.util.type('HTMLElement', target)) {
					var elements = document.getElementsByTagName(target.tagName);
					if (elements.indexOf(target) < 0) _unregisterEvent(target);
				}
			}
		}
	}
})();