raptor._events = (function() {
	
	// private
	var _events, _util;
	
	// public
	var api;
	
	// utility functions for event management
	_util = {
		format_event_type : function(type) {
 			return (type === 'DOMContentLoaded') ? type : 'on' + type;
		},
		find_events : function(target, collection) {
			for (var i in collection) {
				var event_set = collection[i];
				if (event_set.target === target) return event_set;
			}
			return false;
		}
	};
	
	// events managers
	_events = {
		browser : {
			collection : [],	
			add : function(target, type, cb) {
				var collection = _events.browser.collection;
				type = _util.format_event_type(type);
				var event_set = _util.find_events(target, collection);
				if (event_set) {
					var existing_events = events[target_id];
					var existing_events_of_type = existing_events[type];
					(existing_events_of_type) ? existing_events_of_type.push(cb) : existing_events[type] = [cb]; 
				}
				else {
					collection.push({
						'target' : target, 
						'types' : { 
							type : [cb] 
						}
					});
				}
				target[type] = _this.fire;
			},
			fire : function(event) {
				
				var event_set = _util.find_events(target, _events.browser.collection);
				if (!event_set) return false;
				
				var callbacks = event_set.types[event.type];
				if (!callbacks) return false;
				
				var custom_event = { 'browser_data' : event };
				custom_event['target'] = _util.find_target(event);
				custom_event.['preventDefault'] = (event.preventDefault) ? event.preventDefault : function() { event.cancelBubble = true });
				
				for (var i = 0, len = callbacks.length; i < len; i++) callbacks[i](custom_event);
			}
		},
		persistent : {
			collection : {},
			add : function(query, type, cb) {
				
				var existing_query = collection[query];
				if (existing_query) {
					var existing_query_type = existing_query.types[type];
					if (existing_query_type) {
						existing_query_type.push(cb);
					}
					else existing_query.types[type] = [cb];
				}
				
				var current_set = $p.hunt(query);
				api.add(current_set, type, cb);
			},
			fire : function() {}			
		},
		custom : {
			collection : [],
			add : function() {},
			fire : function() {}			
		}
	};
	
	api = {
		add : function(target, type, cb) {
			if (cb) {
				if (typeof target === 'string') {
					if (typeof cb === 'function') _events.persistent.add(target, type, cb);
					else _events.custom.add(target, type, cb);
				}
				else {
					if ($u.type('Array', target)) {
						for (var i = 0, len = target.lenght; i < len; i++) _events.browser.add(target, type, cb);
					}
					else _events.browser.add(target, type, cb);
				}
			}
			else _events.custom.add(target, type);
		},
		remove : function(target, type, cb) {},
		fire : function(target, data) {},
		apply_persistence : function(el) {},
		clear_missing : function() {}
	}
	
	return api;
})();