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
	
	/**
	*	Example structure:
	*
	*	_events = {
	*		0 : {
	*			'onclick' : [cb, cb, cb]
	*		},
	*		3 : {
	*			'itemClicked' : [cb],
	*			'onchange' : [cb, cb]
	*		}
	*	}
	*/
	var _events = {};
	
	
	/**
	*	Example structure:
	*
	*	_targets = {
	*		0 : HTMLElement,
	*		3 : HTMLElement
	*	}
	*/
	var _targets = {};
	
	/**
	*	Example structure:
	*
	*	_persists = {
	*		'a.ajax' : {
	*			'onclick' : [cb, cb]
	*		},
	*		'div#example input:disabled' : {
	*			'onchange' : [cb]
	*		}
	*	}
	*/
	var _persists = {};
	
	// this gets incremented and used as a unique ID for addition to _targets
	var _guid = 0;
	
	/**
	 * Registers persistent event conditions.
	 * query is a string to be used by Sizzle to check for matches in new elements
	 * 
	 * @param {String} query
	 * @param {String} type
	 * @param {Function} cb
	 */
	var _registerPersist = function(query, type, cb) {
		if (_persists[query]) {
			(_persists[query][type]) ? _persists[query][type].push(cb) : _persists[query][type] = [cb];
		}
		else {
			_persists[query] = {};
			_persists[query][type] = [cb];
		}
	}
	
	/**
	 * Registers event
	 * 
	 * @param {HTMLElement|Object} target
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
		
		(_events[targetId][type]) ? _events[targetId][type].push(cb) : _events[targetId][type] = [cb];
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
	 * @param {HTMLElement|Object} target
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
		 * @param {HTMLElement|Object|String} target
		 * @param {String} type
		 * @param {Function} cb
		 */
		'add' : function(target, type, cb) {
						
			cb = cb || null;
			var _this = this;
			
			var register = function(target, type, cb) {
				type = 'on' + type;
				_registerEvent(target, type, cb);
				target[type] = _this.fire;
			}
	
			// either global or persistent event is being registered
			if (raptor.util.type('String', target)) {
			
				// if cb exists, then a pesistent event is being registered
				if (cb) {
					_registerPersist(target, type, cb);
					
					var target = raptor.pack.hunt(target);
					for (var i = 0; i < target.length; i++) {
						register(target[i], type, cb);
					}
				}
				
				// if !cb then a global event is being registered
				else register('*', target, type);
			}
			
			// if (arrayOfTargets, type, callback);
			else if (raptor.util.type('Array', target)) {
				for (var i = 0; i < target.length; i++) {
					register(target[i], type, cb);
				}
			}
			
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

			// if multiple targets
			if (event.targets) var targets = event.targets;
			else {
				
				var target;
				
				// W3C
				if (event.target) {
					target = event.target;		
				}
				
				// IE
				else if (event.srcElement) {
					event.target = target = event.srcElement;
				}
				
				// global event
				else {
					event.target = target = '*';
				}
				
				// Safari bug
				if (target.nodeType === 3) target = target.parentNode;
				
				// if event happens on an child element, bubble up to the appropriate parent
				var id;
				while (id = _getTargetId(target) === -1) {
					target = target.parentNode;
					if (target === document.body) return false;
				}
			}
			
			// fire events on a given target
			var handleTarget = function(target) {
				var targetId = id || _getTargetId(target);
				
				if (targetId >= 0) {
					var events = _events[targetId][type];

					if (events) {
						for (var x = 0; x < events.length; x++) {
							events[x](event);
						}
					}
				}
			}					
			
			// call handleTarget on target(s)
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
				
				// proceed only if the target is an HTMLElement
				if (raptor.util.type('HTMLElement', target)) {
					
					// get elements by targets tagName and remove and targets that are not longer present in document
					var elements = raptor.pack.hunt(target.tagName);
					if (elements.indexOf(target) === -1) _unregisterEvent(target);
				}
			}
		},
		
		/**
		 * Checks a new element against persistent conditions, adding whatever events match 
		 *
		 * @param {HTMLElement} el
		 */
		'persist' : function(el) {
			for (var query in _persists) {
				var set = raptor.pack.hunt(query);
				
				// search set of elements to see if el is present
				if (set.indexOf(el) > -1) {
				
					// for each event type registered to that persist, cycle through and add each type
					// and its callbacks onto the new element
					for (var type in _persists[query]) {
						for (var i = 0; i < _persists[query][type].length; i++) {	
							this.add(el, type, _persists[query][type][i]);
						}
					}
				}
			}
		}
	}
})();
