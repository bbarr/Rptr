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
			
			type = 'on' + type;
			var _this = this;
			
			var register = function(target, type, cb) {
				_registerEvent(target, type, cb);
				target[type] = _this.fire;
			}
			
			// if (typeOfEvent, callback);
			if (raptor.util.type('String', target)) register('*', target, type);
			
			// if (arrayOfTargets, type, callback);
			else if (raptor.util.type('Array', target)) for (var i = 0; i < targets.length; i++) register(targets[i], type, cb);
			
			// if (target, type, callback)
			else register(target, type, cb);
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

			if (event.targets) var targets = event.targets;
			else {
				var target = event.target || event.srcElement || '*';
				if (target.nodeType === 3) target = target.parentNode;
			}
			
			if (!event.target && !event.srcElement) {
				if (target) event.target = target;
				else event.targets = targets;
			}
			
			var handleTarget = function(target) {
				var targetId = _getTargetId(target);
				
				if (targetId >= 0) {
					var events = _events[targetId][type];
					if (events) for (var x = 0; x < events.length; x++) events[x](event);	
				}
			}
			
			if (target) handleTarget(target);
			else for (var i = 0; i < targets.length; i++) handleTarget(targets[i]);
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
					var match = false;
					for (var i = 0; i < elements.length && !match; i++) if (elements[i] == target) match = true;
					if (!match) _unregisterEvent(target);
				}
			}
		}
	}
})();