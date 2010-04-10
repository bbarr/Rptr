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
	
	return {
		
		/**
		 * Binds an event/callback to a specific target.
		 * 
		 * Supports custom events which can be fired
		 * using the below fire() method
		 * 
		 * @param {HTMLElement|Object|Array|Function} target
		 * @param {String} type
		 * @param {Function} cb
		 */
		'add' : function(target, type, cb) {
			var type = 'on' + type;
			
			// if no events of this type exist, instantiate event type, and add event instance
			if (typeof _events[type] === 'undefined') _events[type] = [{'target' : target, 'callbacks' : [cb]}];
			else {
				
				var exists = false;
				
				// cycle through targets attached to this event
				for (var targetData in _events[type]) {
					var data = _events[type][targetData]; 
					
					// if target is already bound to this event, add callback to queue
					if (data.target == target) {
						data.callbacks.push(cb);	
						exists = true;
					}
				}
				
				// if event type exists, but target is not already bound, bind it
				if (!exists) _events[type].push({'target' : target, 'callbacks' : [cb]});
			}
			
			target[type] = this.fire;
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
			
			/**
			 * Loops through array of callbacks and executes each
			 * passing the event/config object
			 * 
			 * @param {Function} cbs
			 */
			var fireEventSet = function(cbs) {
				for (var i = 0; i < cbs.length; i++) cbs[i](event)
			}
			
			// if events of that type exist
			if (typeof _events[type] !== 'undefined') {
				var events = _events[type];
				
				// loop through events
				for (var x = 0; x < events.length; x++) {
					
					// if multiple targets are specified, call each's callbacks
					if (targets.length > 0) {
						for (var i = 0; i < targets.length; i++) {
							if (events[x].target == targets[i]) fireEventSet(events[x].callbacks); 
						}
					}
					
					// else call the all callbacks associated with all targets of that event type
					else fireEventSet(events[x].callbacks);
				}
			}
		}
	}
})();