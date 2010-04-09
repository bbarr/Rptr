/**
 * RAPTOR EVENTS - 'cause raptors do stuff
 */

raptor.events = (function() {
	
	var _events = {};
	
	return {
		
		/**
		 * 
		 * @param {Object|HTMLElement} target
		 * @param {Object} type
		 * @param {Object} cb
		 */
		'add' : function(target, type, cb) {
			var type = 'on' + type;
			
			if (typeof _events[type] === 'undefined') _events[type] = [{'target' : target, 'callbacks' : [cb]}];
			else {
				
				var exists = false;
				
				for (var targetData in _events[type]) {
					var data = _events[type][targetData]; 
					
					if (data.target == target) {
						data.callbacks.push(cb);	
						exists = true;
					}
				}
				
				if (!exists) _events[type].push({'target' : target, 'callbacks' : [cb]});
			}
			
			target[type] = this.fire;
		},
		
		/**
		 * Fires events
		 * 
		 * @param {Object} event
		 */
		'fire' : function(event) {

			event = event || window.event;
			var type = 'on' + event.type;
			
			var targets = [];
			if (event.targets || event.target) {
				targets = (event.targets) ? event.targets : [event.target];	
			}
			
			var fireEventSet = function(cbs) {
				for (var i = 0; i < cbs.length; i++) cbs[i](event)
			}
			
			if (typeof _events[type] !== 'undefined') {
				var events = _events[type];
				
				for (var x = 0; x < events.length; x++) {
					
					if (targets.length > 0) {
						for (var i = 0; i < targets.length; i++) {
							if (events[x].target == targets[i]) fireEventSet(events[x].callbacks); 
						}
					}
					else fireEventSet(events[x].callbacks);
				}
			}
		}
	}
})();