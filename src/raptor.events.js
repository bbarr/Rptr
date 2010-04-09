/**
 * RAPTOR EVENTS - 'cause raptors do stuff
 */

raptor.events = (function() {
	
	var _events = {};
	
	var util = {
		/**
		 * Tests for data type by constructor name
		 * 
		 * @param {Array|String} types
		 * @param {Array|Boolean|Date|Math|Number|String|RegExp|Object|HTMLElement} data
		 */
		type : function(types, data) {
			var match = false;
			var test = function(type) {
				switch(type) {
					case 'Object':
						if (typeof data === 'object' && data.length == undefined && data != null) match = true;
					case 'HTMLElement':
						if (data.tagName) match = true;
					default:
						if (data.constructor && data.constructor.toString().indexOf(type) !== -1) match = true;		
				}
			}
			if (typeof types === 'string') test(types);
			else for (var i = 0; i < types.length && !match; i++) test(types[i]);
			return match;
		}
	}
	
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
		 * @param {String} event
		 * @param {Object} data
		 */
		'fire' : function(event, data) {
			data = data || {};
			event = event || window.event
			
			var type = event.type || event;
			type = 'on' + type;
			
			if (typeof _events[type] !== 'undefined') {
				var events = _events[type]
				
				var _fire = function(_event) {
					if (util.type('HTMLElement', this)) {
						return function(_event) {
							if (_event.target == this) {
								for (var cb in _event.callbacks) _event.callbacks[cb](data);	
							}	
						}
					}
					else return function(_event) {
						for (var cb in _event.callbacks) _event.callbacks[cb](data);
					}
				}();
				
				for (var e in events) {
					_fire(events[e]);
				}
			}
		}
	}
})();